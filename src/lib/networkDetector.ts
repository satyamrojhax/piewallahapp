import "@/config/firebase";

export interface NetworkStatus {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export class NetworkDetector {
  private static instance: NetworkDetector;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = { online: navigator.onLine };

  private constructor() {
    this.setupEventListeners();
    this.updateConnectionInfo();
  }

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.currentStatus.online = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.currentStatus.online = false;
      this.notifyListeners();
    });

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.updateConnectionInfo();
      });
    }
  }

  private updateConnectionInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.currentStatus = {
        ...this.currentStatus,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public subscribe(listener: (status: NetworkStatus) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public isOnline(): boolean {
    return this.currentStatus.online;
  }

  public isSlowConnection(): boolean {
    const { effectiveType, downlink } = this.currentStatus;
    return (
      effectiveType === 'slow-2g' ||
      effectiveType === '2g' ||
      (downlink !== undefined && downlink < 0.1)
    );
  }
}

export const networkDetector = NetworkDetector.getInstance();
