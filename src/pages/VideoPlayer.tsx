import React, { useState, useEffect } from 'react';
import { API_CONFIG, safeFetch } from '../lib/apiConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ShakaPlayer from '@/components/ShakaPlayer';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, MoreVertical, Download, Eye, FileText, X, Presentation, Clock, ChevronLeft, ChevronRight, Play, Menu } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchScheduleDetails, fetchSlides } from "@/services/contentService";
import { getCommonHeaders } from "@/lib/auth";
import { canAccessBatchContent } from "@/lib/enrollmentUtils";
import { getVideoData } from "@/services/videoService";

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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Parse query parameters
    const batchId = searchParams.get('batchId');
    const subjectId = searchParams.get('subjectId');
    const childId = searchParams.get('childId');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [showAttachmentsMenu, setShowAttachmentsMenu] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [showSlidesModal, setShowSlidesModal] = useState(false);
    const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
    const [slides, setSlides] = useState<any[]>([]);
    const [slidesLoading, setSlidesLoading] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
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
                
                // Use the new video service
                const videoDataPayload = await getVideoData(batchId, subjectId, childId);
                
                // Validate data
                if (!videoDataPayload.stream_url) {
                    throw new Error("No video URL in response");
                }

                // Map API response to VideoData interface
                const videoData: VideoData = {
                    stream_url: videoDataPayload.stream_url,
                    cdnType: videoDataPayload.cdnType,
                    urlType: videoDataPayload.urlType
                };
                
                // Add DRM if it exists
                if (videoDataPayload.drm && videoDataPayload.drm.kid && videoDataPayload.drm.key) {
                    videoData.drm = {
                        keyid: videoDataPayload.drm.kid,
                        key: videoDataPayload.drm.key
                    };
                }
                
                setVideoData(videoData);
                
            } catch (err: any) {
                setError(err.message || "Failed to load video details");
            } finally {
                setLoading(false);
            }
        };

        fetchVideoData();
    }, [batchId, subjectId, childId]);

    const fetchAttachments = async () => {
        if (!batchId || !subjectId || !childId) return;
        
        setAttachmentsLoading(true);
        try {
            const scheduleDetails = await fetchScheduleDetails(batchId, subjectId, childId);
                        const attachmentsList: any[] = [];
            
            // Extract attachments from regular homeworkIds (notes)
            if (scheduleDetails && scheduleDetails.homeworkIds) {
                                scheduleDetails.homeworkIds.forEach((homework: any, index: number) => {
                                        if (homework.attachmentIds && homework.attachmentIds.length > 0) {
                        homework.attachmentIds.forEach((attachment: any) => {
                            // Determine type based on multiple factors
                            let type = 'Notes';
                            if (homework.note && (
                                homework.note.toLowerCase().includes('dpp') ||
                                homework.note.toLowerCase().includes('practice') ||
                                homework.note.toLowerCase().includes('problem')
                            )) {
                                type = 'DPP';
                            }
                            
                                                        
                            attachmentsList.push({
                                ...attachment,
                                topic: homework.topic,
                                type: type
                            });
                        });
                    }
                });
            }
            
            // Extract attachments from DPP section (nested under dpp.homeworkIds)
            if (scheduleDetails && scheduleDetails.dpp && scheduleDetails.dpp.homeworkIds) {
                                scheduleDetails.dpp.homeworkIds.forEach((homework: any, index: number) => {
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
            setAttachments([]);
        } finally {
            setAttachmentsLoading(false);
        }
    };

    const handleAttachmentsClick = () => {
        if (attachments.length === 0 && !attachmentsLoading) {
            fetchAttachments();
        }
        setShowAttachmentsModal(!showAttachmentsModal);
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
                        setSlides([]);
        } finally {
            setSlidesLoading(false);
        }
    };

    const handleSlidesClick = () => {
        if (slides.length === 0 && !slidesLoading) {
            fetchSlidesData();
        }
        setShowSlidesModal(!showSlidesModal);
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
                        
        // If slide has timestamp, seek video to that time
        if (slides[index].timeStamp && slides[index].timeStamp !== "0" && slides[index].timeStamp !== 0) {
            // Timestamp is already in SECONDS, not milliseconds
            const timeInSeconds = parseInt(slides[index].timeStamp);
            
            // Convert to HH:MM:SS format for display
            const hours = Math.floor(timeInSeconds / 3600);
            const minutes = Math.floor((timeInSeconds % 3600) / 60);
            const seconds = Math.floor(timeInSeconds % 60);
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
                        
            // Try multiple methods to seek the video
            let success = false;
            
            // Method 1: Direct video element
            const videoElement = document.querySelector('video');
            if (videoElement) {
                try {
                    videoElement.currentTime = timeInSeconds;
                                        success = true;
                } catch (e) {
                                    }
            }
            
            // Method 2: Shaka player API
            if (!success && (window as any).player) {
                try {
                    (window as any).player.currentTime = timeInSeconds;
                                        success = true;
                } catch (e) {
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
                                                        success = true;
                        } catch (e) {
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
                                                success = true;
                        break;
                    } catch (e) {
                                            }
                }
            }
            
            if (!success) {
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
                const videoElement = document.querySelector('video');
        if (videoElement) {
                        
            // Test seeking to 10 seconds
            try {
                videoElement.currentTime = 10;
                            } catch (e) {
                // Test seek failed
            }
        } else {
            // No video element found
            // All video elements
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
                </Card>
            </div>
        );
    }

    // Check if user has access to this batch content
    if (batchId && !canAccessBatchContent(batchId)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
                <Card className="max-w-md w-full p-8 shadow-elevation-1 border-border/50 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
                    <p className="text-muted-foreground mb-6">
                        You need to enroll in this batch to access video content.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button onClick={() => navigate(`/batch/${batchId}`)} className="bg-gradient-primary hover:opacity-90">
                            Enroll Now
                        </Button>
                        <Button onClick={() => navigate('/batches')} variant="outline">
                            View All Batches
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 w-full p-3 sm:p-4 z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/20 pointer-events-auto rounded-full h-8 w-8 sm:h-10 sm:w-10"
                        title="Go Back"
                    >
                        <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 pointer-events-auto rounded-full h-8 w-8 sm:h-10 sm:w-10"
                                    title="More Options"
                                >
                                    <MoreVertical className="h-4 w-4 sm:h-6 sm:w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px] sm:min-w-[200px]">
                                <DropdownMenuItem 
                                    onClick={() => handleDropdownItemClick('slides')}
                                    className="cursor-pointer px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium"
                                >
                                    <Presentation className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-foreground/70" />
                                    Timeline
                                    {showSlidesModal && (
                                        <div className="ml-auto w-2 h-2 bg-foreground rounded-full"></div>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => handleDropdownItemClick('attachments')}
                                    className="cursor-pointer px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium"
                                >
                                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-foreground/70" />
                                    Attachments
                                    {showAttachmentsModal && (
                                        <div className="ml-auto w-2 h-2 bg-foreground rounded-full"></div>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Player Container */}
            <div className="flex-1 w-full h-full relative">
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

            {/* Attachments Modal */}
            <Dialog open={showAttachmentsModal} onOpenChange={setShowAttachmentsModal}>
                <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                            Video Attachments
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[60vh] p-1">
                        {attachmentsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : attachments.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm sm:text-base text-muted-foreground">No attachments available for this video.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-3">
                                {attachments.map((attachment, index) => {
                                    const fileUrl = attachment.baseUrl && attachment.key 
                                        ? (attachment.key.startsWith('http') ? attachment.key : `${attachment.baseUrl}${attachment.key}`)
                                        : '';
                                    
                                    return (
                                        <Card key={index} className="p-3 sm:p-4 border-border/50">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                                        <span className="text-xs sm:text-sm font-medium text-foreground">
                                                            {attachment.type}
                                                        </span>
                                                        {attachment.topic && (
                                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                                • {attachment.topic}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {attachment.name || `Attachment ${index + 1}`}
                                                    </p>
                                                    {attachment.topic && (
                                                        <p className="text-xs text-muted-foreground sm:hidden mt-1">
                                                            {attachment.topic}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => fileUrl && window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                                                        disabled={!fileUrl}
                                                        className="text-muted-foreground hover:text-foreground p-1 h-8 w-8 sm:h-auto sm:w-auto"
                                                        title="View"
                                                    >
                                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => fileUrl && downloadFile(fileUrl, attachment.name || `attachment-${index + 1}`)}
                                                        disabled={!fileUrl}
                                                        className="text-muted-foreground hover:text-foreground p-1 h-8 w-8 sm:h-auto sm:w-auto"
                                                        title="Download"
                                                    >
                                                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Timeline/Slides Modal */}
            <Dialog open={showSlidesModal} onOpenChange={setShowSlidesModal}>
                <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Presentation className="h-4 w-4 sm:h-5 sm:w-5" />
                            Timeline
                        </DialogTitle>
                    </DialogHeader>
                    
                    {/* Navigation Controls */}
                    {slides.length > 0 && (
                        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-border bg-muted/30">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousSlide}
                                disabled={currentSlideIndex === 0}
                                className="h-7 px-2 sm:h-8 sm:px-3 text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Previous</span>
                            </Button>
                            
                            <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs sm:text-sm font-medium text-foreground">
                                    {currentSlideIndex + 1}
                                </span>
                                <span className="text-xs text-muted-foreground">/ {slides.length}</span>
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextSlide}
                                disabled={currentSlideIndex === slides.length - 1}
                                className="h-7 px-2 sm:h-8 sm:px-3 text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="h-3 w-3 sm:ml-1" />
                            </Button>
                        </div>
                    )}

                    <div className="overflow-y-auto max-h-[70vh] p-2 sm:p-4">
                        {slidesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : slides.length === 0 ? (
                            <div className="text-center py-8">
                                <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm sm:text-base text-muted-foreground">No timeline available.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {slides.map((slide, index) => (
                                    <div 
                                        key={slide._id || index} 
                                        className={`relative group cursor-pointer rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 transform ${
                                            index === currentSlideIndex 
                                                ? 'ring-2 ring-primary shadow-lg sm:shadow-xl scale-[1.01] sm:scale-[1.02] border-0' 
                                                : 'hover:shadow-md sm:hover:shadow-lg hover:scale-[1.005] sm:hover:scale-[1.01] border border-border/50 hover:border-primary/30'
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
                                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/80 backdrop-blur-sm text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-xs font-medium shadow-lg border border-white/10">
                                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-1" />
                                                {formatTime(slide.timeStamp)}
                                            </div>
                                        )}
                                        
                                        {/* Current Slide Indicator */}
                                        {index === currentSlideIndex && (
                                            <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-primary text-primary-foreground px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                                                <span className="hidden sm:inline">Playing</span>
                                            </div>
                                        )}
                                        
                                        {/* Hover overlay with jump to time button */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                                                <div className="flex items-center justify-between text-white mb-1 sm:mb-2">
                                                    <span className="text-xs sm:text-sm font-semibold">
                                                        Slide {slide.serialNumber || index + 1}
                                                    </span>
                                                    {slide.timeStamp && slide.timeStamp !== "0" && (
                                                        <span className="text-xs bg-black/50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                                                            {formatTime(slide.timeStamp)}
                                                        </span>
                                                    )}
                                                </div>
                                                {slide.timeStamp && slide.timeStamp !== "0" && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full bg-primary hover:bg-primary/90 text-white h-6 sm:h-8 text-xs font-medium transition-all duration-200 hover:scale-105"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            jumpToSlide(index);
                                                        }}
                                                    >
                                                        <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                                        <span className="hidden sm:inline">Jump to Time</span>
                                                        <span className="sm:hidden">Jump</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VideoPlayer;
