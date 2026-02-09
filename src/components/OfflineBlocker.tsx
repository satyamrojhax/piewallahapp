import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import "@/config/firebase";

interface OfflineBlockerProps {
  children: React.ReactNode;
}

const OfflineBlocker: React.FC<OfflineBlockerProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      // User is back online - allowing app usage
      setIsOnline(true);
    };

    const handleOffline = () => {
      // User is offline - blocking app usage
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    // Check connection after a short delay
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOnline(true);
      }
      setIsRetrying(false);
    }, 2000);
  };

  // If online, allow app usage
  if (isOnline) {
    return <>{children}</>;
  }

  // If offline, show blocking screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center shadow-elevation-3">
        {/* Offline Icon */}
        <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <WifiOff className="h-10 w-10 text-orange-500 animate-pulse" />
        </div>
        
        {/* Main Message */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          You're Offline
        </h1>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Please connect to the internet to use the app.<br />
          Your login data is safely stored locally.
        </p>
        
        {/* Retry Button */}
        <Button 
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full mb-4 bg-primary hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking Connection...' : 'Try Again'}
        </Button>
        
        {/* Info Section */}
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Wifi className="h-4 w-4" />
              <span className="font-medium">What happens when you're back online:</span>
            </div>
            <ul className="text-left text-blue-600 mt-2 space-y-1">
              <li>• You'll remain logged in (no need to login again)</li>
              <li>• All your data is saved locally</li>
              <li>• App will work normally immediately</li>
            </ul>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <WifiOff className="h-4 w-4" />
              <span className="font-medium">Current Status:</span>
            </div>
            <p className="text-left text-green-600 mt-1">
              App is blocked to prevent errors. Your authentication token is safely stored in localStorage.
            </p>
          </div>
        </div>
        
        {/* Auto-retry indicator */}
        <div className="mt-4 text-xs text-muted-foreground">
          <p>• The app will automatically detect when you're back online</p>
          <p>• No login required when you reconnect</p>
        </div>
      </Card>
    </div>
  );
};

export default OfflineBlocker;
