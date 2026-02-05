import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Book, Clock, MessageSquare, Loader2 } from "lucide-react";
import { fetchCommunityChannels, fetchCommunityPostsWithPagination, CommunityChannel, CommunityPost, PaginatedPostsResult } from "@/services/communityService";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunitySectionProps {
  batchId: string;
}

const POSTS_PER_PAGE = 10;

const CommunitySection = ({ batchId }: CommunitySectionProps) => {
  const [activeTab, setActiveTab] = useState<"students" | "teachers">("students");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data: channels = [], isLoading: isChannelsLoading } = useQuery<CommunityChannel[]>({
    queryKey: ["community-channels", batchId],
    queryFn: () => fetchCommunityChannels(batchId),
    enabled: !!batchId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find student and teacher channels
  const studentChannel = channels.find(ch => ch.type === "forum");
  const teacherChannel = channels.find(ch => ch.type === "feed");

  // Infinite query for student posts
  const {
    data: studentInfiniteData,
    fetchNextPage: fetchNextStudentPage,
    hasNextPage: hasStudentNextPage,
    isFetchingNextPage: isFetchingStudentNext,
    isLoading: isStudentLoading,
    isError: isStudentError,
    refetch: refetchStudentPosts,
  } = useInfiniteQuery({
    queryKey: ["community-posts-infinite", studentChannel?._id],
    queryFn: ({ pageParam = 1 }) => 
      studentChannel ? fetchCommunityPostsWithPagination(studentChannel._id, pageParam as number) : 
      Promise.resolve({ posts: [], hasNextPage: false, currentPage: 1, totalCount: 0 }),
    getNextPageParam: (lastPage: PaginatedPostsResult) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: !!studentChannel,
    retry: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Infinite query for teacher posts
  const {
    data: teacherInfiniteData,
    fetchNextPage: fetchNextTeacherPage,
    hasNextPage: hasTeacherNextPage,
    isFetchingNextPage: isFetchingTeacherNext,
    isLoading: isTeacherLoading,
    isError: isTeacherError,
    refetch: refetchTeacherPosts,
  } = useInfiniteQuery({
    queryKey: ["community-posts-infinite", teacherChannel?._id],
    queryFn: ({ pageParam = 1 }) => 
      teacherChannel ? fetchCommunityPostsWithPagination(teacherChannel._id, pageParam as number) : 
      Promise.resolve({ posts: [], hasNextPage: false, currentPage: 1, totalCount: 0 }),
    getNextPageParam: (lastPage: PaginatedPostsResult) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: !!teacherChannel,
    retry: 1,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Flatten infinite query data
  const studentPosts = useMemo(() => {
    return studentInfiniteData?.pages.flatMap((page: PaginatedPostsResult) => page.posts || []) || [];
  }, [studentInfiniteData]);

  const teacherPosts = useMemo(() => {
    return teacherInfiniteData?.pages.flatMap((page: PaginatedPostsResult) => page.posts || []) || [];
  }, [teacherInfiniteData]);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const shouldLoadStudent = activeTab === "students" && hasStudentNextPage && !isFetchingStudentNext;
    const shouldLoadTeacher = activeTab === "teachers" && hasTeacherNextPage && !isFetchingTeacherNext;

    if (!shouldLoadStudent && !shouldLoadTeacher) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === "students" && shouldLoadStudent) {
            fetchNextStudentPage();
          } else if (activeTab === "teachers" && shouldLoadTeacher) {
            fetchNextTeacherPage();
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [
    activeTab, 
    hasStudentNextPage, 
    hasTeacherNextPage, 
    isFetchingStudentNext, 
    isFetchingTeacherNext,
    fetchNextStudentPage,
    fetchNextTeacherPage
  ]);

  // Show bubble loading animation while checking for channels
  if (isChannelsLoading) {
    return (
      <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Bubble loading animation */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-full w-32 mx-auto animate-pulse"></div>
            <div className="h-3 bg-muted rounded-full w-24 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!studentChannel && !teacherChannel) {
    return (
      <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground dark:text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">Community Not Available</h3>
        <p className="text-muted-foreground dark:text-gray-400">
          Community features are not available for this batch yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "students" | "teachers")}>
        <TabsList className="grid w-full grid-cols-2">
          {studentChannel && (
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students Feed</span>
              <span className="sm:hidden">Students</span>
              {studentPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {studentPosts.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {teacherChannel && (
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Teachers Feed</span>
              <span className="sm:hidden">Teachers</span>
              {teacherPosts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {teacherPosts.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Students Feed */}
        {studentChannel && (
          <TabsContent value="students" className="space-y-4">
            {isStudentLoading && studentPosts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border dark:border-gray-800">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="px-3 py-2 border-t border-border dark:border-gray-800">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isStudentError ? (
              <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">Error Loading Posts</h3>
                <p className="text-muted-foreground dark:text-gray-400 mb-4">
                  Failed to load student posts. Please try again.
                </p>
                <button 
                  onClick={() => refetchStudentPosts()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : studentPosts.length > 0 ? (
              <div className="space-y-4">
                {studentPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="transform transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
                
                {/* Load more indicator */}
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isFetchingStudentNext && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Loading more posts...</span>
                    </div>
                  )}
                  {!hasStudentNextPage && studentPosts.length > 0 && (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">You've reached the end</p>
                      <p className="text-xs mt-1">Showing all {studentPosts.length} posts</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground dark:text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">No Student Posts Yet</h3>
                <p className="text-muted-foreground dark:text-gray-400">
                  Be the first to start a discussion in the student feed!
                </p>
              </div>
            )}
          </TabsContent>
        )}

        {/* Teachers Feed */}
        {teacherChannel && (
          <TabsContent value="teachers" className="space-y-4">
            {isTeacherLoading && teacherPosts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border dark:border-gray-800">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <div className="px-3 py-2 border-t border-border dark:border-gray-800">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isTeacherError ? (
              <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">Error Loading Posts</h3>
                <p className="text-muted-foreground dark:text-gray-400 mb-4">
                  Failed to load teacher posts. Please try again.
                </p>
                <button 
                  onClick={() => refetchTeacherPosts()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : teacherPosts.length > 0 ? (
              <div className="space-y-4">
                {teacherPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="transform transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
                
                {/* Load more indicator */}
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isFetchingTeacherNext && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Loading more posts...</span>
                    </div>
                  )}
                  {!hasTeacherNextPage && teacherPosts.length > 0 && (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">You've reached the end</p>
                      <p className="text-xs mt-1">Showing all {teacherPosts.length} posts</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-background dark:bg-gray-900 border border-border dark:border-gray-800 rounded-lg p-8 text-center">
                <Book className="mx-auto mb-4 h-12 w-12 text-muted-foreground dark:text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">No Teacher Posts Yet</h3>
                <p className="text-muted-foreground dark:text-gray-400">
                  Teachers haven't posted anything yet. Check back later for updates!
                </p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default CommunitySection;
