import React, { useState, useEffect } from 'react';
import { API_CONFIG, safeFetch } from '../lib/apiConfig';
import { useParams, useNavigate } from 'react-router-dom';
import ShakaPlayer from '@/components/ShakaPlayer';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Loader2, AlertCircle, MoreVertical, Download, Eye, FileText, X, Presentation, Clock, ChevronLeft, ChevronRight, Play, Menu } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchScheduleDetails, fetchSlides } from '@/services/contentService';

interface VideoData {
    stream_url: string;
    drm?: {
        keyid: string;
        key: string;
    };
    cdnType?: string;
    urlType?: string;
}

const VideoPlayer = () => {
    const { batchId, subjectId, childId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [showAttachmentsMenu, setShowAttachmentsMenu] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [showSlidesMenu, setShowSlidesMenu] = useState(false);
    const [slides, setSlides] = useState<any[]>([]);
    const [slidesLoading, setSlidesLoading] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [showTimeline, setShowTimeline] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        // Prevent scrolling when video player is mounted
        document.body.style.overflow = 'hidden';

        return () => {
            // Restore scrolling when component unmounts
            document.body.style.overflow = 'auto';
        };
    }, []);

    useEffect(() => {
        const fetchVideoData = async () => {
            if (!batchId || !subjectId || !childId) {
                setError("Missing required parameters (batchId, subjectId, or childId)");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Try primary endpoint first
                let data;
                let endpointUsed = '';
                
                try {
                    const primaryUrl = `${API_CONFIG.VIDEO_API_PROXY_BASE_URL}/video?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`;
                    // Trying primary endpoint
                    const response = await safeFetch(primaryUrl);
                    
                    if (!response.ok) {
                        throw new Error(`Primary endpoint failed: ${response.statusText}`);
                    }
                    
                    data = await response.json();
                    endpointUsed = 'primary';
                    // Primary endpoint succeeded
                    
                } catch (primaryError) {
                    // Primary endpoint failed, trying fallback
                    
                    // Try fallback endpoint
                    const fallbackUrl = `${API_CONFIG.API_BASE_URL}/api/video-content?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`;
                    // Trying fallback endpoint
                    const fallbackResponse = await safeFetch(fallbackUrl);
                    
                    if (!fallbackResponse.ok) {
                        throw new Error(`Fallback endpoint also failed: ${fallbackResponse.statusText}`);
                    }
                    
                    data = await fallbackResponse.json();
                    endpointUsed = 'fallback';
                    // Fallback endpoint succeeded
                }

                // Validate data
                if (!data.stream_url) {
                    throw new Error("No stream URL in response");
                }

                // Use the stream_url directly from the response as it's already signed
                const videoDataPayload: VideoData = {
                    stream_url: data.stream_url,
                    cdnType: data.cdnType,
                    urlType: data.url_type
                };
                
                // Only add DRM if it exists
                if (data.drm && data.drm.kid && data.drm.key) {
                    videoDataPayload.drm = {
                        keyid: data.drm.kid, // Map kid to keyid
                        key: data.drm.key
                    };
                }
                
                setVideoData(videoDataPayload);
                
                // Video data loaded successfully

            } catch (err: any) {
                // Failed to fetch video details from all endpoints
                setError(err.message || "Failed to load video details");
            } finally {
                setLoading(false);
            }
        };

        fetchVideoData();
    }, [batchId, subjectId, childId]);

    const handleBack = () => {
        navigate(-1);
    };

    const fetchAttachments = async () => {
        if (!batchId || !subjectId || !childId) return;
        
        setAttachmentsLoading(true);
        try {
            const scheduleDetails = await fetchScheduleDetails(batchId, subjectId, childId);
            const attachmentsList: any[] = [];
            
            // Extract attachments from regular homeworkIds (notes)
            if (scheduleDetails && scheduleDetails.homeworkIds) {
                scheduleDetails.homeworkIds.forEach((homework: any) => {
                    if (homework.attachmentIds && homework.attachmentIds.length > 0) {
                        homework.attachmentIds.forEach((attachment: any) => {
                            attachmentsList.push({
                                ...attachment,
                                topic: homework.topic,
                                type: homework.note?.toLowerCase().includes('dpp') ? 'DPP' : 'Notes'
                            });
                        });
                    }
                });
            }
            
            // Extract attachments from DPP homeworks
            if (scheduleDetails && scheduleDetails.dppHomeworks) {
                scheduleDetails.dppHomeworks.forEach((homework: any) => {
                    if (homework.attachmentIds && homework.attachmentIds.length > 0) {
                        homework.attachmentIds.forEach((attachment: any) => {
                            attachmentsList.push({
                                ...attachment,
                                topic: homework.topic,
                                type: 'DPP'
                            });
                        });
                    }
                });
            }
            
            setAttachments(attachmentsList);
        } catch (error) {
            // Failed to fetch attachments
            setAttachments([]);
        } finally {
            setAttachmentsLoading(false);
        }
    };

    const handleAttachmentsClick = () => {
        if (attachments.length === 0 && !attachmentsLoading) {
            fetchAttachments();
        }
        setShowAttachmentsMenu(!showAttachmentsMenu);
        // Close slides menu when opening attachments menu
        if (showSlidesMenu) {
            setShowSlidesMenu(false);
        }
        // Close dropdown when opening attachments menu
        setShowDropdown(false);
    };

    const fetchSlidesData = async () => {
        if (!batchId || !subjectId || !childId) return;
        
        setSlidesLoading(true);
        try {
            const slidesData = await fetchSlides(batchId, subjectId, childId);
            if (slidesData && slidesData.slides && slidesData.slides.length > 0) {
                setSlides(slidesData.slides);
            } else {
                setSlides([]);
            }
        } catch (error) {
            // Failed to fetch slides
            setSlides([]);
        } finally {
            setSlidesLoading(false);
        }
    };

    const handleSlidesClick = () => {
        if (slides.length === 0 && !slidesLoading) {
            fetchSlidesData();
        }
        setShowSlidesMenu(!showSlidesMenu);
        // Close attachments menu when opening slides menu
        if (showAttachmentsMenu) {
            setShowAttachmentsMenu(false);
        }
        // Close dropdown when opening slides menu
        setShowDropdown(false);
    };

    const handleDropdownItemClick = (action: string) => {
        setShowDropdown(false);
        
        switch(action) {
            case 'slides':
                handleSlidesClick();
                break;
            case 'attachments':
                handleAttachmentsClick();
                break;
        }
    };

    const goToPreviousSlide = () => {
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
    };

    const goToNextSlide = () => {
        setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
    };

    const handleTimelineClick = () => {
        setShowTimeline(!showTimeline);
        // Close other panels when opening timeline
        if (showAttachmentsMenu) setShowAttachmentsMenu(false);
        if (showSlidesMenu) setShowSlidesMenu(false);
    };

    const getSlideForTime = (timeInSeconds: number) => {
        // Find the slide that should be displayed at the current time
        for (let i = slides.length - 1; i >= 0; i--) {
            if (slides[i].timeStamp && parseInt(slides[i].timeStamp) <= timeInSeconds) {
                return i;
            }
        }
        return -1;
    };

    const jumpToSlide = (index: number) => {
        setCurrentSlideIndex(index);
        
        // Debug: log slide data
        // Slide data retrieved
        
        // If slide has timestamp, seek video to that time
        if (slides[index].timeStamp && slides[index].timeStamp !== "0" && slides[index].timeStamp !== 0) {
            // Timestamp is already in SECONDS, not milliseconds
            const timeInSeconds = parseInt(slides[index].timeStamp);
            
            // Convert to HH:MM:SS format for display
            const hours = Math.floor(timeInSeconds / 3600);
            const minutes = Math.floor((timeInSeconds % 3600) / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Seeking slide
            
            // Try multiple methods to seek the video
            let success = false;
            
            // Method 1: Direct video element
            const videoElement = document.querySelector('video');
            if (videoElement) {
                try {
                    videoElement.currentTime = timeInSeconds;
                    // Direct video element seek successful
                    success = true;
                } catch (e) {
                    // Direct video element seek failed
                }
            }
            
            // Method 2: Shaka player API
            if (!success && (window as any).player) {
                try {
                    (window as any).player.currentTime = timeInSeconds;
                    // Shaka player API seek successful
                    success = true;
                } catch (e) {
                    // Shaka player API seek failed
                }
            }
            
            // Method 3: Try to find video in shaka container
            if (!success) {
                const shakaContainer = document.querySelector('[data-shaka-player]') || document.querySelector('.shaka-video-container');
                if (shakaContainer) {
                    const video = shakaContainer.querySelector('video');
                    if (video) {
                        try {
                            video.currentTime = timeInSeconds;
                            // Shaka container video seek successful
                            success = true;
                        } catch (e) {
                            // Shaka container video seek failed
                        }
                    }
                }
            }
            
            // Method 4: Last resort - find any video element
            if (!success) {
                const allVideos = document.querySelectorAll('video');
                for (const video of allVideos) {
                    try {
                        video.currentTime = timeInSeconds;
                        // Found and used video element
                        success = true;
                        break;
                    } catch (e) {
                        // Video element seek failed
                    }
                }
            }
            
            if (!success) {
                // All seek methods failed - video element not accessible
            }
        } else {
            // No valid timestamp for slide
        }
    };

    // Helper function to convert seconds to HH:MM:SS
    const formatTime = (seconds: string | number) => {
        const totalSeconds = parseInt(seconds.toString());
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Test function to verify video seek works
    const testVideoSeek = () => {
        // Testing video seek functionality
        const videoElement = document.querySelector('video');
        if (videoElement) {
            // Video element found
            
            // Test seeking to 10 seconds
            try {
                videoElement.currentTime = 10;
                // Test seek to 10 seconds successful
            } catch (e) {
                // Test seek failed
            }
        } else {
            // No video element found
        }
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            // Add timestamp to prevent caching issues
            const timestampedUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
            
            const response = await fetch(timestampedUrl, {
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/pdf,image/*,*/*;q=0.8',
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch file');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            // Download failed, opening in new tab
            // Fallback to opening in new tab
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <div className="flex flex-col items-center gap-4 p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium">Loading your video...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
                <Card className="max-w-md w-full p-8 shadow-elevation-1 border-border/50 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Error Loading Video</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={handleBack} variant="outline">
                        Go Back
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="text-white hover:bg-white/20 pointer-events-auto rounded-full"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 pointer-events-auto rounded-full hover:scale-110 hover:shadow-lg transition-all duration-200"
                                    title="More Options"
                                >
                                    <MoreVertical className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[200px]">
                                <DropdownMenuItem 
                                    onClick={() => handleDropdownItemClick('slides')}
                                    className="cursor-pointer px-3 py-2 text-sm font-medium"
                                >
                                    <Presentation className="h-4 w-4 mr-3 text-foreground/70" />
                                    Timeline
                                    {showSlidesMenu && (
                                        <div className="ml-auto w-2 h-2 bg-foreground rounded-full"></div>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => handleDropdownItemClick('attachments')}
                                    className="cursor-pointer px-3 py-2 text-sm font-medium"
                                >
                                    <FileText className="h-4 w-4 mr-3 text-foreground/70" />
                                    Attachments
                                    {showAttachmentsMenu && (
                                        <div className="ml-auto w-2 h-2 bg-foreground rounded-full"></div>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Player Container */}
            <div className={`flex-1 w-full h-full transition-all duration-300 ${showSlidesMenu ? 'mr-96' : ''}`}>
                {videoData && (
                    <ShakaPlayer
                        manifestUrl={videoData.stream_url}
                        drm={videoData.drm}
                        cdnType={videoData.cdnType}
                        urlType={videoData.urlType}
                        autoplay={true}
                    />
                )}
            </div>

            {/* Timeline Panel */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-background shadow-elevation-3 transform transition-transform duration-300 z-20 ${showSlidesMenu ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Presentation className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Timeline</h3>
                                <p className="text-xs text-muted-foreground">
                                    {slides.length > 0 ? `${slides.length} slides` : 'No slides'}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSlidesMenu(false)}
                            className="text-muted-foreground hover:text-foreground hover:bg-white/10 p-2 h-auto rounded-full transition-all duration-200"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation Controls */}
                    {slides.length > 0 && (
                        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousSlide}
                                disabled={currentSlideIndex === 0}
                                className="h-8 px-3 text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-3 w-3 mr-1" />
                                Previous
                            </Button>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                    {currentSlideIndex + 1}
                                </span>
                                <span className="text-xs text-muted-foreground">/ {slides.length}</span>
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextSlide}
                                disabled={currentSlideIndex === slides.length - 1}
                                className="h-8 px-3 text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {slidesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : slides.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No timeline available.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {slides.map((slide, index) => (
                                    <div 
                                        key={slide._id || index} 
                                        className={`relative group cursor-pointer rounded-xl overflow-hidden transition-all duration-300 transform ${
                                            index === currentSlideIndex 
                                                ? 'ring-2 ring-primary shadow-xl scale-[1.02] border-0' 
                                                : 'hover:shadow-lg hover:scale-[1.01] border border-border/50 hover:border-primary/30'
                                        }`}
                                        onClick={() => jumpToSlide(index)}
                                    >
                                        {/* Full Image Container */}
                                        {slide.img && (
                                            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                                                <img
                                                    src={slide.img.baseUrl + slide.img.key}
                                                    alt=""
                                                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                />
                                                {/* Gradient overlay for better visual appeal */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </div>
                                        )}
                                        
                                        {/* Timestamp Badge */}
                                        {slide.timeStamp && slide.timeStamp !== "0" && (
                                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium shadow-lg border border-white/10">
                                                <Clock className="h-3 w-3 inline mr-1" />
                                                {formatTime(slide.timeStamp)}
                                            </div>
                                        )}
                                        
                                        {/* Current Slide Indicator */}
                                        {index === currentSlideIndex && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                                Playing
                                            </div>
                                        )}
                                        
                                        {/* Hover overlay with jump to time button */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <div className="flex items-center justify-between text-white mb-2">
                                                    <span className="text-sm font-semibold">
                                                        Slide {slide.serialNumber || index + 1}
                                                    </span>
                                                    {slide.timeStamp && slide.timeStamp !== "0" && (
                                                        <span className="text-xs bg-black/50 px-2 py-1 rounded-full">
                                                            {formatTime(slide.timeStamp)}
                                                        </span>
                                                    )}
                                                </div>
                                                {slide.timeStamp && slide.timeStamp !== "0" && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-primary hover:bg-primary/90 text-white h-8 text-xs font-medium transition-all duration-200 hover:scale-105"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            jumpToSlide(index);
                                                        }}
                                                    >
                                                        <Play className="h-3 w-3 mr-1" />
                                                        Jump to Time
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Attachments Modal */}
            {showAttachmentsMenu && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg shadow-elevation-3 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Video Attachments</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    DPP and Notes for this video
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAttachmentsMenu(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                ×
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {attachmentsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : attachments.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No attachments available for this video.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {attachments.map((attachment, index) => {
                                        const fileUrl = attachment.baseUrl && attachment.key 
                                            ? (attachment.key.startsWith('http') ? attachment.key : `${attachment.baseUrl}${attachment.key}`)
                                            : '';
                                        
                                        return (
                                            <Card key={index} className="p-4 border-border/50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <span className="text-sm font-medium text-foreground">
                                                                {attachment.type}
                                                            </span>
                                                            {attachment.topic && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    • {attachment.topic}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {attachment.name || `Attachment ${index + 1}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                                                            disabled={!fileUrl}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => fileUrl && downloadFile(fileUrl, attachment.name || `attachment-${index + 1}`)}
                                                            disabled={!fileUrl}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
