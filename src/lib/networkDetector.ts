// Enhanced offline detection utilities

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

class NetworkDetector {
  private static instance: NetworkDetector;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine
  };

  private constructor() {
    this.setupEventListeners();
    this.startPeriodicChecks();
  }

  public static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true, isOffline: false });
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false, isOffline: true });
    });
  }

  private startPeriodicChecks() {
    // Check connectivity every 30 seconds
    setInterval(async () => {
      const isActuallyOnline = await this.checkRealConnectivity();
      const statusChanged = isActuallyOnline !== this.currentStatus.isOnline;
      
      if (statusChanged) {
        this.updateStatus({
          isOnline: isActuallyOnline,
          isOffline: !isActuallyOnline
        });
      }
    }, 30000);
  }

  private async checkRealConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://api.penpencil.co/v3/users?landingPage=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'randomid': crypto.randomUUID(),
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      // Any error means we're not properly connected
      return false;
    }
  }

  public updateStatus(newStatus: Partial<NetworkStatus>) {
    const previousStatus = { ...this.currentStatus };
    this.currentStatus = { ...this.currentStatus, ...newStatus };

    // Notify all listeners if status changed
    if (previousStatus.isOnline !== this.currentStatus.isOnline) {
      this.listeners.forEach(listener => listener(this.currentStatus));
    }
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public addListener(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.currentStatus);
  }

  public removeListener(listener: (status: NetworkStatus) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public async waitForConnection(timeout = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.currentStatus.isOnline) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        this.removeListener(handleOnline);
        resolve(false);
      }, timeout);

      const handleOnline = (status: NetworkStatus) => {
        if (status.isOnline) {
          clearTimeout(timer);
          this.removeListener(handleOnline);
          resolve(true);
        }
      };

      this.addListener(handleOnline);
    });
  }
}

// Export singleton instance
export const networkDetector = NetworkDetector.getInstance();

// Convenience functions
export const isOnline = (): boolean => networkDetector.getStatus().isOnline;
export const isOffline = (): boolean => networkDetector.getStatus().isOffline;
export const addNetworkListener = (listener: (status: NetworkStatus) => void) => 
  networkDetector.addListener(listener);
export const removeNetworkListener = (listener: (status: NetworkStatus) => void) => 
  networkDetector.removeListener(listener);
export const waitForConnection = (timeout?: number): Promise<boolean> => 
  networkDetector.waitForConnection(timeout);

// Enhanced safe fetch with better offline detection
export const safeFetchWithOfflineDetection = async (
  url: string, 
  options?: RequestInit
): Promise<Response> => {
  const networkStatus = networkDetector.getStatus();
  
  if (!networkStatus.isOnline) {
    throw new Error('OFFLINE_MODE: No internet connection available');
  }

  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(10000)
    });
    
    return response;
  } catch (error) {
    // API request failed
    
    // Update network status if this looks like a connectivity issue
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('NETWORK_TIMEOUT: Request timed out');
      }
      if (error.message.includes('fetch') || 
          error.message.includes('network') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')) {
        // Update our network detector to reflect the actual connectivity
        networkDetector.updateStatus({ isOnline: false, isOffline: true });
        throw new Error('NETWORK_ERROR: No internet connection or server unreachable');
      }
    }
    
    throw error;
  }
};
