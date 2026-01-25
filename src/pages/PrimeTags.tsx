import { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Play, 
  Calendar,
  Search,
  Loader2,
  AlertTriangle,
  Shield,
  ArrowLeft,
  Tag as TagIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchTags, 
  fetchVideosByTag, 
  Tag, 
  PrimeVideo,
  formatDate 
} from "@/services/primeHubService";

const PrimeTags = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinError, setShowPinError] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Check if user is coming from PIN entry page with successful authentication
  useEffect(() => {
    // Check if user was redirected from PIN entry
    const fromPin = location.state?.from === "/primehub/pin" || 
                   sessionStorage.getItem('primehub-session') === 'true';
    
    if (fromPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('primehub-session', 'true');
    } else {
      // Always redirect to PIN entry page
      navigate("/primehub/pin", { state: { from: "/primehub/tags" } });
    }
  }, [navigate, location.state]);

  // Clear session when leaving the page
  useEffect(() => {
    return () => {
      // Clear session when component unmounts (user navigates away)
      setTimeout(() => {
        sessionStorage.removeItem('primehub-session');
      }, 100);
    };
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle PIN authentication
  const handlePinSubmit = () => {
    if (pin === "2000") {
      setShowPinError(false);
    } else {
      setShowPinError(true);
      setTimeout(() => setShowPinError(false), 2000);
    }
  };

  // Fetch tags
  const { data: tags = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ["prime-tags"],
    queryFn: fetchTags,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  // Infinite scroll for videos by tag
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["prime-videos-tag", selectedTag?.id, debouncedSearchTerm],
    queryFn: ({ pageParam = 1 }) => 
      selectedTag ? fetchVideosByTag(selectedTag.id, pageParam as number, 12) : 
      Promise.resolve({ videos: [], hasNextPage: false, currentPage: 1, totalCount: 0, totalPages: 0 }),
    getNextPageParam: (lastPage: any) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated && !!selectedTag,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage || !selectedTag) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, selectedTag]);

  // Flatten infinite query data
  const videos = useMemo(() => {
    return infiniteData?.pages.flatMap((page: any) => page.videos || []) || [];
  }, [infiniteData]);

  // Handle video click
  const handleVideoClick = (video: PrimeVideo) => {
    navigate(`/primehub/video/${video.id}`, { state: { video } });
  };

  // Handle tag selection
  const handleTagClick = (tag: Tag) => {
    setSelectedTag(tag);
  };

  // Handle back to tags
  const handleBackToTags = () => {
    setSelectedTag(null);
  };

  // Format views
  const formatViews = (views?: number): string => {
    if (!views) return "0";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Get tag color based on index
  const getTagColor = (index: number): string => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-cyan-500"
    ];
    return colors[index % colors.length];
  };

  // PIN Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md p-8 shadow-2xl border-2 border-primary/20">
          <div className="text-center space-y-6">
            {/* 18+ Warning Icon */}
            <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
              <span className="absolute text-white font-bold text-lg">18+</span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">PrimeHub Tags</h1>
              <p className="text-muted-foreground text-sm">
                This content contains mature material. Enter your PIN to continue.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={4}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePinSubmit();
                    }
                  }}
                />
                <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              {showPinError && (
                <div className="text-red-500 text-sm flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Incorrect PIN. Access denied.
                </div>
              )}

              <Button 
                onClick={handlePinSubmit}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                Unlock Tags
              </Button>
            </div>

            <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" />
              Age-restricted content. Enter responsibly.
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 md:pb-12">
        <div className="mb-6 flex items-center justify-between">
          {selectedTag ? (
            <Button
              variant="ghost"
              onClick={handleBackToTags}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tags
            </Button>
          ) : (
            <BackButton label="Back" />
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">18+</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {selectedTag ? selectedTag.name : "Tags"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {selectedTag ? selectedTag.name : "PrimeHub Tags"}
          </h1>
          <p className="text-muted-foreground">
            {selectedTag 
              ? `Browse videos tagged with ${selectedTag.name} (${selectedTag.count} videos)`
              : "Browse videos by tags"
            }
          </p>
        </div>

        {/* Tags Grid */}
        {!selectedTag && (
          <>
            {isTagsLoading ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : tags.length === 0 ? (
              <Card className="p-12 text-center">
                <TagIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No Tags Found</h3>
                <p className="text-muted-foreground">
                  No tags are available at the moment.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag: Tag, index: number) => (
                  <div
                    key={tag.id}
                    className="transform transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 card-hover"
                      onClick={() => handleTagClick(tag)}
                    >
                      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/10">
                        {tag.image ? (
                          <img 
                            src={tag.image} 
                            alt={tag.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className={`w-12 h-12 ${getTagColor(index)}/20 rounded-full flex items-center justify-center`}>
                              <TagIcon className={`w-6 h-6 ${getTagColor(index)}`} />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/80 text-white">
                            {tag.count} videos
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{tag.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tag.description || `Browse ${tag.count} videos with this tag`}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Videos Grid for Selected Tag */}
        {selectedTag && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos with this tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Videos Grid */}
            {isLoading && videos.length === 0 ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <Card className="p-12 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Error Loading Videos</h3>
                <p className="text-muted-foreground mb-4">
                  Failed to load videos for this tag. Please try again.
                </p>
                <Button onClick={() => refetch()} className="bg-gradient-primary hover:opacity-90">
                  Retry
                </Button>
              </Card>
            ) : videos.length === 0 ? (
              <Card className="p-12 text-center">
                <Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No Videos Found</h3>
                <p className="text-muted-foreground">
                  No videos found with this tag.
                </p>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {videos.map((video: PrimeVideo, index: number) => (
                    <div
                      key={video.id}
                      className="transform transition-all duration-300"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      <Card 
                        className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 card-hover"
                        onClick={() => handleVideoClick(video)}
                      >
                        <div className="relative">
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/400x225/333/fff?text=No+Thumbnail";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                          <div className="absolute top-2 right-2">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-xs">18+</span>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="bg-black/80 text-white">
                              HD
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(video.date)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Load More Indicator */}
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm font-medium">Loading more videos...</span>
                    </div>
                  )}
                  {!hasNextPage && videos.length > 0 && (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">You've reached the end</p>
                      <p className="text-xs mt-1">Showing all {videos.length} videos</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrimeTags;
