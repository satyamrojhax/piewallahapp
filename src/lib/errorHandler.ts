// Error handling utility for API requests
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public url?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown, url?: string): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle network errors, certificate errors, etc.
    if (error.message.includes('ERR_CERT_COMMON_NAME_INVALID')) {
      return new ApiError(
        'Certificate error: The domain name does not match the SSL certificate. This is a server configuration issue.',
        undefined,
        'Certificate Error',
        url
      );
    }

    if (error.message.includes('ERR_NETWORK') || error.message.includes('fetch')) {
      return new ApiError(
        'Network error: Unable to connect to the server. Please check your internet connection.',
        undefined,
        'Network Error',
        url
      );
    }

    return new ApiError(error.message, undefined, undefined, url);
  }

  return new ApiError('An unknown error occurred', undefined, undefined, url);
};

export const createFallbackResponse = <T = any>(data: T, success = false) => {
  return {
    success,
    data,
    error: success ? null : 'API request failed, using fallback data',
    timestamp: new Date().toISOString()
  };
};

export const isRetryableError = (error: ApiError): boolean => {
  // Don't retry certificate errors or 4xx client errors
  if (error.message.includes('Certificate') || (error.status && error.status >= 400 && error.status < 500)) {
    return false;
  }
  
  // Retry network errors and 5xx server errors
  return true;
};
