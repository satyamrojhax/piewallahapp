// API Configuration and utilities

// Function to get current domain and determine appropriate API base URLs
const getCurrentDomainConfig = () => {
  const currentDomain = window.location.hostname;
  
  if (currentDomain === 'piewallah.vercel.app') {
    return {
      API_BASE_URL: 'https://piewallah.vercel.app',
      ANNOUNCEMENT_API_BASE_URL: 'https://piewallah.vercel.app/announcement-api',
      VIDEO_PROXY_BASE_URL: 'https://piewallah.vercel.app/video-proxy',
      VIDEO_API_PROXY_BASE_URL: 'https://piewallah.vercel.app/video-api-proxy',
      ATTACHMENTS_API_BASE_URL: 'https://piewallahapi.vercel.app',
    };
  }
  
  // Default configuration for other domains (including localhost)
  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://satyamrojhax.vercel.app',
    ANNOUNCEMENT_API_BASE_URL: import.meta.env.VITE_ANNOUNCEMENT_API_BASE_URL || 'https://satyamrojhax.vercel.app/announcement-api',
    VIDEO_PROXY_BASE_URL: import.meta.env.VITE_VIDEO_PROXY_BASE_URL || 'https://satyamrojhax.vercel.app/video-proxy',
    VIDEO_API_PROXY_BASE_URL: import.meta.env.VITE_VIDEO_API_PROXY_BASE_URL || 'https://satyamrojhax.vercel.app/video-api-proxy',
    ATTACHMENTS_API_BASE_URL: import.meta.env.VITE_ATTACHMENTS_API_BASE_URL || 'https://piewallahapi.vercel.app',
  };
};

// API Configuration object using dynamic domain detection
export const API_CONFIG = getCurrentDomainConfig();

// Function to construct API URLs
export const getApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = API_CONFIG.API_BASE_URL;
  // Add /api prefix to the endpoint if it doesn't already have it
  const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  let url = `${baseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Function to construct announcement API URLs
export const getAnnouncementApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = API_CONFIG.ANNOUNCEMENT_API_BASE_URL;
  let url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Function to construct attachments API URLs
export const getAttachmentsApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = API_CONFIG.ATTACHMENTS_API_BASE_URL;
  // Add /api prefix to the endpoint if it doesn't already have it
  const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  let url = `${baseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Safe fetch wrapper with error handling and offline support
export const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  // Check if offline
  if (!navigator.onLine) {
    throw new Error('OFFLINE_MODE: No internet connection available');
  }

  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit', // Don't send credentials for cross-origin requests
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    return response;
  } catch (error) {
    // API request failed
    
    // Check if it's a network/offline error
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('NETWORK_TIMEOUT: Request timed out');
      }
      if (error.message.includes('fetch') || 
          error.message.includes('network') || 
          error.message.includes('Failed to fetch')) {
        throw new Error('NETWORK_ERROR: No internet connection or server unreachable');
      }
    }
    
    throw error;
  }
};

// Check if currently online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Wait for internet connection
export const waitForConnection = (timeout = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      resolve(false);
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
      resolve(true);
    };

    window.addEventListener('online', handleOnline);
  });
};