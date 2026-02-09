import React from 'react';
import ProductionVideoPlayer from './ProductionVideoPlayer';
import "@/config/firebase";

// Example usage data - replace with actual API response
const exampleVideoData = {
  success: true,
  source: "OpenSpace",
  powered_by: "Satyam RojhaX",
  data: {
    url: "https://example.com/protected/video/master.mpd",
    signedUrl: "?URLPrefix=example&Expires=1234567890&Signature=abc123",
    urlType: "penpencilvdo" as const,
    videoContainer: "DASH" as const,
    cdnType: "Gcp"  },
  stream_url: "https://example.com/protected/video/master.mpd?URLPrefix=example&Expires=1234567890&Signature=abc123",
  url_type: "penpencilvdo",
  drm: {
    kid: "85ac946a31827971c852184d56c62a97",
    key: "b235a289e3644eafb5d8aa1ed8e6432b"
  }
};

const youtubeExampleData = {
  success: true,
  source: "OpenSpace",
  powered_by: "Satyam RojhaX",
  data: {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    signedUrl: "",
    urlType: "youtube" as const,
    videoContainer: "DASH" as const
  },
  stream_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  url_type: "youtube"
};

const ProductionVideoPlayerExample: React.FC = () => {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">DRM Protected DASH Video</h2>
        <div className="aspect-video w-full max-w-4xl mx-auto">
          <ProductionVideoPlayer 
            videoData={exampleVideoData} 
            autoplay={false}
            className="w-full h-full rounded-lg overflow-hidden"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">YouTube Video</h2>
        <div className="aspect-video w-full max-w-4xl mx-auto">
          <ProductionVideoPlayer 
            videoData={youtubeExampleData} 
            autoplay={false}
            className="w-full h-full rounded-lg overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionVideoPlayerExample;
