import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

interface RightClickAlertProps {
  isVisible: boolean;
  onClose: () => void;
  x: number;
  y: number;
}

const RightClickAlert: React.FC<RightClickAlertProps> = ({ isVisible, onClose, x, y }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible) {
      // Calculate position to keep modal within viewport
      const modalWidth = 380;
      const modalHeight = 240;
      const padding = 20;
      
      let finalX = x;
      let finalY = y;
      
      if (x + modalWidth > window.innerWidth - padding) {
        finalX = window.innerWidth - modalWidth - padding;
      }
      
      if (y + modalHeight > window.innerHeight - padding) {
        finalY = window.innerHeight - modalHeight - padding;
      }
      
      setPosition({ x: finalX, y: finalY });
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, x, y, onClose]);

  if (!isVisible) return null;

  const handleInstagramClick = () => {
    window.open('https://instagram.com/satyamrojhax', '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className="absolute"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: 'auto',
        }}
      >
        <Card className="shadow-card border-border/60 overflow-hidden">
          <div className="relative">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6" />
                  <h3 className="font-bold text-lg">Access Restricted</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-foreground mb-2">
                  Need source code or API access?
                </p>
                <p className="text-muted-foreground text-sm">
                  Contact us for professional support and licensing
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleInstagramClick}
                  className="bg-gradient-primary hover:opacity-90 w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact on Instagram
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RightClickAlert;
