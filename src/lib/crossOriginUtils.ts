// Utility functions for handling cross-origin video playback

export function addCrossOriginAttributes(videoElement: HTMLVideoElement): void {
    videoElement.crossOrigin = 'anonymous';
    videoElement.setAttribute('crossorigin', 'anonymous');
}

export const handleCrossOriginError = (error: Error, url: string) => {
  // Cross-origin error detected
  // URL that failed
  // This appears to be a CORS issue. The video server may need to allow cross-origin requests.
};

export function createCrossOriginVideoUrl(url: string): string {
    try {
        const urlObj = new URL(url, window.location.href);
        
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        const separator = urlObj.search ? '&' : '?';
        urlObj.search += `${separator}_t=${timestamp}`;
        
        return urlObj.toString();
    } catch (error) {
        // Failed to create cross-origin URL
        return url;
    }
}
