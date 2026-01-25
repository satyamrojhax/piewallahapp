import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, ExternalLink } from "lucide-react";

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
  onCopyUrl?: (url: string) => void;
}

const YouTubePlayer = ({ 
  videoUrl, 
  title = "YouTube Video",
  onCopyUrl 
}: YouTubePlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setError("Failed to load YouTube video");
      setIsLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, []);

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1`;
    }
    return url;
  };

  const copyVideoUrl = () => {
    if (onCopyUrl) {
      onCopyUrl(videoUrl);
    }
  };

  const openInYouTube = () => {
    window.open(videoUrl, '_blank');
  };

  return (
    <Card className="overflow-hidden bg-black">
      <div className="relative aspect-video">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <p className="text-white">Loading YouTube video...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="text-center text-white p-4">
              <p className="mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="secondary">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* YouTube Iframe */}
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(videoUrl)}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>

      {/* Video Info */}
      <div className="p-4 bg-background">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyVideoUrl}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={openInYouTube}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              YouTube
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• This video is hosted on YouTube</p>
          <p>• Use YouTube's built-in controls for playback</p>
          <p>• Click "YouTube" to open in YouTube app</p>
        </div>
      </div>
    </Card>
  );
};

export default YouTubePlayer;
