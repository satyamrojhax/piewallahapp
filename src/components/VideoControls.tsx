'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import "@/config/firebase";
import { 
  Play, 
  Pause, 
  Volume2 as VolumeIcon, 
  VolumeX as VolumeMute, 
  Maximize, 
  Minimize, 
  Settings, 
  SkipBack, 
  SkipForward,
  RotateCcw,
  PictureInPicture,
  Gauge,
  PlayCircle,
  PauseCircle,
  Volume,
  Volume1 as VolumeLow,
  Volume2 as VolumeMedium,
  Expand,
  Shrink,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Monitor,
  MonitorSpeaker,
  Speaker,
  Waves,
  Activity,
  Zap,
  FastForward,
  Rewind,
  PlusSquare,
  SlidersHorizontal,
  MoreVertical,
  Circle,
  Square,
  Diamond,
  Sparkles,
  Star,
  Heart,
  Share2,
  Download,
  Upload,
  Link,
  ExternalLink,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Power,
  ZapOff,
  Eye,
  EyeOff
} from 'lucide-react';

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isPlaying: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playbackRate: number;
  isLive?: boolean;
  availableQualities?: Array<{ label: string; value: number }>;
  currentQuality?: number;
  onPlay: () => void;
  onPause: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onFullscreen: () => void;
  onSpeedChange: (speed: number) => void;
  onPictureInPicture: () => void;
  onQualityChange?: (quality: number) => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
  onRetry: () => void;
  showRetry?: boolean;
  isLoading?: boolean;
  error?: string | null;
  autoHide?: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  videoRef,
  containerRef,
  isPlaying,
  isFullscreen,
  isMuted,
  volume,
  currentTime,
  duration,
  isBuffering,
  playbackRate,
  isLive = false,
  availableQualities = [],
  currentQuality,
  onPlay,
  onPause,
  onMute,
  onUnmute,
  onVolumeChange,
  onSeek,
  onFullscreen,
  onSpeedChange,
  onPictureInPicture,
  onQualityChange,
  onSkipBackward,
  onSkipForward,
  onRetry,
  showRetry = false,
  isLoading = false,
  error = null,
  autoHide = true
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isSpeedBoost, setIsSpeedBoost] = useState(false);
  const [hoveredTime, setHoveredTime] = useState<number>(0);
  const [isHoveringTimeline, setIsHoveringTimeline] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const speedBoostTimeoutRef = useRef<NodeJS.Timeout>();

  // Format time in HH:mm:ss format
  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;
    
    onSeek(newTime);
    showControls();
  }, [duration, onSeek]);

  // Handle progress bar hover
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const hoverPercent = Math.max(0, Math.min(1, hoverX / rect.width));
    const newHoveredTime = hoverPercent * duration;
    
    setHoveredTime(newHoveredTime);
    setIsHoveringTimeline(true);
  }, [duration]);

  const handleProgressLeave = useCallback(() => {
    setIsHoveringTimeline(false);
  }, []);

  // Show controls and reset hide timer
  const showControls = useCallback(() => {
    if (!autoHide) return;
    
    setIsVisible(true);
    
    // Clear existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    // Set new timeout to hide controls after 5 seconds
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [autoHide]);

  // Handle mouse movement to show controls
  const handleMouseMove = useCallback(() => {
    showControls();
  }, [showControls]);

  // Setup auto-hide effect
  useEffect(() => {
    if (!autoHide || !containerRef.current) return;

    const container = containerRef.current;
    
    // Add mouse move listener
    container.addEventListener('mousemove', handleMouseMove);
    
    // Add touch listener for mobile
    container.addEventListener('touchstart', handleMouseMove);
    
    // Show controls initially
    showControls();
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [autoHide, handleMouseMove, showControls]);

  // Hold-to-2X functionality for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only on mobile devices
    if (window.innerWidth > 768) return;
    
    // Start speed boost
    setIsSpeedBoost(true);
    onSpeedChange(2);
    
    // Clear existing timeout
    if (speedBoostTimeoutRef.current) {
      clearTimeout(speedBoostTimeoutRef.current);
    }
  }, [onSpeedChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Only on mobile devices
    if (window.innerWidth > 768) return;
    
    // End speed boost after a short delay to prevent accidental activation
    speedBoostTimeoutRef.current = setTimeout(() => {
      setIsSpeedBoost(false);
      onSpeedChange(1);
    }, 100);
  }, [onSpeedChange]);

  // Cleanup speed boost on unmount
  useEffect(() => {
    return () => {
      if (speedBoostTimeoutRef.current) {
        clearTimeout(speedBoostTimeoutRef.current);
      }
    };
  }, []);

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    onVolumeChange(newVolume);
    
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
  }, [onVolumeChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? onPause() : onPlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSkipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSkipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'f':
          e.preventDefault();
          onFullscreen();
          break;
        case 'm':
          e.preventDefault();
          isMuted ? onUnmute() : onMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPause, onPlay, onSkipBackward, onSkipForward, onFullscreen, isMuted, onMute, onUnmute, volume, handleVolumeChange]);

  // Calculate progress percentage
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Speed options
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <>
      {/* Center Controls */}
      {!isLoading && !error && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 transition-all duration-300 z-30 ${
          !isVisible && autoHide ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'
        }`}>
          {/* 10 Seconds Backward */}
          <button
            onClick={() => {
              onSkipBackward();
              showControls();
            }}
            className="w-12 h-12 sm:w-16 sm:h-16 text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
            title="Skip backward 10 seconds"
          >
            <Rewind className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-sm" />
          </button>

          {/* Big Play/Pause Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-20 h-20 sm:w-24 sm:h-24 text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-2xl"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <PauseCircle className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-sm" />
            ) : (
              <PlayCircle className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-sm ml-1" />
            )}
          </button>

          {/* 10 Seconds Forward */}
          <button
            onClick={() => {
              onSkipForward();
              showControls();
            }}
            className="w-12 h-12 sm:w-16 sm:h-16 text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
            title="Skip forward 10 seconds"
          >
            <FastForward className="h-6 w-6 sm:h-8 sm:w-8 drop-shadow-sm" />
          </button>
        </div>
      )}

      {/* Controls Container */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 z-20 transition-all duration-300 ${
        !isVisible && autoHide ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
      }`}>
      {/* Progress Bar */}
      <div className="mb-4 relative">
        {/* Speed Indicator */}
        <div className={`absolute -top-10 left-0 flex items-center gap-2 transition-opacity duration-300 ${
          !isVisible && autoHide ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="bg-red-600/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg border border-red-500/30">
            {playbackRate}X
          </div>
        </div>
        
        <div 
          ref={progressBarRef}
          className="relative h-3 bg-white/20 cursor-pointer group rounded-full shadow-inner"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full overflow-hidden" />
          
          {/* Progress gradient */}
          <div 
            className="absolute h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 transition-all duration-300 rounded-full shadow-lg overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Progress shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-pulse" />
          </div>
          
          {/* Progress thumb */}
          <div 
            className="absolute h-5 w-5 bg-gradient-to-br from-white to-gray-100 rounded-full -top-1 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border-2 border-white/50"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Inner glow */}
            <div className="absolute inset-1 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-50" />
          </div>
          
          {/* Buffering indicator */}
          {isBuffering && (
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-full animate-pulse" />
          )}
        </div>
        
        {/* Hover Time Preview (outside to avoid clipping) */}
        {isHoveringTimeline && (
          <div 
            className="absolute bottom-full mb-3 bg-gradient-to-r from-black/95 via-black/90 to-black/95 text-white text-xs px-4 py-2.5 rounded-xl pointer-events-none whitespace-nowrap border border-white/20 shadow-2xl backdrop-blur-md z-50"
            style={{ 
              left: `${(hoveredTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">{formatTime(hoveredTime)}</span>
            </div>
            {/* Time indicator arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90" />
          </div>
        )}
      </div>
      
      {/* Time Display */}
      <div className="flex justify-between text-white text-xs mt-2">
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-semibold">LIVE</span>
            </div>
          ) : (
            <span>{formatTime(currentTime)}</span>
          )}
        </div>
        {!isLive && <span>{formatTime(duration)}</span>}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        {/* Left Controls */}
        <div className="flex items-center gap-3">
          {/* Retry Button */}
          {showRetry && (
            <button
              onClick={onRetry}
              className="text-white hover:text-red-400 transition-colors p-2"
              title="Retry"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}

          {/* Play/Pause */}
          <button
            onClick={() => {
              if (isPlaying) {
                onPause();
              } else {
                onPlay();
              }
              showControls();
            }}
            disabled={isLoading}
            className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 disabled:opacity-50 hover:bg-white/10 rounded-lg"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isPlaying ? (
              <PauseCircle className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            ) : (
              <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            )}
          </button>

          {/* Skip Backward */}
          <button
            onClick={() => {
              onSkipBackward();
              showControls();
            }}
            className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
            title="Skip backward 10 seconds"
          >
            <Rewind className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => {
              onSkipForward();
              showControls();
            }}
            className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
            title="Skip forward 10 seconds"
          >
            <FastForward className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
          </button>

          {/* Volume Control */}
          <div className="relative">
            <button
              onClick={() => {
                isMuted ? onUnmute() : onMute();
                setShowVolumeSlider(!showVolumeSlider);
                showControls();
              }}
              className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeMute className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
              ) : (
                <VolumeIcon className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
              )}
            </button>

            {/* Volume Slider */}
            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 rounded-lg p-3 shadow-lg">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-white text-xs">{Math.round(volume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsMenu(!showSettingsMenu);
                showControls();
              }}
              className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
              title="Settings"
            >
              <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            </button>

            {/* Settings Menu */}
            {showSettingsMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg shadow-lg min-w-[200px]">
                <div className="py-2">
                  {/* Speed Control */}
                  <div className="px-4 py-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                        className="w-full text-left text-xs text-white hover:bg-white/10 px-2 py-1 rounded flex items-center justify-between"
                      >
                        <span>Speed</span>
                        <span className="text-white/60">{playbackRate}x</span>
                      </button>
                      
                      {/* Speed Dropdown */}
                      {showSpeedDropdown && (
                        <div className="absolute bottom-full left-0 mb-1 bg-black/95 rounded-lg shadow-lg min-w-[120px] z-50">
                          <div className="py-1">
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => {
                                  onSpeedChange(speed);
                                  setShowSpeedDropdown(false);
                                }}
                                className={`w-full text-left text-xs px-3 py-2 ${
                                  speed === playbackRate ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quality Control */}
                  {availableQualities.length > 0 && onQualityChange && (
                    <div className="px-4 py-2 border-t border-white/20">
                      <div className="relative">
                        <button
                          onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                          className="w-full text-left text-xs text-white hover:bg-white/10 px-2 py-1 rounded flex items-center justify-between"
                        >
                          <span>Quality</span>
                          <span className="text-white/60">
                            {availableQualities.find(q => q.value === currentQuality)?.label || 'Auto'}
                          </span>
                        </button>
                        
                        {/* Quality Dropdown */}
                        {showQualityDropdown && (
                          <div className="absolute bottom-full left-0 mb-1 bg-black/95 rounded-lg shadow-lg min-w-[120px] z-50">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onQualityChange(-1); // Auto quality
                                  setShowQualityDropdown(false);
                                }}
                                className={`w-full text-left text-xs px-3 py-2 ${
                                  currentQuality === -1 ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'
                                }`}
                              >
                                Auto
                              </button>
                              {availableQualities.map((quality) => (
                                <button
                                  key={quality.value}
                                  onClick={() => {
                                    onQualityChange(quality.value);
                                    setShowQualityDropdown(false);
                                  }}
                                  className={`w-full text-left text-xs px-3 py-2 ${
                                    quality.value === currentQuality ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'
                                  }`}
                                >
                                  {quality.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Picture in Picture */}
                  <div className="px-4 py-2 border-t border-white/20">
                    <button
                      onClick={() => {
                        onPictureInPicture();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full text-left text-xs text-white hover:bg-white/10 px-2 py-1 rounded flex items-center gap-2"
                    >
                      <PictureInPicture className="h-4 w-4" />
                      Picture in Picture
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={() => {
              onFullscreen();
              showControls();
            }}
            className="text-white hover:text-red-400 transition-all duration-200 p-2 sm:p-3 hover:bg-white/10 rounded-lg"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <MonitorSpeaker className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            ) : (
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            )}
          </button>
        </div>
      </div>

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-black/80 rounded-lg p-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default VideoControls;
