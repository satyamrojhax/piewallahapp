import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';

/**
 * PWAInstallPrompt – a component that listens for the `beforeinstallprompt`
 * event and offers the user a professional install prompt for the Progressive Web App.
 * 
 * Features:
 * - Professional banner design with app-like appearance
 * - Smooth animations and transitions
 * - Clear installation benefits
 * - Mobile and desktop optimized
 * - Proper PWA installation (not just add to homescreen)
 */
const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if running on iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(ios);

        // Check if app is already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
            }
        };
        checkInstalled();

        // Listen for display mode changes
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', checkInstalled);

        // Listen for the beforeinstallprompt event
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show if not already installed
            if (!isInstalled) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler as EventListener);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handler as EventListener);
            mediaQuery.removeEventListener('change', checkInstalled);
        };
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        try {
            // Show the native install prompt
            // @ts-ignore - the event type has a `prompt` method
            await (deferredPrompt as any).prompt();
            
            // Wait for the user to respond to the prompt
            // @ts-ignore - the event type has a `userChoice` promise
            const { outcome } = await (deferredPrompt as any).userChoice;
            
            // Reset state regardless of outcome
            setShowPrompt(false);
            setDeferredPrompt(null);
            
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
        } catch (error) {
            setShowPrompt(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for this session
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Don't show if already installed, dismissed in this session, or on iOS (which doesn't support PWA installation)
    if (isInstalled || !showPrompt || isIOS || sessionStorage.getItem('pwa-install-dismissed')) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white shadow-2xl border-t border-white/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* App Info */}
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">Install Pie Wallah</h3>
                                <p className="text-sm text-white/80">Get the full app experience - install for offline access & faster performance</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleInstallClick}
                                size="sm"
                                className="bg-white text-primary hover:bg-white/90 font-semibold px-4 py-2 h-auto"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Install
                            </Button>
                            
                            <Button
                                onClick={handleDismiss}
                                size="sm"
                                variant="ghost"
                                className="text-white/80 hover:text-white hover:bg-white/10 p-2 h-auto"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
