'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import "@/config/firebase";

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  className?: string;
}

// Declare YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  autoplay = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let script: HTMLScriptElement | null = null;

    const initializePlayer = () => {
      if (!containerRef.current || !window.YT) return;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            cc_load_policy: 1,
            iv_load_policy: 3,
            showinfo: 0,
            controls: 1,
            disablekb: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              setIsLoading(false);
            },
            onError: (event: any) => {
              let errorMessage = 'Video failed to load';
              
              switch (event.data) {
                case 2:
                  errorMessage = 'Invalid video ID';
                  break;
                case 5:
                  errorMessage = 'HTML5 player error';
                  break;
                case 100:
                  errorMessage = 'Video not found or removed';
                  break;
                case 101:
                case 150:
                  errorMessage = 'Video embedding not allowed';
                  break;
              }
              
              setError(errorMessage);
              setIsLoading(false);
            }
          }
        });
      } catch (err) {
        setError('Failed to initialize YouTube player');
        setIsLoading(false);
      }
    };

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initializePlayer();
        return;
      }

      script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      
      window.onYouTubeIframeAPIReady = initializePlayer;
      
      document.head.appendChild(script);
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          // Silent fail
        }
      }
      
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, [videoId, autoplay]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black ${className}`}>
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white">Loading video...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
