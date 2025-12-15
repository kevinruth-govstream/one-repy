import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Webhook, 
  Building2, 
  Palette, 
  Database, 
  TestTube, 
  Download, 
  Upload,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  LogIn,
  LogOut,
  Mail,
  Sparkles,
  Loader2
} from 'lucide-react';
import { initializeMsal, signInWithMicrosoft, signOutFromMicrosoft, getActiveAccount } from '@/lib/msal';
import { getCurrentUser } from '@/lib/graph';
import { getDepartment } from '@/lib/departments';
import { sendTestNotification } from '@/lib/notify';
import { type DeptKey } from '@/lib/store';
import { getGenConfig, saveGenConfig, testGeneration, isGenEnabled, type GeneratorConfig } from '@/lib/generate';
import { DepartmentBadge } from '@/components/DepartmentBadge';
import { supabase } from '@/integrations/supabase/client';

interface WebhookConfig {
  department: DeptKey;
  url: string;
  enabled: boolean;
  lastTested?: Date;
  status?: 'success' | 'error' | 'pending';
}

interface SystemSettings {
  webhooks: WebhookConfig[];
  departments: Array<{
    key: DeptKey;
    name: string;
    color: string;
    description: string;
  }>;
  branding: {
    organizationName: string;
    logoUrl: string;
    primaryColor: string;
    emailSignature: string;
  };
  emailTemplates: {
    defaultIntro: string;
    defaultOutro: string;
  };
  microsoft: {
    clientId: string;
    tenantId: string;
    enabled: boolean;
    intakeFolderName: string;
    markProcessed: boolean;
    processedFolderName: string;
    allowedSenderDomains: string;
  };
  system: {
    defaultGating: 'all' | 'first';
    autoArchiveDays: number;
    enableAuditLog: boolean;
  };
}

