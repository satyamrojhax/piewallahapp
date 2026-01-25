import { useState } from "react";
import { Heart, Smile, Laugh, Eye, MessageSquare, FileText, ExternalLink } from "lucide-react";
import { CommunityPost } from "@/services/communityService";
import Comments from "./Comments";

const PostCard = ({ post }: { post: CommunityPost }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) {
      return `${diffInMins} mins ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const decodeHtml = (html: string) => {
    // First decode URL encoding
    let decoded = decodeURIComponent(html);
    
    // Then decode HTML entities
    const txt = document.createElement("textarea");
    txt.innerHTML = decoded;
    return txt.value;
  };

  const getTotalReactions = (reactions: CommunityPost['reactions']) => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  const totalReactions = getTotalReactions(post.reactions);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-border dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {post.user.profileImage ? (
                  <img 
                    src={post.user.profileImage} 
                    alt={post.user.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-primary">
                    {post.user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-white text-sm truncate">{post.user.name}</h3>
                <p className="text-xs text-muted-foreground dark:text-gray-400">{formatDate(post.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {post.description && (
            <div 
              className="text-foreground dark:text-gray-100 text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: decodeHtml(post.description) }} 
            />
          )}
        </div>

        {/* Attachments */}
        {post.attachmentUrls && post.attachmentUrls.length > 0 && (
          <div className="px-3 pb-3">
            <div className="space-y-2">
              {post.attachmentUrls.map((attachment, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-muted dark:bg-gray-800">
                  {attachment.type === 'images' ? (
                    <div 
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(attachment.url)}
                    >
                      <img 
                        src={attachment.url} 
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-auto max-h-64 object-cover"
                      />
                    </div>
                  ) : attachment.type === 'videos' ? (
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm font-medium">Watch Video</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <span className="text-sm text-muted-foreground dark:text-gray-400">
                          {attachment.url.split('/').pop() || 'Document'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground dark:text-gray-400">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-medium">{totalReactions}</span>
              {post.total_comments > 0 && (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium">{post.total_comments}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground dark:text-gray-400">
              <Eye className="h-3 w-3" />
              <span className="text-xs">{post.totalUniqueViews}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <Comments postId={post._id} totalComments={post.total_comments} />
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={selectedImage} 
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/30 transition-colors"
              onClick={closeImageModal}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
