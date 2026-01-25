import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Heart, Loader2, ChevronDown, ChevronUp, User } from "lucide-react";
import { fetchPostComments, fetchCommentReplies, Comment } from "@/services/communityService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentsProps {
  postId: string;
  totalComments: number;
}

const CommentItem = ({ comment, postId }: { comment: Comment; postId: string }) => {
  const [showReplies, setShowReplies] = useState(false);
  
  const { data: repliesData, isLoading: isLoadingReplies } = useQuery({
    queryKey: ["comment-replies", postId, comment._id],
    queryFn: () => fetchCommentReplies(postId, comment._id),
    enabled: showReplies && comment.childCommentCount > 0,
  });

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

  const getUserDisplayName = (comment: Comment) => {
    if (comment.createdBy.firstName && comment.createdBy.lastName) {
      return `${comment.createdBy.firstName} ${comment.createdBy.lastName}`;
    }
    return comment.createdBy.name || 'Anonymous';
  };

  const getUserProfileImage = (comment: Comment) => {
    if (comment.createdBy.imageId) {
      return `${comment.createdBy.imageId.baseUrl}${comment.createdBy.imageId.key}`;
    }
    return comment.createdBy.profileImage;
  };

  return (
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            {getUserProfileImage(comment) ? (
              <img 
                src={getUserProfileImage(comment)} 
                alt={getUserDisplayName(comment)}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-muted dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground dark:text-white text-sm truncate">
                {getUserDisplayName(comment)}
              </h4>
              <span className="text-xs text-muted-foreground dark:text-gray-400 whitespace-nowrap ml-2">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-foreground dark:text-gray-100 text-sm leading-relaxed break-words">
              {comment.text}
            </p>
          </div>
          
          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2 px-1">
            <div className="flex items-center gap-1 text-muted-foreground dark:text-gray-400">
              <Heart className="h-3 w-3" />
              <span className="text-xs">{comment.upVoteCount}</span>
            </div>
            {comment.childCommentCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-auto p-0 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white"
              >
                <div className="flex items-center gap-1">
                  {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  <span className="text-xs">
                    {comment.childCommentCount} {comment.childCommentCount === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && comment.childCommentCount > 0 && (
        <div className="ml-11 space-y-3">
          {isLoadingReplies ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : repliesData?.data && repliesData.data.length > 0 ? (
            repliesData.data.map((reply) => (
              <CommentItem key={reply._id} comment={reply} postId={postId} />
            ))
          ) : (
            <div className="text-center py-2 text-muted-foreground dark:text-gray-400 text-sm">
              No replies yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Comments = ({ postId, totalComments }: CommentsProps) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observer = useRef<IntersectionObserver>();
  const lastCommentRef = useRef<HTMLDivElement>(null);

  const COMMENTS_PER_PAGE = 10;

  // Initial fetch
  const { data: initialData, isLoading, error, refetch } = useQuery({
    queryKey: ["post-comments", postId, 1],
    queryFn: () => fetchPostComments(postId, COMMENTS_PER_PAGE, 0),
    enabled: showComments,
  });

  // Update comments when initial data changes
  const updateComments = useCallback((newComments: Comment[], currentPage: number) => {
    if (currentPage === 1) {
      setComments(newComments);
    } else {
      setComments(prev => [...prev, ...newComments]);
    }
  }, []);

  // Reset state when toggling comments
  const toggleComments = () => {
    if (!showComments) {
      setComments([]);
      setPage(1);
      setHasMore(true);
    }
    setShowComments(!showComments);
  };

  // Load more comments
  const loadMoreComments = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const skip = (nextPage - 1) * COMMENTS_PER_PAGE;
      const result = await fetchPostComments(postId, COMMENTS_PER_PAGE, skip);
      
      updateComments(result.data, nextPage);
      setHasMore(result.data.length === COMMENTS_PER_PAGE);
      setPage(nextPage);
    } catch (error) {
      // Error loading more comments
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, postId, updateComments]);

  // Update comments when initial data is fetched
  if (initialData && comments.length === 0) {
    updateComments(initialData.data, 1);
    setHasMore(initialData.data.length === COMMENTS_PER_PAGE);
  }

  // Intersection observer for infinite scroll
  const lastCommentElementRef = useCallback(node => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreComments();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, loadMoreComments]);

  if (totalComments === 0) {
    return null;
  }

  return (
    <div className="border-t border-border dark:border-gray-800">
      {/* Comments Toggle */}
      <Button
        variant="ghost"
        onClick={toggleComments}
        className="w-full justify-start h-auto py-3 px-3 rounded-none hover:bg-muted/50 dark:hover:bg-gray-800/50"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            <span className="text-sm font-medium text-foreground dark:text-white">
              {totalComments} {totalComments === 1 ? 'Comment' : 'Comments'}
            </span>
          </div>
          {showComments ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          )}
        </div>
      </Button>

      {/* Comments Section */}
      {showComments && (
        <div className="px-3 pb-3">
          {isLoading && comments.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4 text-destructive dark:text-red-400 text-sm">
              Failed to load comments. Please try again.
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div
                  key={comment._id}
                  ref={index === comments.length - 1 ? lastCommentElementRef : null}
                >
                  <CommentItem comment={comment} postId={postId} />
                </div>
              ))}
              
              {/* Load more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              {/* Load more button */}
              {!isLoadingMore && hasMore && comments.length > 0 && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreComments}
                    className="text-muted-foreground dark:text-gray-400 border-muted dark:border-gray-700 hover:text-foreground dark:hover:text-white"
                  >
                    Load More Comments
                  </Button>
                </div>
              )}
              
              {/* End of comments indicator */}
              {!hasMore && comments.length > 0 && (
                <div className="text-center py-4 text-muted-foreground dark:text-gray-400 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <span>You've reached the end of the comments</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground dark:text-gray-400 text-sm">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;
