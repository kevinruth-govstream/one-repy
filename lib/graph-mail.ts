import { getAccessToken } from './msal';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

interface GraphFolder {
  id: string;
  displayName: string;
}

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
  bodyPreview?: string;
  isRead?: boolean;
}

export interface InboxMessage {
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

export const getFolderIdByName = async (name: string): Promise<string | null> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/mailFolders?$select=displayName,id&$top=100`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get folders: ${response.statusText}`);
    }

    const data = await response.json();
    const folder = data.value?.find((f: GraphFolder) => 
      f.displayName.toLowerCase() === name.toLowerCase()
    );
    
    return folder ? folder.id : null;
  } catch (error) {
    console.error('Error getting folder by name:', error);
    throw error;
  }
};

export const getNewestMessage = async (folderId: string): Promise<GraphMessage | null> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/mailFolders/${folderId}/messages?$select=id,subject,receivedDateTime,from,body,webLink,internetMessageId&$orderby=receivedDateTime desc&$top=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value && data.value.length > 0 ? data.value[0] : null;
  } catch (error) {
    console.error('Error getting newest message:', error);
    throw error;
  }
};

export const listNewestMessages = async (folderId: string, top = 25): Promise<InboxMessage[]> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/mailFolders/${folderId}/messages?$select=id,subject,receivedDateTime,from,bodyPreview,webLink,internetMessageId,isRead&$orderby=receivedDateTime desc&$top=${top}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get messages: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.value || []).map((msg: GraphMessage): InboxMessage => ({
      id: msg.id,
      subject: msg.subject || '(No Subject)',
      receivedDateTime: msg.receivedDateTime,
      fromEmail: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name,
      bodyPreview: msg.bodyPreview || '',
      webLink: msg.webLink || '',
      internetMessageId: msg.internetMessageId || msg.id,
      isRead: msg.isRead || false,
    }));
  } catch (error) {
    console.error('Error listing newest messages:', error);
    throw error;
  }
};

export const getMessage = async (messageId: string): Promise<GraphMessage | null> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/messages/${messageId}?$select=id,subject,receivedDateTime,from,body,webLink,internetMessageId`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting message:', error);
    throw error;
  }
};

export const markRead = async (messageId: string): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark message as read: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const moveMessage = async (messageId: string, destinationFolderId: string): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `${GRAPH_ENDPOINT}/me/messages/${messageId}/move`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationId: destinationFolderId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to move message: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error moving message:', error);
    throw error;
  }
};

export const markProcessed = async (
  messageId: string, 
  mode: 'read' | 'move' = 'read',
  processedFolderId?: string
): Promise<void> => {
  if (mode === 'move' && processedFolderId) {
    await moveMessage(messageId, processedFolderId);
  } else {
    await markRead(messageId);
  }
};