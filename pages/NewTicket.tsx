import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { store, type DeptKey, type GatingMode, type DraftAtoms } from "@/lib/store";
import { getDepartment, departments, suggestDepartments, generateMockContent, generateAIContent, sectionTemplates, parseContentToAtoms } from "@/lib/departments";
import { isGenEnabled } from "@/lib/generate";
import { notifyDept } from "@/lib/notify";
import type { TeamsNotificationPayload } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { Plus, X, Sparkles, CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react";
import { rememberImported, stripHtml } from "@/lib/intake";
import { markProcessed, getFolderIdByName } from "@/lib/graph-mail";

const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  from: z.string().min(1, "From field is required"),
  body: z.string().min(1, "Body is required"),
  departments: z.array(z.string()).min(1, "At least one department must be selected"),
  gatingMode: z.enum(["all", "first"] as const),
});

type TicketForm = z.infer<typeof ticketSchema>;

const NewTicket = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDepts, setSelectedDepts] = React.useState<DeptKey[]>([]);
  const [suggestedDepts, setSuggestedDepts] = React.useState<DeptKey[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generationStatus, setGenerationStatus] = React.useState<string>("");
  const [notificationStatus, setNotificationStatus] = React.useState<Partial<Record<DeptKey, 'pending' | 'success' | 'error'>>>({});
  const [aiGenerationStatus, setAiGenerationStatus] = React.useState<Partial<Record<string, 'pending' | 'success' | 'error'>>>({});
  const [emailImportData, setEmailImportData] = React.useState<any>(null);

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      from: "",
      body: "",
      departments: [],
      gatingMode: "all",
    },
  });

  const onSubmit = async (data: TicketForm) => {
    console.log('🚀 onSubmit called! Form data:', data);
    try {
      console.log('Form submitted with data:', data);
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus("Creating ticket...");

      console.log('About to call store.createTicket...');
      // Create the ticket
      const ticket = await store.createTicket({
        subject: data.subject,
        from: data.from,
        body: data.body,
        departments: data.departments as DeptKey[],
        gatingMode: data.gatingMode as GatingMode,
      });

      console.log('Ticket created successfully:', ticket.id);

      setGenerationProgress(20);
      setGenerationStatus("Generating department drafts...");

      // Generate sections for each department
      const totalSections = data.departments.length * sectionTemplates.length;
      let completedSections = 0;
      const useAI = isGenEnabled();

      if (useAI) {
        setGenerationStatus("Using AI to generate realistic drafts...");
      }

      // Initialize AI generation status if using AI
      if (useAI) {
        const initialAIStatus: Partial<Record<string, 'pending' | 'success' | 'error'>> = {};
        for (const dept of data.departments as DeptKey[]) {
          for (const sectionTemplate of sectionTemplates) {
            initialAIStatus[`${dept}-${sectionTemplate.key}`] = 'pending';
          }
        }
        setAiGenerationStatus(initialAIStatus);
      }

      for (const dept of data.departments as DeptKey[]) {
        setGenerationStatus(`Generating ${getDepartment(dept).name} sections...`);
        
        let aiContent: string = '';
        let atoms: DraftAtoms = {
          situation: { understanding: [], propertyFacts: [] },
          guidance: { recommendations: [], citations: [] },
          nextsteps: { followups: [], actions: [] }
        };

        try {
          if (useAI) {
            // Generate single AI response for this department
            const aiResult = await generateAIContent(dept, 'situation', data.subject, data.body);
            aiContent = aiResult.content;
            atoms = aiResult.atoms;
            
            setAiGenerationStatus(prev => ({ ...prev, [`${dept}-ai`]: 'success' }));
          } else {
            // Use mock generator for situation only
            aiContent = generateMockContent(dept, 'situation', data.subject);
            atoms = parseContentToAtoms(aiContent, 'situation');
          }
        } catch (error) {
          console.warn(`AI generation failed for ${dept}, using fallback:`, error);
          
          // Fallback to mock content
          aiContent = generateMockContent(dept, 'situation', data.subject);
          atoms = parseContentToAtoms(aiContent, 'situation');
          
          if (useAI) {
            setAiGenerationStatus(prev => ({ ...prev, [`${dept}-ai`]: 'error' }));
            toast({
              title: `AI generation failed for ${getDepartment(dept).name}`,
              description: "Used template content instead.",
              variant: "destructive"
            });
          }
        }

        // Split AI content into 3 sections or create single section
        const { splitAIContentIntoSections } = await import('@/lib/sectionSplitter');
        const sections = splitAIContentIntoSections(aiContent, dept);
        
        // Create each section in the store
        for (const section of sections) {
          await store.createSection({
            ticketId: ticket.id,
            department: dept,
            sectionKey: section.sectionKey,
            title: section.title,
            content: section.content,
            atoms: section.atoms,
            order: completedSections,
          });

          completedSections++;
          setGenerationProgress(20 + (completedSections / totalSections) * 60);
        }
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setGenerationProgress(85);
      setGenerationStatus("Sending Teams notifications...");

      // Initialize notification status for all departments
      const initialStatus: Partial<Record<DeptKey, 'pending' | 'success' | 'error'>> = {};
      (data.departments as DeptKey[]).forEach(dept => {
        initialStatus[dept] = 'pending';
      });
      setNotificationStatus(initialStatus);

      // Send Teams notifications to each department
      const notificationResults: Array<{ dept: DeptKey; success: boolean; error?: string }> = [];
      
      for (const dept of data.departments as DeptKey[]) {
        const sections = store.getTicketSections(ticket.id).filter(s => s.department === dept);
        const sectionId = sections[0]?.id || '';

        const payload: TeamsNotificationPayload = {
          ticketId: ticket.id,
          sectionId,
          dept,
          subject: data.subject,
          summary: 'Approve or annotate your section by EOD.',
          reviewUrl: `${window.location.origin}/review/${ticket.id}`
        };

        // Make notification non-blocking - don't await
        notifyDept(dept, payload)
          .then(() => {
            notificationResults.push({ dept, success: true });
            setNotificationStatus(prev => ({ ...prev, [dept]: 'success' }));
            toast({
              title: `Sent to ${getDepartment(dept).name}`,
              description: "Teams notification sent successfully.",
            });
          })
          .catch((error: any) => {
            console.error(`Failed to notify ${dept}:`, error);
            notificationResults.push({ dept, success: false, error: error.message });
            setNotificationStatus(prev => ({ ...prev, [dept]: 'error' }));
            toast({
              title: `Failed to notify ${getDepartment(dept).name}`,
              description: error.message,
              variant: "destructive"
            });
          });
      }

      // Log initial status - actual results will come later
      console.log(`Teams notifications initiated for ${data.departments.length} departments`);

      // If this was an email import, mark as processed
      if (emailImportData) {
        try {
          const settings = JSON.parse(localStorage.getItem('onereply-settings') || '{}');
          const markProcessedEnabled = settings.microsoft?.markProcessed || false;
          const processedFolderName = settings.microsoft?.processedFolderName || 'OneReply Processed';
          
          if (markProcessedEnabled) {
            const processedFolderId = await getFolderIdByName(processedFolderName);
            if (processedFolderId) {
              await markProcessed(emailImportData.messageId, 'move', processedFolderId);
            } else {
              await markProcessed(emailImportData.messageId, 'read');
            }
          }
          rememberImported(emailImportData.internetMessageId);
        } catch (error) {
          console.warn('Failed to mark email as processed:', error);
        }
      }

      // Navigate to department selection page to start review process
      navigate(`/departments/${ticket.id}`);

      setGenerationProgress(100);
      setGenerationStatus("Complete!");

      toast({
        title: "Ticket Created Successfully",
        description: `Ticket "${ticket.subject}" has been created with ${totalSections} draft sections.`,
      });

    } catch (error) {
      console.error('❌ Error in onSubmit:', error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: `Failed to create ticket: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const addDepartment = (deptKey: DeptKey) => {
    console.log(`🏢 Adding department: ${deptKey}`);
    if (!selectedDepts.includes(deptKey)) {
      const newDepts = [...selectedDepts, deptKey];
      console.log(`📝 New departments list:`, newDepts);
      setSelectedDepts(newDepts);
      form.setValue("departments", newDepts);
      console.log(`✅ Form departments updated:`, form.getValues("departments"));
    }
  };

  const removeDepartment = (deptKey: DeptKey) => {
    const newDepts = selectedDepts.filter(d => d !== deptKey);
    setSelectedDepts(newDepts);
    form.setValue("departments", newDepts);
  };

  const availableDepts = departments.map(dept => dept.key).filter(
    dept => !selectedDepts.includes(dept)
  );

  // AI department suggestion
  const handleContentChange = () => {
    const subject = form.getValues("subject");
    const body = form.getValues("body");
    
    if (subject || body) {
      const suggestions = suggestDepartments(subject, body);
      setSuggestedDepts(suggestions.filter(dept => !selectedDepts.includes(dept)));
    } else {
      setSuggestedDepts([]);
    }
  };

  // Auto-suggest departments when content changes
  React.useEffect(() => {
    const subscription = form.watch(() => {
      handleContentChange();
    });
    return () => subscription.unsubscribe();
  }, [form, selectedDepts]);

  const applySuggestion = (dept: DeptKey) => {
    addDepartment(dept);
    setSuggestedDepts(prev => prev.filter(d => d !== dept));
  };

  // Handle email import pre-fill
  React.useEffect(() => {
    const emailImport = location.state?.emailImport;
    if (emailImport) {
      setEmailImportData(emailImport);
      
      // Pre-fill form with email data
      form.setValue("subject", emailImport.subject || "");
      form.setValue("from", emailImport.fromName || emailImport.from || "");
      form.setValue("body", stripHtml(emailImport.body || ""));
      
      // Trigger department suggestions after pre-filling
      setTimeout(() => {
        handleContentChange();
      }, 100);

      toast({
        title: "Email Imported",
        description: "Form pre-filled with email content. Review and select departments.",
      });
    }
  }, [location.state]);

  // Clear email import data from history after processing
  React.useEffect(() => {
    if (emailImportData && location.state?.emailImport) {
      // Replace current history entry to remove the email data
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [emailImportData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Create New Request</h1>
            {emailImportData && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email Import
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {emailImportData 
              ? "Review the imported email content and select departments for approval."
              : "Submit a new OneReply request for multi-department review and approval."
            }
          </p>
        </div>

        <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Request Information</CardTitle>
            <CardDescription>
              Provide details about the request and select the departments that need to review it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form 
                onSubmit={(e) => {
                  console.log('🎯 Form onSubmit handler called');
                  e.preventDefault();
                  const formData = form.getValues();
                  console.log('📋 Current form values:', formData);
                  const errors = form.formState.errors;
                  console.log('⚠️ Form errors:', errors);
                  if (Object.keys(errors).length > 0) {
                    console.error('❌ Form has validation errors, cannot submit');
                    return;
                  }
                  console.log('✅ Form validation passed, calling onSubmit...');
                  form.handleSubmit(onSubmit)(e);
                }} 
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ticket subject..." {...field} />
                      </FormControl>
                       <FormDescription>
                         A clear, descriptive subject for the request
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name or department..." {...field} />
                      </FormControl>
                       <FormDescription>
                         The person in city hall responsible for this request
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed information about the ticket..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                       <FormDescription>
                         Detailed description of what needs to be reviewed or approved
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gatingMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gating Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gating mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All departments must approve</SelectItem>
                          <SelectItem value="first">First approval wins</SelectItem>
                        </SelectContent>
                      </Select>
                       <FormDescription>
                         How should departments review this request?
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                   )}
                 />

                 {/* AI Suggestions */}
                 {suggestedDepts.length > 0 && (
                   <Card className="border-primary/20 bg-primary/5">
                     <CardContent className="pt-4">
                       <div className="flex items-center gap-2 mb-3">
                         <Sparkles className="h-4 w-4 text-primary" />
                         <h4 className="text-sm font-medium text-primary">AI Suggestions</h4>
                       </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Based on your request content, these departments might be relevant:
                        </p>
                       <div className="flex flex-wrap gap-2">
                         {suggestedDepts.map((dept) => (
                           <Button
                             key={dept}
                             type="button"
                             variant="outline"
                             size="sm"
                             className="h-auto p-1 border-primary/30 hover:bg-primary/10"
                             onClick={() => applySuggestion(dept)}
                           >
                             <Plus className="h-3 w-3 mr-1" />
                             <DepartmentBadge department={dept} className="border-0 bg-transparent" />
                           </Button>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 <div>
                   <FormLabel>Departments</FormLabel>
                    <FormDescription className="mb-4">
                      Select which departments need to review this request
                    </FormDescription>
                  
                  {selectedDepts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Selected Departments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDepts.map((dept) => (
                          <div key={dept} className="flex items-center gap-1">
                            <DepartmentBadge department={dept} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeDepartment(dept)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableDepts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Available Departments:</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableDepts.map((dept) => (
                          <Button
                            key={dept}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto p-1"
                            onClick={() => addDepartment(dept)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <DepartmentBadge department={dept} className="border-0 bg-transparent" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.formState.errors.departments && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      {form.formState.errors.departments.message}
                    </p>
                  )}
                </div>

                 {/* Progress Section */}
                 {isGenerating && (
                   <Card className="border-primary/20 bg-primary/5">
                     <CardContent className="pt-4">
                       <div className="space-y-3">
                         <div className="flex items-center gap-2">
                           <Loader2 className="h-4 w-4 animate-spin text-primary" />
                           <h4 className="text-sm font-medium text-primary">Creating Request</h4>
                         </div>
                          <Progress value={generationProgress} className="h-2" />
                          <p className="text-sm text-muted-foreground">{generationStatus}</p>
                          
                           {/* AI Generation Status */}
                           {isGenEnabled() && Object.keys(aiGenerationStatus).length > 0 && (
                             <div className="space-y-2">
                               <h5 className="text-sm font-medium text-primary">AI Generation Status</h5>
                               <div className="grid grid-cols-2 gap-2 text-xs">
                                 {Object.entries(aiGenerationStatus).map(([key, status]) => {
                                   const [dept, section] = key.split('-');
                                   return (
                                     <div key={key} className="flex items-center gap-2">
                                       {status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />}
                                       {status === 'success' && <CheckCircle className="h-3 w-3 text-green-500" />}
                                       {status === 'error' && <AlertCircle className="h-3 w-3 text-red-500" />}
                                       <span className="truncate">
                                         {getDepartment(dept as DeptKey).name} - {section}
                                       </span>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           )}
                           
                           {/* Notification Status */}
                          {Object.keys(notificationStatus).length > 0 && (
                            <div className="mt-4 space-y-2">
                              <div className="text-sm font-medium">Teams Notifications</div>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(notificationStatus).map(([dept, status]) => (
                                  <div key={dept} className="flex items-center gap-1">
                                    {status === 'pending' && (
                                      <>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                                        <span className="text-xs text-muted-foreground">
                                          {getDepartment(dept as DeptKey).name}...
                                        </span>
                                      </>
                                    )}
                                    {status === 'success' && (
                                      <>
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                        <span className="text-xs text-green-600">
                                          {getDepartment(dept as DeptKey).name}
                                        </span>
                                      </>
                                    )}
                                    {status === 'error' && (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-destructive" />
                                        <span className="text-xs text-destructive">
                                          {getDepartment(dept as DeptKey).name}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {generationProgress === 100 && (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Request created successfully!</span>
                            </div>
                          )}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={isGenerating || selectedDepts.length === 0}
                      onClick={() => {
                        console.log(`🔲 Submit button clicked! Departments: ${selectedDepts.length}, Generating: ${isGenerating}`);
                        console.log(`📋 Selected departments:`, selectedDepts);
                        console.log(`🎛️ Button disabled: ${isGenerating || selectedDepts.length === 0}`);
                      }}
                    >
                     {isGenerating ? (
                       <>
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         Creating...
                       </>
                     ) : (
                       "Create Request"
                     )}
                   </Button>
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={() => navigate("/")}
                     disabled={isGenerating}
                   >
                     Cancel
                   </Button>
                 </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewTicket;