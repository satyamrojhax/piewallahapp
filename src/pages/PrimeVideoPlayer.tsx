import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Calendar,
  Share2,
  Download,
  Heart,
  AlertTriangle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { PrimeVideo, formatDate } from "@/services/primeHubService";

const PrimeVideoPlayer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [video, setVideo] = useState<PrimeVideo | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Get video from location state
    if (location.state?.video) {
      setVideo(location.state.video);
    } else {
      // If no video state, redirect back to PrimeHub
      navigate("/primehub");
    }
  }, [location.state, navigate]);

  // Handle video loading errors
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // Video loading error handling
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share && video) {
      navigator.share({
        title: video.title,
        text: "Check out this video!",
        url: window.location.href,
      });
    }
  };

  // Handle download
  const handleDownload = () => {
    if (video) {
      window.open(video.video_url, '_blank');
    }
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h2 className="text-xl font-semibold mb-2">Video not found</h2>
          <Button onClick={() => navigate("/primehub")}>
            Back to PrimeHub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 md:pb-12">
        <div className="mb-6">
          <BackButton label="Back to PrimeHub" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden bg-black">
              <div className="relative aspect-video">
                {video && (
                  <video
                    ref={videoRef}
                    id="primehub-player"
                    className="w-full h-full"
                    controls
                    poster={video.thumbnail_url}
                    onError={handleVideoError}
                    preload="metadata"
                    playsInline
                  >
                    <source src={video.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                
                {/* 18+ Warning Overlay */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white font-bold">18+</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Video Title and Actions */}
            <Card className="mt-6 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{video?.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {video && formatDate(video.date)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    className={isLiked ? "text-red-500 border-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(video?.video_url, '_blank', 'noopener,noreferrer')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimeVideoPlayer;
