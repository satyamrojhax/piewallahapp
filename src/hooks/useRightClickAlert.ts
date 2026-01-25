import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

export const useRightClickAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  // Check if device is mobile
  const isMobileDevice = useCallback(() => {
    // Check for touch support
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Check screen size (optional, for additional mobile detection)
    const isSmallScreen = window.innerWidth <= 768;
    
    return hasTouchSupport || isMobileUA || isSmallScreen;
  }, []);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    // Only show alert on desktop/PC, not mobile
    if (isMobileDevice()) {
      return;
    }

    event.preventDefault();
    
    setPosition({
      x: event.clientX,
      y: event.clientY
    });
    
    setIsVisible(true);
  }, [isMobileDevice]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Add context menu event listener
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, handleClose]);

  return {
    isVisible,
    position,
    onClose: handleClose
  };
};
