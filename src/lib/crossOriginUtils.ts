// Cross-origin video utilities

export const isCrossOriginDomain = (url: string): boolean => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname !== window.location.hostname;
    } catch {
        return false;
    }
};

export const addCrossOriginAttributes = (videoElement: HTMLVideoElement) => {
    // Add cross-origin attributes for video playback across domains
    videoElement.crossOrigin = 'anonymous';
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('x-webkit-airplay', 'allow');
    
    // Add preload attribute for better performance
    videoElement.preload = 'metadata';
};

export const handleCrossOriginError = (error: Error, videoUrl: string) => {
    // Cross-origin video error handling
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        // CORS error detected
    }
    
    // Check if it's a network error
    if (error.message.includes('network') || error.message.includes('fetch')) {
        // Network error detected
    }
};

export const createCrossOriginVideoUrl = (originalUrl: string): string => {
    // Add timestamp to prevent caching issues
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}_t=${Date.now()}`;
};
