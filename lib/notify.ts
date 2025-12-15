import { supabase } from '@/integrations/supabase/client';
import type { DeptKey, TeamsNotificationPayload, NotifyRequest, NotifyResponse } from '@/types';

/**
 * Get stored Teams webhook URL for a department from localStorage settings
 */
export function getStoredUrl(dept: DeptKey): string | null {
  try {
    const settingsJson = localStorage.getItem('onereply-settings');
    if (!settingsJson) return null;
    
    const settings = JSON.parse(settingsJson);
    if (!settings.webhooks) return null;
    
    const webhook = settings.webhooks.find((w: any) => w.department === dept);
    return (webhook?.url && webhook?.enabled) ? webhook.url : null;
  } catch (error) {
    console.error('Failed to get stored webhook URL:', error);
    return null;
  }
}

/**
 * Validate that a URL is a proper Teams webhook URL
 */
function validateWebhookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && 
           (urlObj.hostname.includes('office.com') || 
            urlObj.hostname.includes('outlook.com') ||
            urlObj.hostname.includes('powerplatform.com'));
  } catch {
    return false;
  }
}

/**
 * Send notification to a department via Teams webhook using server relay
 */
export async function notifyDept(dept: DeptKey, payload: TeamsNotificationPayload): Promise<void> {
  const flowUrl = getStoredUrl(dept);
  
  if (!flowUrl) {
    throw new Error(`Missing Teams webhook URL for ${dept}. Please configure it in Settings.`);
  }
  
  if (!validateWebhookUrl(flowUrl)) {
    throw new Error(`Invalid Teams webhook URL for ${dept}. Please check the URL in Settings.`);
  }
  
  try {
    // Make direct API call to Teams webhook (no edge function)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Teams notification timed out after 10 seconds')), 10000)
    );
    
    const notificationPromise = fetch(flowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    // Race between the notification and timeout
    const response = await Promise.race([notificationPromise, timeoutPromise]);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Teams webhook failed for ${dept}: HTTP ${response.status} - ${errorText}`);
    }
    
    console.log(`Teams notification sent successfully to ${dept} (HTTP ${response.status})`);
  } catch (error: any) {
    console.error(`Error notifying ${dept}:`, error);
    throw new Error(`Failed to notify ${dept}: ${error.message}`);
  }
}

/**
 * Send test notification to a department
 */
export async function sendTestNotification(dept: DeptKey): Promise<void> {
  const testPayload: TeamsNotificationPayload = {
    ticketId: 'test-ticket',
    sectionId: 'test-section',
    dept,
    subject: 'Test ping from OneReply',
    summary: 'If you can read this, webhook is wired correctly.',
    reviewUrl: `${window.location.origin}/ticket/new`
  };
  
  await notifyDept(dept, testPayload);
}