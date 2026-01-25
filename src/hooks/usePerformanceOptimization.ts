import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
  });
  const [isLowPerformanceMode, setIsLowPerformanceMode] = useState(false);

  useEffect(() => {
    // Check device performance
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;
      
      // Enable low performance mode for slow connections or low memory devices
      if (
        (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) ||
        (memory && memory.jsHeapSizeLimit < 50 * 1024 * 1024) // < 50MB
      ) {
        setIsLowPerformanceMode(true);
      }
    };

    // Measure initial load time
    const startTime = performance.now();
    
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    checkPerformance();
    
    // Measure load time after component mounts
    const timer = setTimeout(measureLoadTime, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const measureRenderTime = useCallback((fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    setMetrics(prev => ({ ...prev, renderTime: end - start }));
  }, []);

  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

  return {
    metrics,
    isLowPerformanceMode,
    measureRenderTime,
    debounce,
    throttle,
  };
};

// Lazy loading hook for images and components
export const useLazyLoad = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useState<HTMLDivElement>(null)[0];

  useEffect(() => {
    const element = elementRef;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          setHasLoaded(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [elementRef, threshold]);

  return { isIntersecting, hasLoaded, elementRef };
};

// Smooth scroll behavior
export const useSmoothScroll = () => {
  const scrollToElement = useCallback((elementId: string, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.offsetTop - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToElement, scrollToTop };
};
