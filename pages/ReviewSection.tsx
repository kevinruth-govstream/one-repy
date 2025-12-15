import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SectionReviewCard } from "@/components/SectionReviewCard";
import { AnnotationPanel } from "@/components/AnnotationPanel";
import { ApprovalActions } from "@/components/ApprovalActions";
import { SectionNavigation } from "@/components/SectionNavigation";
import { store, getPendingSections, getTicketSections, type Section } from "@/lib/store";

const ReviewSection = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  
  const [section, setSection] = useState<Section | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [pendingSections, setPendingSections] = useState<Section[]>([]);
  const [content, setContent] = useState("");
  const [annotations, setAnnotations] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!sectionId) {
      navigate("/");
      return;
    }

    const currentSection = store.getSection(sectionId);
    if (!currentSection) {
      toast({
        title: "Section not found",
        description: "The requested section could not be found.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const currentTicket = store.getTicket(currentSection.ticketId);
    if (!currentTicket) {
      toast({
        title: "Ticket not found",
        description: "The parent ticket could not be found.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setSection(currentSection);
    setTicket(currentTicket);
    setContent(currentSection.content);
    setAnnotations([...currentSection.annotations]);
    
    // Load all sections for this ticket
    const ticketSections = getTicketSections(currentSection.ticketId);
    setAllSections(ticketSections);
    
    // Load pending sections for navigation
    const pending = getPendingSections();
    setPendingSections(pending.filter(s => s.ticketId === currentSection.ticketId));
    
    setHasUnsavedChanges(false);
  }, [sectionId, navigate]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(newContent !== section?.content);
  };

  const handleAddAnnotation = (annotation: string) => {
    const newAnnotations = [...annotations, annotation];
    setAnnotations(newAnnotations);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!section) return;

    try {
      const updatedSection = store.updateSection(section.id, {
        content,
        annotations,
      });

      if (updatedSection) {
        setSection(updatedSection);
        setHasUnsavedChanges(false);
        
        if (annotations.length > section.annotations.length) {
          store.logEvent(
            section.ticketId,
            'section_annotated',
            `Section annotated: ${section.sectionKey}`,
            section.department,
            section.sectionKey
          );
        }

        toast({
          title: "Changes saved",
          description: "Your changes have been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = () => {
    if (!section || !ticket) return;

    try {
      // Save current changes first
      if (hasUnsavedChanges) {
        store.updateSection(section.id, { content, annotations });
      }

      // Approve the section first
      store.updateSection(section.id, { status: 'approved' });
      
      // Apply gating logic
      store.applyGatingLogic(section.ticketId, section.department);
      
      // Log the approval
      store.logEvent(
        section.ticketId,
        'section_approved',
        `Section approved: ${section.sectionKey}`,
        section.department,
        section.sectionKey
      );

      toast({
        title: "Section approved",
        description: "The section has been approved successfully.",
      });

      // Navigate to next pending section or dashboard
      const remainingPending = getPendingSections().filter(s => 
        s.ticketId === section.ticketId && s.id !== section.id
      );
      
      if (remainingPending.length > 0) {
        navigate(`/section-review/${remainingPending[0].id}`);
      } else {
        toast({
          title: "All sections reviewed",
          description: "All sections for this ticket have been reviewed.",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Approval failed",
        description: "Failed to approve section. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    if (!section) return;

    try {
      // Save current changes first
      if (hasUnsavedChanges) {
        store.updateSection(section.id, { content, annotations });
      }

      // Reset to pending status for revision
      const updatedSection = store.updateSection(section.id, {
        status: 'pending'
      });

      if (updatedSection) {
        setSection(updatedSection);
        
        store.logEvent(
          section.ticketId,
          'section_annotated',
          `Section requires changes: ${section.sectionKey}`,
          section.department,
          section.sectionKey
        );

        toast({
          title: "Changes requested",
          description: "The section has been marked for revision.",
        });
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Failed to request changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDepartmentStatuses = () => {
    if (!ticket || !allSections.length) return {};
    
    const statuses: Record<string, any> = {};
    ticket.departments.forEach((dept: string) => {
      const deptSections = allSections.filter(s => s.department === dept);
      if (deptSections.length > 0) {
        // Use the most recent status
        statuses[dept] = deptSections[deptSections.length - 1].status;
      } else {
        statuses[dept] = 'pending';
      }
    });
    
    return statuses;
  };

  if (!section || !ticket) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading section...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        {/* Main Content Area */}
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Review Section
              </h1>
              <p className="text-muted-foreground">
                {ticket.subject}
              </p>
            </div>

            {/* Section Review Card */}
            <SectionReviewCard
              section={section}
              onContentChange={handleContentChange}
            />

            {/* Annotation Panel */}
            <AnnotationPanel
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onSave={handleSave}
              isModified={hasUnsavedChanges}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Sidebar */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="p-6 space-y-6">
            {/* Navigation */}
            <SectionNavigation
              currentSection={section}
              allSections={allSections}
              pendingSections={pendingSections}
            />

            {/* Approval Actions */}
            <ApprovalActions
              section={section}
              gatingMode={ticket.gatingMode}
              departmentStatuses={getDepartmentStatuses()}
              onApprove={handleApprove}
              onReject={handleReject}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ReviewSection;