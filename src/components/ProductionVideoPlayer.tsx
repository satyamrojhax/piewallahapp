'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, RotateCcw, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';
import VideoControls from './VideoControls';

interface VideoData {
  success: boolean;
  source: string;
  powered_by: string;
  data: {
    url: string;
    signedUrl: string;
    urlType: 'penpencilvdo' | 'youtube';
    videoContainer: 'DASH';
    isCmaf?: boolean;
    cdnType?: string;
    original_source?: string;
  };
  stream_url: string;
  url_type: string;
  drm?: {
    kid: string;
    key: string;
  };
  timestamp?: string;
}

interface ProductionVideoPlayerProps {
  videoData: VideoData;
  autoplay?: boolean;
  className?: string;
}

const ProductionVideoPlayer: React.FC<ProductionVideoPlayerProps> = ({ 
  videoData, 
  autoplay = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLive, setIsLive] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<Array<{ label: string; value: number }>>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [previousSpeed, setPreviousSpeed] = useState(1);
  const [holdStartTime, setHoldStartTime] = useState<number>(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTapRef = useRef<number>(0);

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = useCallback((url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
      /^([^&\n?#]+)$/ // For bare video IDs
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, []);

  // Detect if stream is live
  const checkIsLive = useCallback((url: string): boolean => {
    // Only treat as live if URL contains "cloudfront"
    // Normal videos with signed URLs (Signature, Key-Pair-Id, Policy) are NOT live
    const isLiveStream = url.includes('cloudfront');
    
    return isLiveStream;
  }, []);

  // Handle fullscreen with orientation lock
  const handleFullscreenChange = useCallback(async () => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;
    setIsFullscreen(isCurrentlyFullscreen);

    if (isCurrentlyFullscreen) {
      // Lock to landscape on mobile when entering fullscreen
      if (window.innerWidth <= 768 && screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (err) {
          // Silent fail for orientation lock
        }
      }
    } else {
      // Unlock orientation when exiting fullscreen
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch (err) {
          // Silent fail for orientation unlock
        }
      }
    }
  }, []);

  // Initialize DRM Player for PenPencil videos
  const initializeDRMPlayer = useCallback(async () => {
    let player: any;

    try {
      // Check if DRM is required and available
      const needsDRM = videoData.drm && videoData.drm.kid && videoData.drm.key;
      const isCloudFront = videoData.data?.url?.includes('cloudfront.net') || 
                          videoData.data?.cdnType === 'Cloudfront' ||
                          videoData.stream_url?.includes('cloudfront.net');
      
      if (!needsDRM && !isCloudFront) {
        throw new Error('DRM keys are missing and this is not a CloudFront stream');
      }

      if (!videoData.stream_url && !videoData.data.url) {
        throw new Error('No video URL provided');
      }

      // Resolve final MPD URL
      const finalMPDUrl = videoData.stream_url || 
        (videoData.data.url + videoData.data.signedUrl);

      // Dynamically import Shaka Player
      // @ts-ignore - Shaka Player UI has TypeScript declaration issues
      const shaka = await import('shaka-player/dist/shaka-player.ui');
      
      if (!videoRef.current || !containerRef.current) {
        throw new Error('Video container not ready');
      }

      // Initialize Shaka Player
      player = new shaka.Player(videoRef.current);
      playerRef.current = player;

      // Configure DRM only if keys are available and it's not a CloudFront/live stream
      if (needsDRM && !isCloudFront) {
        try {
          player.configure({
            drm: {
              clearKeys: {
                [videoData.drm.kid]: videoData.drm.key
              }
            }
          });
        } catch (err) {
          throw new Error('DRM configuration failed');
        }
      } else {
        console.log('Skipping DRM configuration for CloudFront/live stream or no DRM keys available');
      }

      // Configure for live streaming support with HLS-specific optimizations
      const hlsConfig = {
        streaming: {
          rebufferingGoal: 2,
          bufferingGoal: 10,
          bufferBehind: 30,
          ignoreTextStreamFailures: true,
          alwaysStreamText: false,
          startAtSegmentBoundary: false,
          smallGapLimit: 0.5,
          jumpLargeGaps: true,
          durationBackoff: 1,
          stallEnabled: true,
          stallThreshold: 1,
          stallSkip: 0.1,
          // Live streaming specific configurations
          liveSync: {
            targetLatency: 3,
            maxLatency: 15,
            minLatency: 1,
            playbackRate: 1.0,
            driftCorrection: true,
          },
          // Low latency configuration
          lowLatencyMode: true,
          segmentPrefetchLimit: 2,
          // Retry configuration for live streams
          retryParameters: {
            maxAttempts: 5,
            baseDelay: 1000,
            backoffFactor: 2,
            fuzzFactor: 0.5,
          },
          // HLS specific configurations
          hls: {
            ignoreManifestTimestampsInSegmentsMode: false,
            segmentRelativeVttTiming: true,
          }
        },
        // Manifest configuration for live streams
        manifest: {
          defaultPresentationDelay: 10,
          segmentRelativeVttTiming: true,
          disableText: false,
          // HLS manifest specific
          hls: {
            ignoreManifestProgramDateTime: false,
            ignoreManifestEncoding: false,
          }
        },
        // Media source configuration
        mediaSource: {
          forceTransmux: false,
        }
      };
      
      // Special configuration for CDN streams
      if (videoData.data?.videoContainer === 'DASH' && finalMPDUrl.includes('pw.live')) {
        hlsConfig.streaming.retryParameters.maxAttempts = 8;
        hlsConfig.streaming.bufferingGoal = 15;
        hlsConfig.streaming.liveSync.targetLatency = 5;
      }
      
      player.configure(hlsConfig);

      // Enhanced request filter for CDN and signed URL streams
      player.getNetworkingEngine().registerRequestFilter((type: any, request: any) => {
        // Handle both SEGMENT and MANIFEST requests
        if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT || 
            type === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
          
          // Extract query parameters from the final MPD URL
          const mpdUrl = new URL(finalMPDUrl);
          const searchParams = mpdUrl.search;
          
          if (searchParams) {
            const queryString = searchParams.substring(1); // Remove the '?'
            
            request.uris = request.uris.map((uri: string) => {
              // If the segment URI already contains the query params, skip
              if (uri.includes(queryString)) {
                return uri;
              }
              
              // Append the full query string to each segment/manifest URI
              const separator = uri.includes('?') ? '&' : '?';
              return uri + separator + queryString;
            });
          }
        }
      });

      // Add response filter to handle CORS headers properly
      player.getNetworkingEngine().registerResponseFilter((type: any, response: any) => {
        if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
          // Ensure proper CORS headers for cross-origin video segments
          response.headers = response.headers || {};
          if (!response.headers['Access-Control-Allow-Origin']) {
            response.headers['Access-Control-Allow-Origin'] = '*';
          }
        }
      });

      // Error handling
      player.addEventListener('error', (event: any) => {
        const errorDetail = event.detail;
        let errorMessage = 'Playback error';
        
        if (errorDetail.code === 6001) {
          errorMessage = 'DRM license request failed';
        } else if (errorDetail.code === 6002) {
          errorMessage = 'DRM license parsing failed';
        } else if (errorDetail.code === 1002) {
          errorMessage = 'Network error - check your connection';
        } else if (errorDetail.code === 1201) {
          errorMessage = 'Invalid manifest format';
        }

        setError(errorMessage);
        setIsLoading(false);
      });

      // Load the DASH manifest
      try {
        await player.load(finalMPDUrl);
        setIsLoading(false);
        
        // Get available quality tracks
        const tracks = player.getVariantTracks();
        console.log('All tracks:', tracks); // Debug log
        
        const qualities = tracks
          .filter((track: any) => track.height && track.height > 0) // Only include tracks with valid height
          .map((track: any) => ({
            label: `${Math.round(track.height)}p`,
            value: track.bandwidth || 0,
            height: track.height
          }))
          .sort((a: any, b: any) => b.height - a.height); // Sort by height descending
        
        console.log('Available qualities:', qualities); // Debug log
        setAvailableQualities(qualities);
        setCurrentQuality(-1); // Start with Auto quality
        
        if (autoplay && videoRef.current) {
          videoRef.current.play().catch(() => {
            // Autoplay blocked - silent fail
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize player');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize player');
      setIsLoading(false);
    }
  }, [videoData, autoplay]);

  // Control functions
  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const handleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  const handleUnmute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setPreviousSpeed(speed); // Track the user's selected speed
    }
  }, []);

  const handlePictureInPicture = useCallback(async () => {
    if (videoRef.current && 'requestPictureInPicture' in videoRef.current) {
      try {
        await (videoRef.current as any).requestPictureInPicture();
      } catch (err) {
        console.error('Picture-in-Picture not supported');
      }
    }
  }, []);

  const handleSkipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  }, []);

  const handleSkipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  }, [duration]);

  const handlePlayPauseToggle = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleQualityChange = useCallback((quality: number) => {
    if (playerRef.current) {
      try {
        if (quality === -1) {
          // Auto quality - let Shaka Player handle it
          playerRef.current.configure('abr.enabled', true);
          setCurrentQuality(-1);
        } else {
          // Manual quality selection
          playerRef.current.configure('abr.enabled', false);
          const tracks = playerRef.current.getVariantTracks();
          const selectedTrack = tracks.find((track: any) => track.bandwidth === quality);
          if (selectedTrack) {
            playerRef.current.selectVariantTrack(selectedTrack, true);
            setCurrentQuality(quality);
          }
        }
      } catch (err) {
        console.error('Failed to change quality:', err);
      }
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      
      // Auto-rotate to landscape on mobile when entering fullscreen
      if (window.innerWidth <= 768 && screen.orientation && 'lock' in screen.orientation) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (err) {
          // Silent fail if orientation lock is not supported or denied
          console.log('Orientation lock not supported or denied');
        }
      }
    } else {
      await document.exitFullscreen();
    }
  }, []);

  // Retry playback
  const retryPlayback = useCallback(() => {
    setError(null);
    setIsLoading(true);
    
    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (err) {
        // Silent fail
      }
      playerRef.current = null;
    }

    // Reinitialize
    setTimeout(() => {
      if (videoData.data.urlType === 'penpencilvdo') {
        initializeDRMPlayer().catch(setError);
      }
    }, 100);
  }, [videoData.data.urlType, initializeDRMPlayer]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleWaiting = () => {
      setIsBuffering(true);
    };
    
    const handlePlaying = () => {
      setIsBuffering(false);
    };
    
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    
    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate);
    };

    const handleDurationChange = () => {
      setDuration(video.duration || 0);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  // Initialize player based on URL type
  useEffect(() => {
    const initPlayer = async () => {
      try {
        // Check if stream is live
        const streamUrl = videoData.stream_url || videoData.data.url;
        setIsLive(checkIsLive(streamUrl));

        if (videoData.data.urlType === 'youtube') {
          // YouTube player handles its own initialization
          setIsLoading(false);
          return;
        }

        if (videoData.data.urlType === 'penpencilvdo') {
          await initializeDRMPlayer();
          return;
        }

        throw new Error('Unsupported video type');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize player');
        setIsLoading(false);
      }
    };

    initPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          // Silent fail
        }
        playerRef.current = null;
      }
    };
  }, [videoData.data.urlType, videoData.stream_url, videoData.data.url, initializeDRMPlayer, checkIsLive]);

  // Fullscreen event listeners
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only on desktop
      if (window.innerWidth <= 768) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause();
            } else {
              videoRef.current.play();
            }
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
          break;
        case 'b':
          e.preventDefault();
          window.history.back();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, toggleFullscreen]);

  // Double tap to fullscreen (mobile only)
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    // Only on mobile
    if (window.innerWidth > 768) return;

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap detected
      toggleFullscreen();
      lastTapRef.current = 0;
    } else {
      // Single tap
      lastTapRef.current = now;
    }
  }, [toggleFullscreen]);

  // Render YouTube player
  if (videoData.data.urlType === 'youtube') {
    const videoUrl = videoData.stream_url || videoData.data.url;
    const videoId = extractYouTubeId(videoUrl);
    
    if (!videoId) {
      return (
        <div className={`flex items-center justify-center bg-black ${className}`}>
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white">Invalid YouTube URL</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        <YouTubePlayer videoId={videoId} autoplay={autoplay} />
      </div>
    );
  }

  // Render DRM player
  return (
    <div className={`relative bg-black overflow-hidden ${className}`} ref={containerRef}>
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        x-webkit-airplay="allow"
        onClick={handleVideoClick}
      />

      {/* Custom Video Controls */}
      <VideoControls
        videoRef={videoRef}
        containerRef={containerRef}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        isMuted={isMuted}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        isBuffering={isBuffering}
        playbackRate={playbackRate}
        isLive={isLive}
        availableQualities={availableQualities}
        currentQuality={currentQuality}
        error={error}
        autoHide={true}
        onPlay={handlePlay}
        onPause={handlePause}
        onMute={handleMute}
        onUnmute={handleUnmute}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        onFullscreen={toggleFullscreen}
        onSpeedChange={handleSpeedChange}
        onPictureInPicture={handlePictureInPicture}
        onQualityChange={handleQualityChange}
        onSkipBackward={handleSkipBackward}
        onSkipForward={handleSkipForward}
        onRetry={retryPlayback}
        showRetry={!!error}
        isLoading={isLoading}
      />

      {/* Video element with touch handlers */}
      {videoRef.current && (
        <div
          className="absolute inset-0 z-10"
          onTouchStart={(e) => {
            // Only on mobile devices (both portrait and landscape)
            if (window.innerWidth > 768) return;
            
            // Start hold timer
            setHoldStartTime(Date.now());
            
            // Clear any existing timeout
            if (holdTimeoutRef.current) {
              clearTimeout(holdTimeoutRef.current);
            }
            
            // Set timeout to activate 2X after 2 seconds
            holdTimeoutRef.current = setTimeout(() => {
              // Store current speed before boost
              setPreviousSpeed(videoRef.current?.playbackRate || 1);
              
              // Start speed boost
              if (videoRef.current) {
                videoRef.current.playbackRate = 2;
              }
              setIsSpeedBoost(true);
            }, 2000);
          }}
          onTouchEnd={(e) => {
            // Only on mobile devices (both portrait and landscape)
            if (window.innerWidth > 768) return;
            
            // Clear the 2-second timeout
            if (holdTimeoutRef.current) {
              clearTimeout(holdTimeoutRef.current);
            }
            
            // Check if hold was long enough to activate 2X
            const holdDuration = Date.now() - holdStartTime;
            if (holdDuration >= 2000) {
              // End speed boost after a short delay and restore previous speed
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = previousSpeed;
                }
                setIsSpeedBoost(false);
              }, 100);
            }
            
            // Reset hold start time
            setHoldStartTime(0);
          }}
        />
      )}

      {/* 2X Speed Indicator */}
      {window.innerWidth <= 768 && (
        <div className={`absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-opacity duration-200 z-40 ${
          isSpeedBoost ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          2X SPEED
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-6">{error}</p>
            <button
              onClick={retryPlayback}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionVideoPlayer;