const defaultSettings: SystemSettings = {
  webhooks: [
    { 
      department: 'transportation', 
      url: 'https://defaultf00749e377ee458db068a6003bcd19.7e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7030c9670d2247e3aafd50685597c1ea/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XlQwNW4F84zxOwF7MEPwh4mQvQoqnlx392vs63JcY0Y', 
      enabled: true 
    },
    { 
      department: 'building', 
      url: 'https://defaultf00749e377ee458db068a6003bcd19.7e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c0f3b4033a694e96838bc620983736ee/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_-GaPnzzpaC-tv3v2NYqbdlFV_R0FqvulRThxOQyb6c', 
      enabled: true 
    },
    { 
      department: 'utilities', 
      url: 'https://defaultf00749e377ee458db068a6003bcd19.7e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e870ed638b68489e89cc5b7410bf9e2f/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=LQ1b55KT5KEId-514cHU8kbz9zFTbQ0fMmRLm-VuEsU', 
      enabled: true 
    },
    { 
      department: 'land_use', 
      url: 'https://defaultf00749e377ee458db068a6003bcd19.7e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/159e0c1a0447416e9f61e4e5f04196ab/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZeWBIHJqgGHxdwutg97TyhCmeIXn5AkYyRHVntyX79E', 
      enabled: true 
    },
  ],
  departments: [
    { key: 'transportation', name: 'Transportation', color: 'blue', description: 'Roads, sidewalks, traffic' },
    { key: 'building', name: 'Building & Planning', color: 'green', description: 'Permits, structures, zoning' },
    { key: 'utilities', name: 'Utilities', color: 'purple', description: 'Water, sewer, storm drainage' },
    { key: 'land_use', name: 'Land Use', color: 'orange', description: 'Zoning, setbacks, subdivisions' },
  ],
  branding: {
    organizationName: 'City of Springfield',
    logoUrl: '',
    primaryColor: '#CA0079',
    emailSignature: 'Best regards,\nCity Staff'
  },
  emailTemplates: {
    defaultIntro: 'Thank you for your inquiry. After reviewing your request with the appropriate departments, here is our consolidated response:',
    defaultOutro: 'If you have any questions about this response, please don\'t hesitate to contact us.'
  },
  microsoft: {
    clientId: '',
    tenantId: '',
    enabled: false,
    intakeFolderName: 'OneReply Intake',
    markProcessed: false,
    processedFolderName: 'OneReply Processed',
    allowedSenderDomains: '',
  },
  system: {
    defaultGating: 'all',
    autoArchiveDays: 30,
    enableAuditLog: true
  }
};

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [microsoftUser, setMicrosoftUser] = useState<any>(null);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>(getGenConfig());
  const [testingGenerator, setTestingGenerator] = useState(false);
  const { toast } = useToast();

  // Helper function to safely convert string dates back to Date objects
  const deserializeSettings = (settings: SystemSettings): SystemSettings => {
    return {
      ...settings,
      webhooks: settings.webhooks.map(webhook => ({
        ...webhook,
        lastTested: webhook.lastTested ? new Date(webhook.lastTested) : undefined
      }))
    };
  };

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('onereply-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        // Convert string dates back to Date objects
        setSettings(deserializeSettings(parsedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
    
    // Load generator config
    setGeneratorConfig(getGenConfig());
    
    // Load Microsoft Client ID from Supabase
    const loadMicrosoftConfig = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-microsoft-config');
        if (data?.clientId) {
          setSettings(prev => ({
            ...prev,
            microsoft: {
              ...prev.microsoft,
              clientId: data.clientId,
              enabled: data.configured
            }
          }));
        }
      } catch (error) {
        console.debug('Microsoft config not available:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadMicrosoftConfig();
  }, []);

  // Separate effect for checking Microsoft account when clientId changes
  useEffect(() => {
    // Only check for Microsoft account if component is initialized and clientId is configured
    if (isInitialized && settings.microsoft.clientId) {
      try {
        const account = getActiveAccount();
        if (account) {
          setMicrosoftUser(account);
        }
      } catch (error) {
        // MSAL not initialized yet, which is fine
        console.debug('MSAL not ready during initial load');
      }
    }
  }, [isInitialized, settings.microsoft.clientId]);

  const saveSettings = () => {
    localStorage.setItem('onereply-settings', JSON.stringify(settings));
    saveGenConfig(generatorConfig);
    setHasChanges(false);
    toast({
      title: "Settings saved",
      description: "Your configuration has been saved successfully.",
    });
  };

  const testWebhook = async (department: DeptKey) => {
    setTestingWebhook(department);
    const webhook = settings.webhooks.find(w => w.department === department);
    
    if (!webhook?.url) {
      toast({
        title: "No webhook URL",
        description: "Please enter a webhook URL first.",
        variant: "destructive"
      });
      setTestingWebhook(null);
      return;
    }

    try {
      // Send actual test notification via the notify helper with timeout (increase to 15 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Webhook test timed out after 15 seconds')), 15000)
      );
      
      await Promise.race([
        sendTestNotification(department),
        timeoutPromise
      ]);
      
      setSettings(prev => ({
        ...prev,
        webhooks: prev.webhooks.map(w => 
          w.department === department 
            ? { ...w, lastTested: new Date(), status: 'success' as const }
            : w
        )
      }));
      
      toast({
        title: "Webhook test successful",
        description: `${getDepartment(department).name} webhook received test message successfully.`,
      });
    } catch (error: any) {
      setSettings(prev => ({
        ...prev,
        webhooks: prev.webhooks.map(w => 
          w.department === department 
            ? { ...w, lastTested: new Date(), status: 'error' as const }
            : w
        )
      }));
      
      toast({
        title: "Webhook test failed",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const updateWebhook = (department: DeptKey, updates: Partial<WebhookConfig>) => {
    setSettings(prev => ({
      ...prev,
      webhooks: prev.webhooks.map(w => 
        w.department === department ? { ...w, ...updates } : w
      )
    }));
    setHasChanges(true);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `onereply-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Settings exported",
      description: "Configuration file has been downloaded.",
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
        setHasChanges(true);
        toast({
          title: "Settings imported",
          description: "Configuration has been loaded successfully.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid configuration file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleMicrosoftSignIn = async () => {
    if (!settings.microsoft.clientId) {
      toast({
        title: "Microsoft Client ID required",
        description: "Please enter your Microsoft Client ID first.",
        variant: "destructive"
      });
      return;
    }

    if (!settings.microsoft.tenantId) {
      toast({
        title: "Microsoft Tenant ID required",
        description: "Please enter your Microsoft Tenant ID first.",
        variant: "destructive"
      });
      return;
    }

    setMicrosoftLoading(true);
    try {
      await initializeMsal(settings.microsoft.clientId, settings.microsoft.tenantId);
      const account = await signInWithMicrosoft();
      setMicrosoftUser(account);
      const user = await getCurrentUser();
      toast({
        title: "Microsoft sign-in successful",
        description: `Signed in as ${user.displayName}`,
      });
    } catch (error: any) {
      toast({
        title: "Microsoft sign-in failed",
        description: error.message || "Failed to sign in with Microsoft",
        variant: "destructive"
      });
    } finally {
      setMicrosoftLoading(false);
    }
  };

  const handleMicrosoftSignOut = async () => {
    try {
      await signOutFromMicrosoft();
      setMicrosoftUser(null);
      toast({
        title: "Signed out",
        description: "Successfully signed out from Microsoft",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const updateGeneratorConfig = (updates: Partial<GeneratorConfig>) => {
    setGeneratorConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const testAIGeneration = async () => {
    console.log('testAIGeneration called');
    console.log('Current generatorConfig:', generatorConfig);
    console.log('isGenEnabled():', isGenEnabled());
    setTestingGenerator(true);
    try {
      console.log('Testing AI generation with direct API approach...');
      
      const success = await testGeneration();
      console.log('testGeneration result:', success);
      
      if (success) {
        toast({
          title: "AI Generation test successful",
          description: "Successfully generated sample content with current settings.",
        });
      } else {
        toast({
          title: "AI Generation test failed", 
          description: "Please check your configuration and try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "AI Generation test failed",
        description: error.message || "Please check your configuration and try again.",
        variant: "destructive"
      });
    } finally {
      setTestingGenerator(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-transparent border-b border-primary/20 px-4 md:px-6 lg:px-8 py-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-foreground">System Settings</h1>
                <p className="text-muted-foreground mt-1">Configure OneReply for your organization</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Button onClick={saveSettings} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              )}
              
              <Button variant="outline" onClick={exportSettings} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              
              <label>
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Tabs defaultValue="webhooks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Departments</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">OneReply</span>
            </TabsTrigger>
            <TabsTrigger value="ai-generator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Generator</span>
            </TabsTrigger>
            <TabsTrigger value="microsoft" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Microsoft</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Testing</span>
            </TabsTrigger>
          </TabsList>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-2 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-secondary" />
                  Teams Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Configure Microsoft Teams webhook URLs for department notifications. Each department can have its own webhook for targeted notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.webhooks.map((webhook) => {
                  const dept = getDepartment(webhook.department);
                  return (
                    <div key={webhook.department} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DepartmentBadge department={webhook.department} />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={webhook.enabled}
                              onCheckedChange={(enabled) => updateWebhook(webhook.department, { enabled })}
                            />
                            <span className="text-sm text-muted-foreground">Enabled</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {webhook.status === 'success' && (
                            <Badge variant="outline" className="bg-success-10 text-success border-success-20">
                              <Check className="h-3 w-3 mr-1" />
                              Working
                            </Badge>
                          )}
                          {webhook.status === 'error' && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testWebhook(webhook.department)}
                            disabled={!webhook.url || testingWebhook === webhook.department}
                          >
                            {testingWebhook === webhook.department ? 'Testing...' : 'Test'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`webhook-${webhook.department}`}>Webhook URL</Label>
                        <Input
                          id={`webhook-${webhook.department}`}
                          value={webhook.url}
                          onChange={(e) => updateWebhook(webhook.department, { url: e.target.value })}
                          placeholder="https://your-org.webhook.office.com/webhookb2/..."
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      {webhook.lastTested && (
                        <p className="text-xs text-muted-foreground">
                          Last tested: {webhook.lastTested instanceof Date ? webhook.lastTested.toLocaleString() : 'Invalid date'}
                        </p>
                      )}
                    </div>
                  );
                })}
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Webhook URLs are obtained from Microsoft Teams by creating a "Workflows" connector. 
                    Each department should have its own Teams channel and webhook URL.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <Card className="bg-gradient-to-br from-teal/10 to-transparent border-2 border-teal/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-teal" />
                  Department Management
                </CardTitle>
                <CardDescription>
                  Configure departments, their colors, and descriptions for better organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.departments.map((dept) => (
                  <div key={dept.key} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <DepartmentBadge department={dept.key as DeptKey} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDept(editingDept === dept.key ? null : dept.key)}
                      >
                        {editingDept === dept.key ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {editingDept === dept.key ? 'Cancel' : 'Edit'}
                      </Button>
                    </div>
                    
                    {editingDept === dept.key && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>Department Name</Label>
                            <Input
                              value={dept.name}
                              onChange={(e) => {
                                setSettings(prev => ({
                                  ...prev,
                                  departments: prev.departments.map(d => 
                                    d.key === dept.key ? { ...d, name: e.target.value } : d
                                  )
                                }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          <div>
                            <Label>Color</Label>
                            <select
                              value={dept.color}
                              onChange={(e) => {
                                setSettings(prev => ({
                                  ...prev,
                                  departments: prev.departments.map(d => 
                                    d.key === dept.key ? { ...d, color: e.target.value } : d
                                  )
                                }));
                                setHasChanges(true);
                              }}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="blue">Blue</option>
                              <option value="green">Green</option>
                              <option value="purple">Purple</option>
                              <option value="orange">Orange</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={dept.description}
                            onChange={(e) => {
                              setSettings(prev => ({
                                ...prev,
                                departments: prev.departments.map(d => 
                                  d.key === dept.key ? { ...d, description: e.target.value } : d
                                )
                              }));
                              setHasChanges(true);
                            }}
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card className="bg-gradient-to-br from-accent/10 to-transparent border-2 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-accent" />
                  Municipal Branding
                </CardTitle>
                <CardDescription>
                  Customize the appearance and branding for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={settings.branding.organizationName}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          branding: { ...prev.branding, organizationName: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input
                      id="logo-url"
                      value={settings.branding.logoUrl}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          branding: { ...prev.branding, logoUrl: e.target.value }
                        }));
                        setHasChanges(true);
                      }}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label htmlFor="email-signature">Email Signature</Label>
                  <Textarea
                    id="email-signature"
                    value={settings.branding.emailSignature}
                    onChange={(e) => {
                      setSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, emailSignature: e.target.value }
                      }));
                      setHasChanges(true);
                    }}
                    rows={3}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Default Email Templates</h3>
                  <p className="text-sm text-muted-foreground">
                    Set default templates for email introductions and conclusions. These can be edited inline when assembling email responses.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <Label htmlFor="default-intro">Default Introduction</Label>
                      <Textarea
                        id="default-intro"
                        value={settings.emailTemplates.defaultIntro}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            emailTemplates: { ...prev.emailTemplates, defaultIntro: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="Thank you for your inquiry. After reviewing your request with the appropriate departments, here is our consolidated response:"
                        className="min-h-24"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {settings.emailTemplates.defaultIntro.length} characters
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="default-outro">Default Conclusion</Label>
                      <Textarea
                        id="default-outro"
                        value={settings.emailTemplates.defaultOutro}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            emailTemplates: { ...prev.emailTemplates, defaultOutro: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="If you have any questions about this response, please don't hesitate to contact us."
                        className="min-h-24"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {settings.emailTemplates.defaultOutro.length} characters
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microsoft Tab */}
          <TabsContent value="microsoft" className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-2 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Microsoft Graph Integration
                </CardTitle>
                <CardDescription>
                  Configure Microsoft Graph API to send emails directly from OneReply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="microsoft-client-id">Microsoft Client ID</Label>
                      <Input
                        id="microsoft-client-id"
                        value={settings.microsoft.clientId}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            microsoft: { ...prev.microsoft, clientId: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="Enter your Azure app client ID"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get this from your Azure App Registration. Required for Microsoft Graph API access.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="microsoft-tenant-id">Microsoft Tenant ID</Label>
                      <Input
                        id="microsoft-tenant-id"
                        value={settings.microsoft.tenantId}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            microsoft: { ...prev.microsoft, tenantId: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="Enter your Azure tenant ID"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your organization's tenant ID. Required for single-tenant apps.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.microsoft.clientId && (
                      <Badge variant="outline" className="bg-success-10 text-success border-success-20">
                        <Check className="h-3 w-3 mr-1" />
                        Client ID Set
                      </Badge>
                    )}
                    {settings.microsoft.tenantId && (
                      <Badge variant="outline" className="bg-success-10 text-success border-success-20">
                        <Check className="h-3 w-3 mr-1" />
                        Tenant ID Set
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Microsoft Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow OneReply to send emails directly via Microsoft Graph API.
                      </p>
                    </div>
                    <Switch
                      checked={settings.microsoft.enabled}
                      onCheckedChange={(enabled) => {
                        setSettings(prev => ({
                          ...prev,
                          microsoft: { ...prev.microsoft, enabled }
                        }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Intake Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure how OneReply imports emails from your Outlook mailbox.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="intake-folder-name">Intake Folder Name</Label>
                      <Input
                        id="intake-folder-name"
                        value={settings.microsoft.intakeFolderName}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            microsoft: { ...prev.microsoft, intakeFolderName: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="OneReply Intake"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Create an Outlook rule that moves tagged emails into this folder.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="processed-folder-name">Processed Folder Name</Label>
                      <Input
                        id="processed-folder-name"
                        value={settings.microsoft.processedFolderName}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            microsoft: { ...prev.microsoft, processedFolderName: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="OneReply Processed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Move imported messages to this folder.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="allowed-sender-domains">Allowed Sender Domains</Label>
                      <Input
                        id="allowed-sender-domains"
                        value={settings.microsoft.allowedSenderDomains}
                        onChange={(e) => {
                          setSettings(prev => ({
                            ...prev,
                            microsoft: { ...prev.microsoft, allowedSenderDomains: e.target.value }
                          }));
                          setHasChanges(true);
                        }}
                        placeholder="example.com, domain.org"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Comma-separated list of domains to filter emails by sender.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Mark Messages as Processed</Label>
                      <p className="text-sm text-muted-foreground">
                        Mark imported messages as read or move to processed folder.
                      </p>
                    </div>
                    <Switch
                      checked={settings.microsoft.markProcessed}
                      onCheckedChange={(markProcessed) => {
                        setSettings(prev => ({
                          ...prev,
                          microsoft: { ...prev.microsoft, markProcessed }
                        }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Connection</h3>
                  
                  {isInitialized && microsoftUser ? (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {microsoftUser.name?.charAt(0) || microsoftUser.username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{microsoftUser.name || microsoftUser.username}</p>
                            <p className="text-sm text-muted-foreground">{microsoftUser.username}</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleMicrosoftSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">No Microsoft account connected</p>
                          <p className="text-sm text-muted-foreground">
                            Sign in to enable email sending via Microsoft Graph
                          </p>
                        </div>
                        <Button 
                          onClick={handleMicrosoftSignIn}
                          disabled={!settings.microsoft.clientId || !settings.microsoft.tenantId || microsoftLoading}
                        >
                          <LogIn className="h-4 w-4 mr-2" />
                          {microsoftLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Setup Instructions:</strong><br />
                    1. Create an Azure App Registration in Azure Portal<br />
                    2. Add "Mail.Send" and "User.Read" API permissions<br />
                    3. Set redirect URI to your OneReply domain<br />
                    4. Copy the Client ID and paste it above
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-gradient-to-br from-professional/10 to-transparent border-2 border-professional/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-professional" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system-wide settings and workflow preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Default Gating Mode</Label>
                    <select
                      value={settings.system.defaultGating}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          system: { ...prev.system, defaultGating: e.target.value as 'all' | 'first' }
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="all">All departments must respond</option>
                      <option value="first">First responder wins</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Controls whether all departments must respond or if first response locks the department.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Auto-Archive (Days)</Label>
                    <Input
                      type="number"
                      value={settings.system.autoArchiveDays}
                      onChange={(e) => {
                        setSettings(prev => ({
                          ...prev,
                          system: { ...prev.system, autoArchiveDays: parseInt(e.target.value) || 30 }
                        }));
                        setHasChanges(true);
                      }}
                      min="1"
                      max="365"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically archive completed tickets after this many days.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Track all system activities and changes for compliance.
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.enableAuditLog}
                    onCheckedChange={(enabled) => {
                      setSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, enableAuditLog: enabled }
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-2 border-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-gold" />
                  Connection Testing
                </CardTitle>
                <CardDescription>
                  Test all connections and validate your configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.webhooks.map((webhook) => {
                    const dept = getDepartment(webhook.department);
                    return (
                      <div key={webhook.department} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <DepartmentBadge department={webhook.department} />
                          <div className="flex items-center gap-2">
                            {webhook.status === 'success' && (
                              <Check className="h-4 w-4 text-success" />
                            )}
                            {webhook.status === 'error' && (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                            {!webhook.status && (
                              <div className="h-4 w-4 rounded-full bg-muted" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">URL:</span>
                            <span className={webhook.url ? "text-foreground" : "text-muted-foreground"}>
                              {webhook.url ? "Configured" : "Not set"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={webhook.enabled ? "text-success" : "text-muted-foreground"}>
                              {webhook.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                           {webhook.lastTested && (
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">Last Test:</span>
                               <span className="text-foreground">
                                 {webhook.lastTested instanceof Date ? webhook.lastTested.toLocaleDateString() : 'Invalid date'}
                               </span>
                             </div>
                           )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => testWebhook(webhook.department)}
                          disabled={!webhook.url || testingWebhook === webhook.department}
                        >
                          {testingWebhook === webhook.department ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Testing sends a sample notification to each department's Teams channel to verify connectivity.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Generator Tab */}
          <TabsContent value="ai-generator" className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>
                  Configure AI-powered draft generation using OpenAI-compatible APIs. When enabled, OneReply will use AI to generate more realistic departmental responses instead of template content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">Enable AI Generation</h4>
                    <p className="text-sm text-muted-foreground">
                      Use AI to generate realistic draft responses instead of template content
                    </p>
                  </div>
                  <Switch
                    checked={generatorConfig.enabled}
                    onCheckedChange={(enabled) => updateGeneratorConfig({ enabled })}
                  />
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="gen-base-url">API Base URL</Label>
                    <Input
                      id="gen-base-url"
                      placeholder="https://api.groq.com/openai/v1"
                      value={generatorConfig.baseUrl}
                      onChange={(e) => updateGeneratorConfig({ baseUrl: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      OpenAI-compatible API endpoint (e.g., Groq, Together.ai, OpenAI, etc.)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gen-api-key">API Key</Label>
                    <Input
                      id="gen-api-key"
                      type="password"
                      placeholder="Enter your API key..."
                      value={generatorConfig.apiKey}
                      onChange={(e) => updateGeneratorConfig({ apiKey: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Your API key for the selected service
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gen-model">Model Name</Label>
                    <Input
                      id="gen-model"
                      placeholder="llama-3.1-8b-instruct"
                      value={generatorConfig.model}
                      onChange={(e) => updateGeneratorConfig({ model: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Model identifier (e.g., llama-3.1-8b-instruct, gpt-4, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={testAIGeneration}
                    disabled={testingGenerator || !generatorConfig.baseUrl || !generatorConfig.model}

                    className="gap-2"
                  >
                    {testingGenerator ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test Generation
                  </Button>
                  
                  {generatorConfig.enabled && (
                    <Badge variant="outline" className="bg-success-10 text-success border-success-20">
                      <Check className="h-3 w-3 mr-1" />
                      AI Generation Enabled
                    </Badge>
                  )}
                </div>

                {!generatorConfig.enabled && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      AI generation is disabled. When disabled, OneReply will use template-based content generation.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Providers</CardTitle>
                <CardDescription>
                  Examples of OpenAI-compatible API providers you can use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Groq (Recommended)</h5>
                    <p className="text-sm text-muted-foreground">Fast inference with Llama models</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      https://api.groq.com/openai/v1
                    </code>
                  </div>
                  
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">Together.ai</h5>
                    <p className="text-sm text-muted-foreground">Wide selection of open source models</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      https://api.together.xyz/v1
                    </code>
                  </div>
                  
                  <div className="p-3 border rounded">
                    <h5 className="font-medium">OpenAI</h5>
                    <p className="text-sm text-muted-foreground">GPT models (premium option)</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                      https://api.openai.com/v1
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}