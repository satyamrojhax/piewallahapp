// API Configuration for Pie Wallah
import "@/config/firebase";

export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://api.penpencil.co',
  VIDEO_API_BASE_URL: import.meta.env.VITE_VIDEO_API_BASE_URL || 'https://api.penpencil.co',
  VIDEO_API_PROXY_BASE_URL: import.meta.env.VITE_VIDEO_API_PROXY_BASE_URL || 'https://piewallahapi.vercel.app',
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    LOGIN: '/v1/users/login',
    SEND_OTP: '/v1/users/get-otp',
    VERIFY_OTP: '/v1/users/verify-otp',
    REFRESH_TOKEN: '/v1/users/refresh-token',
    
    // User data
    USER_PROFILE: '/v3/users/profile',
    USER_BATCHES: '/v3/users/batches',
    
    // Content
    BATCHES: '/v3/batches',
    BATCH_DETAILS: '/v3/batches',
    SUBJECTS: '/v3/subjects',
    TOPICS: '/v3/topics',
    VIDEOS: '/v3/videos',
    
    // Video content
    VIDEO_CONTENT: '/api/video-content',
    VIDEO_STREAM: '/api/video',
    
    // Schedule
    SCHEDULE: '/v3/schedule',
    SCHEDULE_DETAILS: '/v3/schedule/details',
    
    // Attachments
    ATTACHMENTS: '/v3/attachments',
    
    // Slides
    SLIDES: '/v3/slides',
    
    // Homework
    HOMEWORK: '/v3/homework',
    DPP_HOMEWORK: '/v3/dpp-homework',
    
    // Notes
    NOTES: '/v3/notes',
    
    // Live classes
    LIVE_CLASSES: '/v3/live-classes',
    LIVE_CLASS_JOIN: '/v3/live-classes/join',
    
    // AI Guru
    AI_GURU: '/api/ai-guru',
    AI_GURU_CHAT: '/api/ai-guru/chat',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF_FACTOR: 2,
  },
  
  // Cache configuration
  CACHE: {
    TTL_MS: 5 * 60 * 1000, // 5 minutes
    MAX_SIZE: 100, // Maximum cached items
  },
};

// Helper function to build API URLs
export const buildApiUrl = (baseUrl: string, endpoint: string, params?: Record<string, string>): string => {
  const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  let url = `${baseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Helper function to build announcement API URLs
export const getAnnouncementApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const announcementBaseUrl = 'https://api.penpencil.co';
  const apiEndpoint = endpoint.startsWith('/v1') ? endpoint : `/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  let url = `${announcementBaseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Helper function to build general API URLs (alias for buildApiUrl)
export const getApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const baseUrl = 'https://api.penpencil.co';
  
  // Check if endpoint already has a version prefix
  let apiEndpoint = endpoint;
  if (!endpoint.startsWith('/v1') && !endpoint.startsWith('/v2') && !endpoint.startsWith('/v3')) {
    apiEndpoint = endpoint.startsWith('/') ? `/v3${endpoint}` : `/v3/${endpoint}`;
  } else {
    apiEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  let url = `${baseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Helper function to build attachments API URLs
export const getAttachmentsApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  const attachmentsBaseUrl = 'https://api.penpencil.co';
  
  // Check if endpoint already has a version prefix
  let apiEndpoint = endpoint;
  if (!endpoint.startsWith('/v1') && !endpoint.startsWith('/v2') && !endpoint.startsWith('/v3')) {
    apiEndpoint = endpoint.startsWith('/') ? `/v3${endpoint}` : `/v3/${endpoint}`;
  } else {
    apiEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  let url = `${attachmentsBaseUrl}${apiEndpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// Safe fetch wrapper with error handling and offline support
export const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  // Check if offline - don't make requests
  if (!navigator.onLine) {
    throw new Error('OFFLINE_MODE: No internet connection available');
  }

  try {
    const config: RequestInit = {
      ...options,
      mode: 'cors',
    };
    const response = await fetch(url, config);

    // Handle 401 responses immediately - check response body for unauthorized access
    if (response.status === 401) {
      // Clear all auth data immediately
      localStorage.removeItem("param_auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_expires_at");
      localStorage.removeItem("user_data");
      sessionStorage.removeItem("param_auth_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("token_expires_at");
      sessionStorage.removeItem("user_data");
      
      // Redirect to login immediately if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('UNAUTHORIZED: Access denied - redirecting to login');
    }

    if (!response.ok) {
      // Handle different HTTP status codes
      switch (response.status) {
        case 403:
          throw new Error('FORBIDDEN: You don\'t have permission to access this resource');
        case 404:
          throw new Error('NOT_FOUND: The requested resource was not found');
        case 429:
          throw new Error('RATE_LIMIT: Too many requests. Please try again later');
        case 500:
          throw new Error('SERVER_ERROR: Internal server error');
        case 502:
          throw new Error('BAD_GATEWAY: Server is temporarily unavailable');
        case 503:
          throw new Error('SERVICE_UNAVAILABLE: Service is temporarily unavailable');
        default:
          throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`);
      }
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('TIMEOUT: Request timed out');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('NETWORK_ERROR: Failed to connect to the server');
      }
      if (error.message.includes('CORS')) {
        throw new Error('CORS_ERROR: Cross-origin request blocked');
      }
      // Re-throw the original error
      throw error;
    }
    throw new Error('UNKNOWN_ERROR: An unexpected error occurred');
  }
};

// Retry wrapper for failed requests
export const fetchWithRetry = async (
  url: string, 
  options?: RequestInit, 
  attempt: number = 1
): Promise<Response> => {
  try {
    return await safeFetch(url, options);
  } catch (error) {
    if (attempt < API_CONFIG.RETRY.MAX_ATTEMPTS && 
        !error.message.includes('UNAUTHORIZED') && 
        !error.message.includes('FORBIDDEN')) {
      
      const delay = API_CONFIG.RETRY.DELAY_MS * Math.pow(API_CONFIG.RETRY.BACKOFF_FACTOR, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw error;
  }
};

// Simple cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  set(key: string, data: any): void {
    // Remove oldest item if cache is full
    if (this.cache.size >= API_CONFIG.CACHE.MAX_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if item is expired
    if (Date.now() - item.timestamp > API_CONFIG.CACHE.TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const apiCache = new ApiCache();

// Helper function for GET requests with caching
export const cachedFetch = async (url: string, useCache: boolean = true): Promise<any> => {
  const cacheKey = `GET:${url}`;
  
  if (useCache) {
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;
  }
  
  const response = await fetchWithRetry(url);
  const data = await response.json();
  
  if (useCache && response.ok) {
    apiCache.set(cacheKey, data);
  }
  
  return data;
};

// Helper function for POST requests
export const postRequest = async (url: string, data?: any): Promise<any> => {
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return response.json();
};

// Helper function for PUT requests
export const putRequest = async (url: string, data?: any): Promise<any> => {
  const response = await fetchWithRetry(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return response.json();
};

// Helper function for DELETE requests
export const deleteRequest = async (url: string): Promise<any> => {
  const response = await fetchWithRetry(url, {
    method: 'DELETE',
  });
  
  return response.json();
};

// Export default configuration
export default API_CONFIG;
