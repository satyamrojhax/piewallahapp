import { useEffect } from 'react';

// Disable right-click context menu globally
export const useDisableRightClick = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable right-click on the entire document
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};

// Allow right-click only on specific elements (like video player)
export const useAllowRightClickOnElements = () => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if the right-click is on a video player or its container
      const isVideoPlayer = 
        target.tagName === 'VIDEO' ||
        target.closest('video') ||
        target.closest('[data-video-player]') ||
        target.closest('.video-player') ||
        target.closest('.vjs-tech') ||
        target.closest('.video-js') ||
        target.closest('[data-allow-right-click]');

      // Only allow right-click on video players
      if (!isVideoPlayer) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);
};
