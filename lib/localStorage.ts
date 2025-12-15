import type { DeptKey } from './store';

// Teams webhook URL storage and validation
export interface TeamsConfig {
  department: DeptKey;
  webhookUrl: string;
  isValid: boolean;
  lastTested?: Date;
}

// Get webhook URL for department
export function getTeamsWebhook(department: DeptKey): string | null {
  return localStorage.getItem(`teams_webhook_${department}`);
}

// Set webhook URL for department
export function setTeamsWebhook(department: DeptKey, url: string): void {
  if (validateWebhookUrl(url)) {
    localStorage.setItem(`teams_webhook_${department}`, url);
  } else {
    throw new Error('Invalid webhook URL - must be HTTPS');
  }
}

// Remove webhook URL for department
export function removeTeamsWebhook(department: DeptKey): void {
  localStorage.removeItem(`teams_webhook_${department}`);
}

// Get all configured webhooks
export function getAllTeamsWebhooks(): TeamsConfig[] {
  const departments: DeptKey[] = ['transportation', 'building', 'utilities', 'land_use'];
  
  return departments.map(department => {
    const webhookUrl = getTeamsWebhook(department);
    return {
      department,
      webhookUrl: webhookUrl || '',
      isValid: webhookUrl ? validateWebhookUrl(webhookUrl) : false,
      lastTested: getLastTestedDate(department)
    };
  });
}

// Validate webhook URL format
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && 
           parsed.hostname.includes('office.com') &&
           parsed.pathname.includes('webhook');
  } catch {
    return false;
  }
}

// Test webhook connection
export async function testWebhookConnection(department: DeptKey): Promise<boolean> {
  const webhookUrl = getTeamsWebhook(department);
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": "Webhook Test",
        "sections": [{
          "activityTitle": "Webhook Connection Test",
          "activitySubtitle": `Department: ${department}`,
          "text": "This is a test message to verify webhook connectivity.",
          "markdown": true
        }]
      })
    });

    const success = response.ok;
    if (success) {
      setLastTestedDate(department);
    }
    
    return success;
  } catch (error) {
    console.error('Webhook test failed:', error);
    return false;
  }
}

// Store last tested date
function setLastTestedDate(department: DeptKey): void {
  localStorage.setItem(`teams_webhook_${department}_tested`, new Date().toISOString());
}

// Get last tested date
function getLastTestedDate(department: DeptKey): Date | undefined {
  const dateStr = localStorage.getItem(`teams_webhook_${department}_tested`);
  return dateStr ? new Date(dateStr) : undefined;
}

// Bulk configuration helpers
export function setAllTeamsWebhooks(configs: { department: DeptKey; url: string }[]): void {
  configs.forEach(({ department, url }) => {
    if (url.trim()) {
      setTeamsWebhook(department, url);
    } else {
      removeTeamsWebhook(department);
    }
  });
}

// Export configuration for backup
export function exportTeamsConfig(): Record<string, string> {
  const config: Record<string, string> = {};
  const departments: DeptKey[] = ['transportation', 'building', 'utilities', 'land_use'];
  
  departments.forEach(department => {
    const url = getTeamsWebhook(department);
    if (url) {
      config[department] = url;
    }
  });
  
  return config;
}

// Import configuration from backup
export function importTeamsConfig(config: Record<string, string>): void {
  Object.entries(config).forEach(([department, url]) => {
    if (department && url && validateWebhookUrl(url)) {
      setTeamsWebhook(department as DeptKey, url);
    }
  });
}

// Get configuration status summary
export function getConfigStatus(): {
  totalConfigured: number;
  totalDepartments: number;
  isComplete: boolean;
  missingDepartments: DeptKey[];
} {
  const allConfigs = getAllTeamsWebhooks();
  const configured = allConfigs.filter(config => config.isValid);
  const missing = allConfigs.filter(config => !config.isValid).map(config => config.department);
  
  return {
    totalConfigured: configured.length,
    totalDepartments: allConfigs.length,
    isComplete: configured.length === allConfigs.length,
    missingDepartments: missing
  };
}