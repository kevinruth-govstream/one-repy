interface GraphMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  from: {
    emailAddress: {
      address: string;
      name?: string;
    };
  };
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  webLink?: string;
  internetMessageId?: string;
}

export interface TicketIntakeData {
  subject: string;
  fromEmail: string;
  fromName?: string;
  bodyHtml: string;
  received: string;
  messageId: string;
  source: string;
}

export const mapMessageToTicket = (msg: GraphMessage): TicketIntakeData => {
  return {
    subject: msg.subject || '(No Subject)',
    fromEmail: msg.from?.emailAddress?.address || '',
    fromName: msg.from?.emailAddress?.name,
    bodyHtml: msg.body?.content || '',
    received: msg.receivedDateTime,
    messageId: msg.internetMessageId || msg.id,
    source: 'outlook_graph'
  };
};

export const sanitizeHtml = (html: string): string => {
  // Remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
};

export const stripHtml = (html: string): string => {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Convert common block elements to line breaks
  const blockElements = tempDiv.querySelectorAll('p, div, br, h1, h2, h3, h4, h5, h6');
  blockElements.forEach(el => {
    if (el.tagName.toLowerCase() === 'br') {
      el.replaceWith('\n');
    } else {
      el.insertAdjacentText('afterend', '\n');
    }
  });
  
  // Get plain text content
  let text = tempDiv.textContent || tempDiv.innerText || '';
  
  // Clean up excessive whitespace while preserving intentional line breaks
  text = text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple line breaks with double
    .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
    .trim(); // Remove leading/trailing whitespace
  
  return text;
};

// In-memory deduplication for imported messages
const importedMessages = new Set<string>();

export const hasImported = (internetMessageId?: string): boolean => {
  return !!(internetMessageId && importedMessages.has(internetMessageId));
};

export const rememberImported = (internetMessageId?: string): void => {
  if (internetMessageId) {
    importedMessages.add(internetMessageId);
  }
};

export interface MessageSeed {
  id: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  bodyPreview: string;
  received: string;
  internetMessageId: string;
  webLink: string;
}

export const mapMsgToTicketSeed = (msg: any): MessageSeed => {
  return {
    id: msg.id,
    subject: msg.subject || '(No Subject)',
    fromEmail: msg.fromEmail || '',
    fromName: msg.fromName,
    bodyPreview: msg.bodyPreview || '',
    received: msg.receivedDateTime || new Date().toISOString(),
    internetMessageId: msg.internetMessageId || msg.id,
    webLink: msg.webLink || '',
  };
};

export const isAllowedSender = (fromEmail: string, allowedDomains: string[]): boolean => {
  if (!allowedDomains.length) return true;
  
  const domain = fromEmail.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return allowedDomains.some(allowed => 
    domain === allowed.toLowerCase().trim() || 
    domain.endsWith('.' + allowed.toLowerCase().trim())
  );
};