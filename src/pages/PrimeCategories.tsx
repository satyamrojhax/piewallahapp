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
  ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchCategories, 
  fetchVideosByCategory, 
  Category, 
  PrimeVideo,
  formatDate 
} from "@/services/primeHubService";

const PrimeCategories = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [showPinError, setShowPinError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
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
      navigate("/primehub/pin", { state: { from: "/primehub/categories" } });
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

  // Fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["prime-categories"],
    queryFn: fetchCategories,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  });

  // Infinite scroll for videos by category
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["prime-videos-category", selectedCategory?.id, debouncedSearchTerm],
    queryFn: ({ pageParam = 1 }) => 
      selectedCategory ? fetchVideosByCategory(selectedCategory.id, pageParam as number, 12) : 
      Promise.resolve({ videos: [], hasNextPage: false, currentPage: 1, totalCount: 0, totalPages: 0 }),
    getNextPageParam: (lastPage: any) => lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated && !!selectedCategory,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage || !selectedCategory) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, selectedCategory]);

  // Flatten infinite query data
  const videos = useMemo(() => {
    return infiniteData?.pages.flatMap((page: any) => page.videos || []) || [];
  }, [infiniteData]);

  // Handle video click
  const handleVideoClick = (video: PrimeVideo) => {
    navigate(`/primehub/video/${video.id}`, { state: { video } });
  };

  // Handle category selection
  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
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
          {selectedCategory ? (
            <Button
              variant="ghost"
              onClick={handleBackToCategories}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </Button>
          ) : (
            <BackButton label="Back" />
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">18+</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {selectedCategory ? selectedCategory.name : "Categories"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {selectedCategory ? selectedCategory.name : "PrimeHub Categories"}
          </h1>
          <p className="text-muted-foreground">
            {selectedCategory 
              ? `Browse videos in ${selectedCategory.name} category (${selectedCategory.count} videos)`
              : "Browse videos by category"
            }
          </p>
        </div>

        {/* Categories Grid */}
        {!selectedCategory && (
          <>
            {isCategoriesLoading ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-32 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">No Categories Found</h3>
                <p className="text-muted-foreground">
                  No categories are available at the moment.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category: Category, index: number) => (
                  <div
                    key={category.id}
                    className="transform transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    <Card 
                      className="overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 card-hover"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/10">
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-primary font-bold text-xl">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-black/80 text-white">
                            {category.count} videos
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description || `Browse ${category.count} videos in this category`}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Videos Grid for Selected Category */}
        {selectedCategory && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search videos in this category..."
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
                  Failed to load videos for this category. Please try again.
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
                  No videos found in this category.
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

export default PrimeCategories;
