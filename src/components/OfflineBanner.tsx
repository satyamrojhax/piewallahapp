import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OfflineBannerProps {
  onRetry?: () => void;
  showGamesAccess?: boolean;
  onAccessGames?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ 
  onRetry, 
  showGamesAccess = false,
  onAccessGames 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">You're Offline</p>
              <p className="text-xs opacity-90">Please Connect Internet and Try Again!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showGamesAccess && onAccessGames && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAccessGames}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Access Games
              </Button>
            )}
            
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Add some space below the fixed banner */}
      <div className="h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>
    </div>
  );
};

interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  showGamesAccess?: boolean;
  onAccessGames?: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  showGamesAccess = false,
  onAccessGames
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 p-6 shadow-elevation-3">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-orange-500" />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">You're Offline</h3>
          <p className="text-muted-foreground mb-6">
            Please Connect Internet! and Try Again!<br />
            You can still access downloaded content and games.
          </p>
          
          <div className="space-y-3">
            {showGamesAccess && onAccessGames && (
              <Button
                onClick={onAccessGames}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Access Games (Offline Available)
              </Button>
            )}
            
            <div className="flex gap-2">
              {onRetry && (
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Continue Offline
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Your authentication is saved locally. You'll remain logged in when you reconnect to the internet.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OfflineBanner;
