import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Copy, 
  Mail, 
  FileText, 
  Printer, 
  Check,
  ExternalLink,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Section } from '@/lib/store';
import { formatConsolidatedSection, consolidateSections } from '@/lib/consolidate';
import { sendEmail, createDraft } from '@/lib/graph';
import { getActiveAccount } from '@/lib/msal';

interface ExportOptionsProps {
  sections: Section[];
  visibleSections: Set<string>;
  isConsolidated: boolean;
  intro: string;
  outro: string;
  ticketId?: string;
}

export const ExportOptions = ({ 
  sections, 
  visibleSections, 
  isConsolidated, 
  intro, 
  outro,
  ticketId 
}: ExportOptionsProps) => {
  const [emailFormat, setEmailFormat] = useState<'html' | 'plain'>('html');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(`OneReply Response - Request #${ticketId?.slice(-6) || 'XXXXXX'}`);
  const [sendingEmail, setSendingEmail] = useState(false);

  const visibleSectionList = sections.filter(section => visibleSections.has(section.id));

  const generateEmailContent = (format: 'html' | 'plain' = 'html') => {
    const isHtml = format === 'html';
    const newline = isHtml ? '<br>' : '\n';
    const paragraph = isHtml ? '<p>' : '\n';
    const paragraphEnd = isHtml ? '</p>' : '\n';
    const bold = (text: string) => isHtml ? `<strong>${text}</strong>` : text;
    const italic = (text: string) => isHtml ? `<em>${text}</em>` : text;

    let content = '';

    // Header
    if (isHtml) {
      content += `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OneReply Response - Request #${ticketId?.slice(-6) || 'XXXXXX'}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #0066cc; font-weight: bold; margin-bottom: 10px; }
    .citations { background-color: #f8f9fa; padding: 10px; border-left: 4px solid #0066cc; margin-top: 10px; }
    .footer { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px; color: #666; }
  </style>
</head>
<body>`;
      
      content += `<div class="header">`;
      content += `<h2>OneReply Response</h2>`;
      content += `<p><strong>Request ID:</strong> #${ticketId?.slice(-6) || 'XXXXXX'}</p>`;
      content += `<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>`;
      content += `</div>`;
    } else {
      content += `ONEREPLY RESPONSE\n`;
      content += `Request ID: #${ticketId?.slice(-6) || 'XXXXXX'}\n`;
      content += `Date: ${new Date().toLocaleDateString()}\n`;
      content += `\n${'='.repeat(50)}\n\n`;
    }

    // Introduction
    if (intro) {
      content += isHtml ? `<div class="section">${intro.replace(/\n/g, '<br>')}</div>` : `${intro}\n\n`;
    }

    // Sections
    if (isConsolidated) {
      // First consolidate all visible sections
      const consolidatedAtoms = consolidateSections(visibleSectionList);
      
      // Then iterate through the 3 section types and format consolidated content
      const sectionTypes = ['situation', 'guidance', 'nextsteps'] as const;
      
      sectionTypes.forEach((sectionKey) => {
        const sectionContent = formatConsolidatedSection(sectionKey, consolidatedAtoms);
        
        if (!sectionContent.trim()) return; // Skip empty sections
        
        const title = sectionKey.replace(/([A-Z])/g, ' $1').trim();
        
        if (isHtml) {
          content += `<div class="section">`;
          content += `<h3 class="section-title">${title.toUpperCase()}</h3>`;
          content += `<p>${sectionContent.replace(/\n/g, '<br>')}</p>`;
          
          // Add citations if this is the guidance section
          if (sectionKey === 'guidance' && consolidatedAtoms.guidance.citations?.length > 0) {
            content += `<div class="citations">`;
            content += `<p><strong>Referenced Regulations:</strong></p>`;
            content += `<ul>`;
            consolidatedAtoms.guidance.citations.forEach(citation => {
              content += `<li><strong>${citation.code}</strong> - ${citation.description}</li>`;
            });
            content += `</ul>`;
            content += `</div>`;
          }
          content += `</div>`;
        } else {
          content += `${title.toUpperCase()}\n`;
          content += `\n${sectionContent}\n`;
          
          if (sectionKey === 'guidance' && consolidatedAtoms.guidance.citations?.length > 0) {
            content += `\nReferenced Regulations:\n`;
            consolidatedAtoms.guidance.citations.forEach(citation => {
              content += `• ${citation.code} - ${citation.description}\n`;
            });
          }
          content += `\n${'-'.repeat(30)}\n\n`;
        }
      });
    } else {
      // Individual sections - original logic
      visibleSectionList.forEach((section, index) => {
        const sectionContent = section.content;
        const title = section.sectionKey.replace(/([A-Z])/g, ' $1').trim();
        
        if (isHtml) {
          content += `<div class="section">`;
          content += `<h3 class="section-title">${title.toUpperCase()}</h3>`;
          content += `<p><em>Department: ${section.department}</em></p>`;
          content += `<p>${sectionContent.replace(/\n/g, '<br>')}</p>`;

          if (section.atoms.guidance?.citations?.length > 0) {
            content += `<div class="citations">`;
            content += `<p><strong>Referenced Regulations:</strong></p>`;
            content += `<ul>`;
            section.atoms.guidance.citations.forEach(citation => {
              content += `<li><strong>${citation.code}</strong> - ${citation.description}</li>`;
            });
            content += `</ul>`;
            content += `</div>`;
          }
          content += `</div>`;
        } else {
          content += `${title.toUpperCase()}\n`;
          content += `Department: ${section.department}\n`;
          content += `\n${sectionContent}\n`;

          if (section.atoms.guidance?.citations?.length > 0) {
            content += `\nReferenced Regulations:\n`;
            section.atoms.guidance.citations.forEach(citation => {
              content += `• ${citation.code} - ${citation.description}\n`;
            });
          }
          content += `\n${'-'.repeat(30)}\n\n`;
        }
      });
    }

    // Outro
    if (outro) {
      content += isHtml ? `<div class="footer">${outro.replace(/\n/g, '<br>')}</div>` : `${outro}\n`;
    }

    // OneReply Footer
    const oneReplyFooter = "Prepared with OneReply — one city, one voice.";
    if (isHtml) {
      content += `<div class="footer" style="text-align: center; font-style: italic; color: #666; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px;">${oneReplyFooter}</div>`;
      content += `</body></html>`;
    } else {
      content += `\n${'-'.repeat(50)}\n${oneReplyFooter}\n`;
    }

    return content;
  };

  const handleCopy = async (format: 'html' | 'plain', key: string) => {
    try {
      const content = generateEmailContent(format);
      await navigator.clipboard.writeText(content);
      
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
      
      toast.success(`${format.toUpperCase()} content copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  const handleDownload = (format: 'html' | 'plain') => {
    const content = generateEmailContent(format);
    const mimeType = format === 'html' ? 'text/html' : 'text/plain';
    const extension = format === 'html' ? 'html' : 'txt';
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onereply-response-${ticketId?.slice(-6) || 'XXXXXX'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Email exported as ${extension.toUpperCase()}`);
  };

  const handlePrint = () => {
    const content = generateEmailContent('html');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast.success('Print dialog opened');
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error('Please enter a recipient email address');
      return;
    }

    let microsoftUser;
    try {
      microsoftUser = getActiveAccount();
    } catch (error) {
      toast.error('Microsoft not configured. Please set up Microsoft integration in Settings first.');
      return;
    }
    
    if (!microsoftUser) {
      toast.error('Please sign in to Microsoft first in Settings');
      return;
    }

    setSendingEmail(true);
    try {
      const htmlContent = generateEmailContent('html');
      
      await sendEmail({
        subject: emailSubject,
        body: {
          contentType: 'HTML',
          content: htmlContent,
        },
        toRecipients: [{
          emailAddress: {
            address: recipientEmail,
          },
        }],
        importance: 'Normal',
      });

      toast.success('Email sent successfully!');
      setRecipientEmail('');
    } catch (error: any) {
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendToOutlook = async () => {
    let microsoftUser;
    try {
      microsoftUser = getActiveAccount();
    } catch (error) {
      toast.error('Microsoft not configured. Please set up Microsoft integration in Settings first.');
      return;
    }
    
    if (!microsoftUser) {
      toast.error('Please sign in to Microsoft first in Settings');
      return;
    }

    setSendingEmail(true);
    try {
      const htmlContent = generateEmailContent('html');
      
      const result = await createDraft(
        emailSubject,
        htmlContent,
        recipientEmail || undefined
      );

      // Open in Outlook Web App with popout mode
      const url = result.webLink?.includes('ispopout=')
        ? result.webLink
        : result.webLink + (result.webLink.includes('?') ? '&' : '?') + 'ispopout=1';
      
      window.open(url, '_blank');
      
      toast.success('Draft created in Outlook and opened in new tab!');
    } catch (error: any) {
      if (error.message.includes('401') || error.message.includes('403')) {
        toast.error('Authentication expired. Please sign in to Microsoft again in Settings.');
      } else {
        toast.error(`Failed to create draft: ${error.message}`);
      }
    } finally {
      setSendingEmail(false);
    }
  };

  const totalWords = (intro + outro + visibleSectionList.map(s => s.content).join(' ')).split(' ').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Export & Share</CardTitle>
          <Badge variant="outline">
            {visibleSectionList.length} sections ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold">{totalWords}</div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{visibleSectionList.length}</div>
            <div className="text-xs text-muted-foreground">Sections</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {new Set(visibleSectionList.map(s => s.department)).size}
            </div>
            <div className="text-xs text-muted-foreground">Departments</div>
          </div>
        </div>

        <Separator />

        {/* Copy Options */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopy('html', 'html')}
              className="w-full"
            >
              {copiedStates.html ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              HTML Format
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy('plain', 'plain')}
              className="w-full"
            >
              {copiedStates.plain ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Plain Text
            </Button>
          </div>
        </div>

        <Separator />

        {/* Download Options */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Files
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleDownload('html')}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              HTML File
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('plain')}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Text File
            </Button>
          </div>
        </div>

        <Separator />

        {/* Other Actions */}
        <div className="space-y-3">
          <h3 className="font-medium">Other Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="w-full"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
            <Button
              onClick={handleSendToOutlook}
              disabled={sendingEmail || (() => {
                try {
                  return !getActiveAccount();
                } catch {
                  return true;
                }
              })()}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Creating...' : 'Send to Outlook'}
            </Button>
          </div>
          {(() => {
            try {
              return !getActiveAccount();
            } catch {
              return true;
            }
          })() && (
            <p className="text-xs text-muted-foreground text-center">
              Sign in to Microsoft in Settings to enable Outlook integration
            </p>
          )}
        </div>

        {/* Send Email via Microsoft Graph */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Email Directly
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <Button
              onClick={handleSendEmail}
              disabled={!recipientEmail || sendingEmail || (() => {
                try {
                  return !getActiveAccount();
                } catch {
                  return true;
                }
              })()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
            {(() => {
              try {
                return !getActiveAccount();
              } catch {
                return true;
              }
            })() && (
              <p className="text-xs text-muted-foreground text-center">
                Sign in to Microsoft in Settings to enable email sending
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Email Client Helper */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Client Integration
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            Copy the HTML format and paste directly into your email client for the best formatting.
          </p>
          <p className="text-xs text-muted-foreground">
            Use plain text format for basic email clients or when formatting isn't supported.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
