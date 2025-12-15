import { getAccessToken } from './msal';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0';

export interface EmailMessage {
  subject: string;
  body: {
    contentType: 'HTML' | 'Text';
    content: string;
  };
  toRecipients: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  importance?: 'Low' | 'Normal' | 'High';
}

export const sendEmail = async (message: EmailMessage): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${GRAPH_ENDPOINT}/me/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        saveToSentItems: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.error?.message || response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending email via Microsoft Graph:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${GRAPH_ENDPOINT}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const createDraft = async (subject: string, html: string, to?: string) => {
  try {
    const accessToken = await getAccessToken();
    
    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: html,
      },
      toRecipients: to ? [{
        emailAddress: {
          address: to,
        },
      }] : [],
    };

    const response = await fetch(`${GRAPH_ENDPOINT}/me/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create draft: ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    return {
      id: result.id,
      webLink: result.webLink,
    };
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
};