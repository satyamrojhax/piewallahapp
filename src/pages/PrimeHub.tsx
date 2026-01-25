import { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Play, 
  Clock, 
  User, 
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertTriangle,
  Shield,
  Grid3x3,
  Tag as TagIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchPrimeVideosChunked, 
  fetchCategories, 
  fetchTags, 
  PrimeVideo, 
  Category, 
  Tag,
  formatDate 
} from "@/services/primeHubService";

const PrimeHub = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
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
      navigate("/primehub/pin", { state: { from: "/primehub" } });
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

  // Navigate to Categories page
  const handleCategoriesClick = () => {
    navigate("/primehub/categories");
  };

  // Navigate to Tags page
  const handleTagsClick = () => {
    navigate("/primehub/tags");
  };

  // Fetch categories and tags
  const { data: categories = [] } = useQuery({
    queryKey: ["prime-categories"],
    queryFn: fetchCategories,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["prime-tags"],
    queryFn: fetchTags,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  // Infinite scroll for videos
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["prime-videos", selectedCategory, selectedTags, debouncedSearchTerm],
    queryFn: ({ pageParam = 1 }) => 
      fetchPrimeVideosChunked(pageParam as number, 52, {
        category: selectedCategory,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        search: debouncedSearchTerm || undefined,
      }),
    getNextPageParam: (lastPage: any) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten infinite query data
  const videos = useMemo(() => {
    return infiniteData?.pages.flatMap((page: any) => page.videos || []) || [];
  }, [infiniteData]);

  // Handle video click
  const handleVideoClick = (video: PrimeVideo) => {
    navigate(`/primehub/video/${video.id}`, { state: { video } });
  };

  // Toggle tag selection
  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
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

  // Show loading screen while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 md:pb-12">
        <div className="mb-6 flex items-center justify-between">
          <BackButton label="Back" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">18+</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">PrimeHub</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">PrimeHub</h1>
          <p className="text-muted-foreground">Exclusive premium content for Prime members</p>
        </div>

        {/* Categories and Tags Buttons */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Button
            onClick={handleCategoriesClick}
            className="h-16 bg-gradient-primary hover:opacity-90 flex items-center gap-3"
            size="lg"
          >
            <Grid3x3 className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Browse Categories</div>
              <div className="text-xs opacity-80">Explore videos by category</div>
            </div>
          </Button>
          
          <Button
            onClick={handleTagsClick}
            variant="outline"
            className="h-16 flex items-center gap-3"
            size="lg"
          >
            <TagIcon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Browse Tags</div>
              <div className="text-xs opacity-80">Explore videos by tags</div>
            </div>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                All
              </Button>
              {categories.map((category: Category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name} ({tag.count})
                </Badge>
              ))}
            </div>
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
              Failed to load PrimeHub content. Please try again.
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
              Try adjusting your filters or search terms.
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
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.categories.slice(0, 2).map((categoryId) => {
                          const category = categories.find((c: Category) => c.id === categoryId);
                          return category ? (
                            <Badge key={categoryId} variant="outline" className="text-xs">
                              {category.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
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
      </div>
    </div>
  );
};

export default PrimeHub;
