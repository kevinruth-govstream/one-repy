import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getFolderIdByName, listNewestMessages, getMessage, markProcessed } from '@/lib/graph-mail';
import { hasImported, rememberImported, mapMsgToTicketSeed, sanitizeHtml, isAllowedSender } from '@/lib/intake';
import { createTicket } from '@/lib/store';
import { getActiveAccount } from '@/lib/msal';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  RefreshCw, 
  Mail, 
  ExternalLink, 
  Eye, 
  Download, 
  Search, 
  Folder,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface InboxMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  fromEmail: string;
  fromName?: string;
  bodyPreview: string;
  webLink: string;
  internetMessageId: string;
  isRead: boolean;
}

export const InboxIntake: React.FC = () => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [previewMessage, setPreviewMessage] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [account, setAccount] = useState<any>(null);

  // Check for Microsoft account safely
  useEffect(() => {
    try {
      const activeAccount = getActiveAccount();
      setAccount(activeAccount);
    } catch (error) {
      // MSAL not initialized yet, which is fine
      console.debug('MSAL not ready during InboxIntake initialization');
    }
  }, []);

  // Get settings from localStorage (same pattern as other components)
  const settings = JSON.parse(localStorage.getItem('onereply-settings') || '{}');
  const intakeFolderName = settings.microsoft?.intakeFolderName || 'OneReply Intake';
  const processedFolderName = settings.microsoft?.processedFolderName || 'OneReply Processed';
  const markAsProcessed = settings.microsoft?.markProcessed ?? true;
  const allowedDomains = settings.microsoft?.allowedSenderDomains 
    ? settings.microsoft.allowedSenderDomains.split(',').map(d => d.trim()).filter(Boolean)
    : [];

  const loadMessages = async () => {
    if (!account) {
      setError('Please sign in to Microsoft to access your inbox');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const folderId = await getFolderIdByName(intakeFolderName);
      
      if (!folderId) {
        setError(`Folder "${intakeFolderName}" not found. Create it in Outlook or update Settings.`);
        setMessages([]);
        return;
      }

      const fetchedMessages = await listNewestMessages(folderId, 25);
      
      // Filter by allowed domains if configured
      const filteredMessages = allowedDomains.length > 0 
        ? fetchedMessages.filter(msg => isAllowedSender(msg.fromEmail, allowedDomains))
        : fetchedMessages;
      
      setMessages(filteredMessages);
      
    } catch (error: any) {
      console.error('Error loading inbox messages:', error);
      setError(error.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadMessages();
  };

  const handleImport = async (message: InboxMessage) => {
    console.log('Import clicked for message:', message.id);
    
    try {
      // Check if already imported
      if (hasImported(message.internetMessageId)) {
        toast({
          title: "Already Imported",
          description: "This message has already been imported.",
          variant: "destructive"
        });
        return;
      }

      // Fetch full message content
      const fullMessage = await getMessage(message.id);
      if (!fullMessage) {
        throw new Error("Could not fetch full message content");
      }

      const bodyContent = fullMessage?.body?.content || message.bodyPreview;

      // Navigate to new ticket page with pre-filled data
      navigate('/ticket/new', {
        state: {
          emailImport: {
            subject: message.subject,
            from: message.fromEmail,
            fromName: message.fromName,
            body: bodyContent,
            messageId: message.id,
            internetMessageId: message.internetMessageId
          }
        }
      });

      toast({
        title: "Pre-filling Form",
        description: "Email data loaded into ticket form for review.",
      });
    } catch (error) {
      console.error('Error preparing email import:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to load email data",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async (message: InboxMessage) => {
    setPreviewLoading(true);
    try {
      const fullMessage = await getMessage(message.id);
      setPreviewMessage(fullMessage);
    } catch (error: any) {
      toast({
        title: "Preview Failed",
        description: error.message || 'Failed to load message preview',
        variant: "destructive"
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenInOutlook = (message: InboxMessage) => {
    if (message.webLink) {
      window.open(message.webLink, '_blank');
    }
  };

  // Filter messages based on search term
  const filteredMessages = messages.filter(msg => 
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.fromName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMessages, 30000); // 30 seconds
      setRefreshInterval(interval);
      return () => {
        clearInterval(interval);
        setRefreshInterval(null);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [account]);

  if (!account) {
    return (
      <Card className="border-gold/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Mail className="h-5 w-5" />
            Inbox Intake
          </CardTitle>
          <CardDescription>
            Sign in to Microsoft to access your Outlook inbox
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Inbox Intake
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {intakeFolderName}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm">
                Auto-refresh
              </Label>
            </div>
            
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {allowedDomains.length > 0 && (
            <Badge variant="secondary" className="shrink-0">
              Filtered to: {allowedDomains.join(', ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading messages...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {messages.length === 0 ? (
              <>
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails in '{intakeFolderName}'</p>
                <p className="text-sm mt-2">
                  Forward or tag emails (e.g., add #onereply to subject) and they'll appear here.
                </p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails match your search</p>
              </>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Subject</TableHead>
                  <TableHead className="w-[25%]">From</TableHead>
                  <TableHead className="w-[15%]">Received</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => {
                  const isImported = hasImported(message.internetMessageId);
                  const isImporting = importingId === message.id;
                  
                  return (
                    <TableRow key={message.id} className={isImported ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                          )}
                          <span className="truncate" title={message.subject}>
                            {message.subject}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="truncate" title={`${message.fromName || ''} <${message.fromEmail}>`}>
                          {message.fromName || message.fromEmail}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-muted-foreground" title={new Date(message.receivedDateTime).toLocaleString()}>
                          {formatDistanceToNow(new Date(message.receivedDateTime), { addSuffix: true })}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        {isImported ? (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Imported
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => handleImport(message)}
                            disabled={isImported || isImporting}
                            size="sm"
                            variant={isImported ? "outline" : "default"}
                            className="h-8 px-2"
                          >
                            {isImporting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isImported ? (
                              <ExternalLink className="h-3 w-3" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button
                                onClick={() => handlePreview(message)}
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[80vh]">
                              <DrawerHeader>
                                <DrawerTitle>Email Preview</DrawerTitle>
                              </DrawerHeader>
                              <div className="px-6 pb-6">
                                {previewLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                  </div>
                                ) : previewMessage ? (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Subject:</strong> {previewMessage.subject}
                                      </div>
                                      <div>
                                        <strong>From:</strong> {previewMessage.from?.emailAddress?.name || previewMessage.from?.emailAddress?.address}
                                      </div>
                                      <div>
                                        <strong>Received:</strong> {new Date(previewMessage.receivedDateTime).toLocaleString()}
                                      </div>
                                      <div>
                                        <strong>Message ID:</strong> {previewMessage.internetMessageId}
                                      </div>
                                    </div>
                                    <ScrollArea className="h-96 border rounded-lg p-4">
                                      <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ 
                                          __html: sanitizeHtml(previewMessage.body?.content || '') 
                                        }}
                                      />
                                    </ScrollArea>
                                  </div>
                                ) : (
                                  <p>Failed to load preview</p>
                                )}
                              </div>
                            </DrawerContent>
                          </Drawer>
                          
                          <Button
                            onClick={() => handleOpenInOutlook(message)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};