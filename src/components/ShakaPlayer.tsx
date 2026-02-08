import React, { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore - Shaka Player UI has TypeScript declaration issues
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';
import { Loader2, FastForward } from 'lucide-react';
import { addCrossOriginAttributes, handleCrossOriginError, createCrossOriginVideoUrl } from '@/lib/crossOriginUtils';

// Helper function to detect if a stream is live based on URL patterns
const isLiveStream = (manifestUrl: string): boolean => {
  return manifestUrl.includes('.m3u8') && 
         (manifestUrl.includes('live') || 
          manifestUrl.includes('stream') || 
          manifestUrl.includes('realtime') ||
          manifestUrl.includes('cloudfront') ||
          manifestUrl.includes('Signature=') ||
          manifestUrl.includes('Key-Pair-Id=') ||
          manifestUrl.includes('Policy='));
};

interface ShakaPlayerProps {
    manifestUrl: string;
    drm?: {
        keyid: string;
        key: string;
    };
    autoplay?: boolean;
    cdnType?: string;
    urlType?: string;
}

const ShakaPlayer: React.FC<ShakaPlayerProps> = ({ manifestUrl, drm, autoplay = false, cdnType, urlType }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSpeedBoostActive, setIsSpeedBoostActive] = useState(false);
    const [originalPlaybackRate, setOriginalPlaybackRate] = useState(1);
    const speedBoostTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle fullscreen change to lock orientation
    useEffect(() => {
        const handleFullscreenChange = async () => {
            if (document.fullscreenElement) {
                // Entered fullscreen - lock to landscape on mobile devices
                if (screen.orientation && 'lock' in screen.orientation) {
                    try {
                        // On mobile, prefer landscape, but allow any orientation if landscape fails
                        if (window.innerWidth <= 768) {
                            await (screen.orientation as any).lock('landscape');
                        } else {
                            await (screen.orientation as any).lock('any');
                        }
                    } catch (err) {
                        // Fallback: try to rotate using screen orientation API
                        if (screen.orientation && 'angle' in screen.orientation) {
                            try {
                                await (screen.orientation as any).lock('any');
                            } catch (fallbackErr) {
                                // console.warn('Screen orientation lock failed:', fallbackErr);
                            }
                        }
                    }
                }
            } else {
                // Exited fullscreen - unlock orientation
                if (screen.orientation && 'unlock' in screen.orientation) {
                    try {
                        (screen.orientation as any).unlock();
                    } catch (err) {
                        // console.warn('Screen orientation unlock failed:', err);
                    }
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        // Also listen for webkitfullscreenchange for iOS compatibility
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        let player: any;
        let ui: any;

        const initPlayer = async () => {
            if (!videoRef.current || !containerRef.current) return;

            // Initialize Shaka Player
            player = new shaka.Player(videoRef.current);
            playerRef.current = player;

            // Attach player to the window for debugging purposes
            (window as any).player = player;

            // Listen for error events
            player.addEventListener('error', (event: any) => {
                                const errorDetail = event.detail;
                let errorMessage = `Error code: ${errorDetail.code}`;
                
                // Handle cross-origin errors specifically
                handleCrossOriginError(new Error(errorMessage), manifestUrl);
                
                // More specific error messages for live streaming
                if (errorDetail.code === 1002) { // HTTP_ERROR
                    errorMessage += ' - Network error, check live stream URL';
                } else if (errorDetail.code === 1003) { // TIMEOUT
                    errorMessage += ' - Stream timeout, live stream may be offline';
                } else if (errorDetail.code === 1201) { // MANIFEST_PARSE_FAILED
                    errorMessage += ' - Invalid manifest format';
                } else if (errorDetail.code === 4002) { // SUPPORT_ERROR
                    errorMessage += ' - Browser does not support this stream format';
                }
                
                setError(errorMessage);
            });

            // Add live stream specific event listeners
            player.addEventListener('streaming', () => {
                            });

            player.addEventListener('adaptation', () => {
                            });

            // Configure DRM if provided, but skip for live streams and CloudFront CDN
            const isLive = isLiveStream(manifestUrl);
            const isCloudFront = cdnType === 'Cloudfront' || manifestUrl.includes('cloudfront') || manifestUrl.includes('cloudfront.net');
            
            if (drm && !isLive && !isCloudFront) {
                                
                player.configure({
                    drm: {
                        clearKeys: {
                            [drm.keyid]: drm.key
                        }
                    }
                });
                
                            } else if (drm && (isLive || isCloudFront)) {
                console.log('DRM provided but skipped for live stream or CloudFront CDN');
                // No DRM configuration for live streams or CloudFront CDN
            } else {
                // No DRM configuration provided
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
                        targetLatency: 3, // Target 3 seconds latency for live
                        maxLatency: 15, // Maximum 15 seconds latency
                        minLatency: 1, // Minimum 1 second latency
                        playbackRate: 1.0, // Normal playback rate
                        driftCorrection: true, // Enable drift correction
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
                    defaultPresentationDelay: 10, // 10 seconds default delay
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
                    forceTransmux: false, // Allow native playback when possible
                }
            };
            
            // Special configuration for Cloudfront CDN HLS streams
            if (isCloudFront) {
                hlsConfig.streaming.retryParameters.maxAttempts = 8; // More retries for CDN
                hlsConfig.streaming.bufferingGoal = 15; // Larger buffer for CDN
                hlsConfig.streaming.liveSync.targetLatency = 5; // Slightly higher target latency
                
                // Additional optimizations for live CloudFront streams
                if (isLive) {
                    hlsConfig.streaming.retryParameters.maxAttempts = 10; // Even more retries for live
                    hlsConfig.streaming.bufferingGoal = 20; // Even larger buffer for live
                    hlsConfig.streaming.liveSync.targetLatency = 8; // Higher target latency for stability
                    hlsConfig.streaming.liveSync.maxLatency = 30; // Higher max latency for live
                    hlsConfig.streaming.lowLatencyMode = false; // Disable low latency mode for stability
                }
            }
            
            player.configure(hlsConfig);

            // Enhanced request filter for Cloudfront CDN and HLS streams
            player.getNetworkingEngine().registerRequestFilter((type: any, request: any) => {
                // Handle both SEGMENT and MANIFEST requests for Cloudfront CDN
                if (type === shaka.net.NetworkingEngine.RequestType.SEGMENT || 
                    type === shaka.net.NetworkingEngine.RequestType.MANIFEST) {
                    
                                        
                    // Special handling for Cloudfront CDN HLS streams
                    if (isCloudFront) {
                        const manifestUrlObj = new URL(manifestUrl, window.location.href);
                        const searchParams = manifestUrlObj.search;
                        
                        if (searchParams) {
                            // Extract the full query string (Signature, Key-Pair-Id, Policy)
                            const queryString = searchParams.substring(1); // Remove the '?'
                            
                            request.uris = request.uris.map((uri: string) => {
                                // For each segment/manifest URI, append the full Cloudfront signature
                                if (uri.includes(queryString)) {
                                                                        return uri;
                                }
                                
                                const separator = uri.includes('?') ? '&' : '?';
                                const fullUri = uri + separator + queryString;
                                                                return fullUri;
                            });
                        }
                    } else {
                        // Original logic for other CDNs
                        const manifestUrlObj = new URL(manifestUrl, window.location.href);
                        const searchParams = manifestUrlObj.search;

                        if (searchParams) {
                            request.uris = request.uris.map((uri: string) => {
                                const separator = uri.includes('?') ? '&' : '?';
                                if (uri.includes(searchParams.substring(1))) return uri;
                                return uri + separator + searchParams.substring(1);
                            });
                        }
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

            // Initialize UI overlay with mobile-responsive configuration
            const uiConfig = {
                controlPanelElements: [
                    'play_pause',
                    'mute',
                    'volume',
                    'time_and_duration',
                    'spacer',
                    'overflow_menu',
                    'fullscreen',
                ],
                overflowMenuButtons: [
                    'captions',
                    'quality',
                    'picture_in_picture',
                    'playback_rate',
                ],
                addSeekBar: true,
                addBigPlayButton: true,
                enableKeyboardPlaybackControls: true,
                enableFullscreenOnRotation: true,
                forceLandscapeOnFullscreen: true,
                // Mobile-specific configurations
                customContextMenu: true,
                doubleClickForFullscreen: true,
                enableKeyboardControls: window.innerWidth > 768, // Only on desktop
                castReceiverAppId: undefined, // Disable casting on mobile
            };

            ui = new shaka.ui.Overlay(player, containerRef.current, videoRef.current);
            ui.configure(uiConfig);
            const controls = ui.getControls();

            try {
                                                
                // Create cross-origin video URL with timestamp
                const crossOriginManifestUrl = createCrossOriginVideoUrl(manifestUrl);
                await player.load(crossOriginManifestUrl);
                                
                // Log stream information for debugging
                const isLive = player.isLive();
                let duration = 'N/A';
                if (player.getSeekRange && typeof player.getSeekRange === 'function') {
                    try {
                        const seekRange = player.getSeekRange();
                        duration = seekRange?.end?.toString() || 'N/A';
                    } catch (err) {
                                            }
                }
                                
                if (isLive) {
                                    }
                
                setIsLoading(false);
                if (autoplay) {
                    videoRef.current.play();
                }
            } catch (e: any) {
                setIsLoading(false);
                
                // Handle cross-origin errors
                handleCrossOriginError(e, manifestUrl);
                
                setError(`Error loading video: ${e.message}`);
            }
        };

        initPlayer();

        return () => {
            if (ui) {
                ui.destroy();
            }
            if (player) {
                player.destroy();
            }
            if (speedBoostTimeoutRef.current) {
                clearTimeout(speedBoostTimeoutRef.current);
            }
        };
    }, [manifestUrl, drm, autoplay, cdnType, urlType]);

    // Hold to 2X speed boost functionality
    const activateSpeedBoost = useCallback(() => {
        if (!videoRef.current || !playerRef.current) return;
        
        setIsSpeedBoostActive(true);
        setOriginalPlaybackRate(videoRef.current.playbackRate);
        videoRef.current.playbackRate = 2;
        
        // Add visual feedback
        const container = containerRef.current;
        if (container) {
            container.classList.add('speed-boost-active');
        }
    }, []);

    const deactivateSpeedBoost = useCallback(() => {
        if (!videoRef.current) return;
        
        setIsSpeedBoostActive(false);
        videoRef.current.playbackRate = originalPlaybackRate;
        
        // Remove visual feedback
        const container = containerRef.current;
        if (container) {
            container.classList.remove('speed-boost-active');
        }
    }, [originalPlaybackRate]);

    const handleSpeedBoostTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        activateSpeedBoost();
        
        // Set a timeout to deactivate after 5 seconds max (safety measure)
        speedBoostTimeoutRef.current = setTimeout(() => {
            deactivateSpeedBoost();
        }, 5000);
    }, [activateSpeedBoost, deactivateSpeedBoost]);

    const handleSpeedBoostTouchEnd = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (speedBoostTimeoutRef.current) {
            clearTimeout(speedBoostTimeoutRef.current);
            speedBoostTimeoutRef.current = null;
        }
        deactivateSpeedBoost();
    }, [deactivateSpeedBoost]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (speedBoostTimeoutRef.current) {
                clearTimeout(speedBoostTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden" ref={containerRef}>
            <video
                ref={(videoElement) => {
                    if (videoElement) {
                        videoRef.current = videoElement;
                        addCrossOriginAttributes(videoElement);
                        
                        // Add mobile-specific attributes with proper TypeScript handling
                        videoElement.playsInline = true; // Important for iOS
                        
                        // Type assertion for webkit-specific properties
                        const videoElementWithWebkit = videoElement as any;
                        videoElementWithWebkit.webkitPlaysInline = true; // Safari iOS
                        videoElement.setAttribute('x-webkit-airplay', 'allow'); // Allow AirPlay
                        
                        // Set responsive video attributes
                        videoElement.style.width = '100%';
                        videoElement.style.height = '100%';
                        videoElement.style.objectFit = 'contain';
                        videoElement.style.backgroundColor = 'black';
                    }
                }}
                className="w-full h-full object-contain"
                data-shaka-player
                playsInline
                x-webkit-airplay="allow"
            />
            
            {/* Hold to 2X Speed Boost Button - Mobile Only */}
            {window.innerWidth <= 768 && (
                <button
                    className={`absolute bottom-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all duration-200 select-none touch-manipulation ${
                        isSpeedBoostActive 
                            ? 'bg-primary scale-110 shadow-lg shadow-primary/50' 
                            : 'hover:scale-105'
                    }`}
                    onTouchStart={handleSpeedBoostTouchStart}
                    onTouchEnd={handleSpeedBoostTouchEnd}
                    title="Hold to play at 2X speed"
                >
                    <div className="flex flex-col items-center">
                        <FastForward className={`h-5 w-5 ${isSpeedBoostActive ? 'animate-pulse' : ''}`} />
                        <span className="text-xs mt-1 font-medium">
                            {isSpeedBoostActive ? '2X' : '2X'}
                        </span>
                    </div>
                </button>
            )}
            
            {/* Speed Boost Indicator */}
            {isSpeedBoostActive && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
                        <div className="flex items-center gap-2">
                            <FastForward className="h-5 w-5" />
                            <span className="font-bold text-lg">2X Speed</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-white" />
                        <p className="text-white text-xs sm:text-sm font-medium">Loading video...</p>
                    </div>
                </div>
            )}
            
            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-center p-4 max-w-sm">
                        <div className="text-red-400 text-sm sm:text-base mb-2">Error</div>
                        <div className="text-white text-xs sm:text-sm">{error}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShakaPlayer;
