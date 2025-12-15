import { PublicClientApplication, Configuration, AccountInfo } from '@azure/msal-browser';

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: '', // Will be set from settings
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

let msalInstance: PublicClientApplication | null = null;

export const initializeMsal = (clientId: string, tenantId?: string) => {
  msalConfig.auth.clientId = clientId;
  msalConfig.auth.authority = tenantId 
    ? `https://login.microsoftonline.com/${tenantId}`
    : 'https://login.microsoftonline.com/common';
  msalConfig.cache.cacheLocation = 'sessionStorage';
  msalInstance = new PublicClientApplication(msalConfig);
  return msalInstance.initialize();
};

export const getMsalInstance = () => {
  if (!msalInstance || !msalConfig.auth.clientId) {
    throw new Error('MSAL not initialized or clientId not configured. Call initializeMsal first.');
  }
  return msalInstance;
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'offline_access', 'User.Read', 'Mail.ReadWrite', 'Mail.Send'],
  prompt: 'select_account',
};

export const getActiveAccount = (): AccountInfo | null => {
  // Return null if MSAL is not initialized or clientId is not set
  if (!msalInstance || !msalConfig.auth.clientId) {
    return null;
  }
  
  try {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;
    
    return accounts[0];
  } catch (error) {
    // MSAL might not be fully initialized yet or configuration is invalid
    console.warn('MSAL not ready for account access:', error);
    return null;
  }
};

export const signInWithMicrosoft = async () => {
  const instance = getMsalInstance();
  try {
    const response = await instance.loginPopup(loginRequest);
    return response.account;
  } catch (error) {
    console.error('Microsoft sign-in failed:', error);
    throw error;
  }
};

export const signOutFromMicrosoft = async () => {
  const instance = getMsalInstance();
  const account = getActiveAccount();
  
  if (account) {
    await instance.logoutPopup({
      account,
      mainWindowRedirectUri: window.location.origin,
    });
  }
};

export const getAccessToken = async () => {
  const instance = getMsalInstance();
  const account = getActiveAccount();
  
  if (!account) {
    throw new Error('No active account found');
  }
  
  try {
    const response = await instance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    console.error('Failed to acquire token silently:', error);
    // Fallback to interactive token acquisition
    const response = await instance.acquireTokenPopup(loginRequest);
    return response.accessToken;
  }
};