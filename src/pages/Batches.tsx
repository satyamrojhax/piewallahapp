import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "@/config/firebase";
import { 
  CalendarClock, 
  Users, 
  Video, 
  Clock, 
  Book, 
  PlayCircle, 
  Loader2, 
  CheckCircle,
  Search,
  Filter,
  Star,
  TrendingUp,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { fetchPopularBatches, PopularBatch } from "@/services/widgetService";
import { fetchBatchesChunked, Batch } from "@/services/batchService";
import { ContentGridSkeleton } from "@/components/ui/skeleton-loaders";

const IMAGE_FALLBACK = "https://static.pw.live/5eb393ee95fab7468a79d189/9ef3bea0-6eed-46a8-b148-4a35dd6b3b61.png";

// Popular Batch Card Component
const PopularBatchCard = ({ batch }: { batch: PopularBatch }) => {
  const typeInfo = batch.typeInfo;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBatchStatus = (typeInfo: any) => {
    const now = new Date();
    const startDate = typeInfo.startDate ? new Date(typeInfo.startDate) : null;
    const endDate = typeInfo.endDate ? new Date(typeInfo.endDate) : null;
    
    // Check descriptionPointers for isOngoing flag
    const hasOngoingFlag = typeInfo.card?.descriptionPointers?.some((pointer: any) => pointer.isOngoing);
    
    if (hasOngoingFlag || (startDate && now >= startDate && endDate && now <= endDate)) {
      return "Ongoing";
    } else if (startDate && now < startDate) {
      return "Upcoming";
    } else if (endDate && now > endDate) {
      return "Completed";
    }
    return typeInfo.status || "Active";
  };

  const batchStatus = getBatchStatus(typeInfo);

  const getImageUrl = () => {
    // First try typeInfo.card.files array (primary source from API)
    if (typeInfo.card?.files?.length > 0) {
      // Look for image files first
      const imageFile = typeInfo.card.files.find(file => file.type === 'IMAGE');
      if (imageFile?.url) {
        return imageFile.url;
      }
      
      // If no image file, look for video files and use their thumbnail
      const videoFile = typeInfo.card.files.find(file => file.type === 'VIDEO');
      if (videoFile?.video?.image) {
        return videoFile.video.image;
      }
      
      // Fallback to first file's URL if it's not a video
      const firstFile = typeInfo.card.files[0];
      if (firstFile?.url && firstFile.type !== 'VIDEO') {
        return firstFile.url;
      }
    }
    
    // Try typeInfo.previewImage object - fix URL construction
    if (typeInfo.previewImage?.baseUrl && typeInfo.previewImage?.key) {
      // Ensure baseUrl ends with / and key doesn't start with /
      const baseUrl = typeInfo.previewImage.baseUrl.endsWith('/') 
        ? typeInfo.previewImage.baseUrl 
        : typeInfo.previewImage.baseUrl + '/';
      const key = typeInfo.previewImage.key.startsWith('/') 
        ? typeInfo.previewImage.key.slice(1) 
        : typeInfo.previewImage.key;
      return `${baseUrl}${key}`;
    }
    
    // Try typeInfo.previewImageUrl (relative path)
    if (typeInfo.previewImageUrl) {
      return typeInfo.previewImageUrl.startsWith('http') 
        ? typeInfo.previewImageUrl
        : `https://static.pw.live/${typeInfo.previewImageUrl}`;
    }
    
    return IMAGE_FALLBACK;
  };

  const imageUrl = getImageUrl();
  
  return (
    <Card className="group flex flex-col h-full overflow-hidden border border-border/60 shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card will-change-transform">
      {/* Header with Preview Image */}
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl()}
          alt={typeInfo.name}
          className="h-40 sm:h-48 md:h-52 w-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = IMAGE_FALLBACK;
          }}
        />
        
        {/* Status Badges */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1 sm:gap-2">
          {batchStatus && (
            <Badge 
              className={`${
                batchStatus === 'Ongoing' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                  : batchStatus === 'Upcoming'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  : batchStatus === 'Completed'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white text-xs font-medium px-1.5 sm:px-2 py-1 shadow-md`
            }
            >
              {batchStatus}
            </Badge>
          )}
          {typeInfo.markedAsNew && (
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium px-1.5 sm:px-2 py-1 shadow-md">
              New
            </Badge>
          )}
          {typeInfo.isCombo && (
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs font-medium px-1.5 sm:px-2 py-1 shadow-md">
              Combo
            </Badge>
          )}
        </div>

        {/* Fomo Icons */}
        {typeInfo.fomoIcons && typeInfo.fomoIcons.length > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <img 
              src={typeInfo.fomoIcons[0]} 
              alt="Special Offer" 
              className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 object-contain drop-shadow-md"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-150">
            {typeInfo.name}
          </h3>
        </div>

        {/* Description Pointers */}
        {typeInfo.card?.descriptionPointers && typeInfo.card.descriptionPointers.length > 0 && (
          <div className="mb-3 space-y-1">
            {typeInfo.card.descriptionPointers.slice(0, 2).map((pointer, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                {pointer.image && (
                  <img src={pointer.image} alt="" className="h-3 w-3" />
                )}
                <span className="line-clamp-1">{pointer.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Meta Information */}
        <div className="mb-3 space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
          {/* Class and Exam */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-wrap">
            {typeInfo.class && (
              <span className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                <Book className="h-3 w-3" />
                Class {typeInfo.class}
              </span>
            )}
            {typeInfo.exam && typeInfo.exam.length > 0 && (
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                <TrendingUp className="h-3 w-3" />
                {typeInfo.exam.join(", ")}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-wrap">
            {typeInfo.mode && (
              <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                <Video className="h-3 w-3" />
                {typeInfo.mode}
              </span>
            )}
            {typeInfo.card?.language && (
              <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                <Book className="h-3 w-3" />
                {typeInfo.card.language}
              </span>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              FREE
            </span>
            {typeInfo.card?.fees?.total && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{typeInfo.card.fees.total.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-border/50">
          <div className="flex justify-center">
            <Button
              asChild
              size="sm"
              className="bg-gradient-primary hover:opacity-90 transition-all duration-150 w-full text-xs sm:text-sm hover:scale-[1.02] shadow-md hover:shadow-lg"
            >
              <Link to={`/batch/${typeInfo._id}`}>
                View Details
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Regular Batch Card Component
const BatchCard = ({ batch }: { batch: Batch }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBatchStatus = (batch: Batch) => {
    const now = new Date();
    const startDate = batch.startDate ? new Date(batch.startDate) : null;
    const endDate = batch.endDate ? new Date(batch.endDate) : null;
    
    if (startDate && now >= startDate && endDate && now <= endDate) {
      return "Ongoing";
    } else if (startDate && now < startDate) {
      return "Upcoming";
    } else if (endDate && now > endDate) {
      return "Completed";
    }
    return batch.status || "Active";
  };

  const batchStatus = getBatchStatus(batch);

  const getImageUrl = () => {
    if (batch.previewImage?.baseUrl && batch.previewImage?.key) {
      return `${batch.previewImage.baseUrl}${batch.previewImage.key}`;
    }
    return batch.image || IMAGE_FALLBACK;
  };

  return (
    <Card className="group flex flex-col h-full overflow-hidden border border-border/60 shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-card will-change-transform">
      {/* Header with Preview Image */}
      <div className="relative overflow-hidden">
        <img
          src={getImageUrl()}
          alt={batch.name}
          className="h-40 sm:h-48 md:h-52 w-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = IMAGE_FALLBACK;
          }}
        />
        
        {/* Status Badge */}
        {batchStatus && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <Badge 
              className={`${
                batchStatus === 'Ongoing' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                  : batchStatus === 'Upcoming'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                  : batchStatus === 'Completed'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                } text-white text-xs font-medium px-1.5 sm:px-2 py-1 shadow-md`
            }
            >
              {batchStatus}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-150">
            {batch.name}
          </h3>
        </div>

        {/* Meta Information */}
        <div className="mb-3 space-y-1.5 sm:space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-wrap">
            {batch.class && (
              <span className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                <Book className="h-3 w-3" />
                Class {batch.class}
              </span>
            )}
            {batch.exam && batch.exam.length > 0 && (
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                <TrendingUp className="h-3 w-3" />
                {batch.exam.join(", ")}
              </span>
            )}
            {batch.language && (
              <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                <Video className="h-3 w-3" />
                {batch.language}
              </span>
            )}
            {batch.startDate && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                Starts: {formatDate(batch.startDate)}
              </span>
            )}
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              FREE
            </span>
            {batch.fees?.total && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{batch.fees.total.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-border/50">
          <div className="flex justify-center">
            <Button
              asChild
              size="sm"
              className="bg-gradient-primary hover:opacity-90 transition-all duration-150 w-full text-xs sm:text-sm hover:scale-[1.02] shadow-md hover:shadow-lg"
            >
              <Link to={`/batch/${batch._id}`}>
                View Details
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Batches = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Reduced debounce time for better UX
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch popular batches
  const {
    data: popularBatchesData,
    isLoading: isPopularLoading,
    error: popularError,
  } = useQuery({
    queryKey: ["popular-batches"],
    queryFn: fetchPopularBatches,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Infinite scroll for all batches
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isAllLoading,
    error: allError,
  } = useInfiniteQuery({
    queryKey: ["all-batches-chunked", debouncedSearchTerm],
    queryFn: ({ pageParam = 1 }) => fetchBatchesChunked(pageParam as number, 12), // Optimized batch size for mobile
    getNextPageParam: (lastPage: any) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 3, // Reduced to 3 minutes for better mobile performance
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time for mobile
  });

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: 0.05, // Reduced threshold for earlier loading
        rootMargin: "100px", // Reduced margin for mobile performance
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten infinite query data with validation and duplicate removal
  const allBatches = useMemo(() => {
    try {
      const batches = infiniteData?.pages.flatMap((page: any) => page.batches || []) || [];
      
      // Remove duplicates based on _id
      const uniqueBatches = batches.filter((batch: any, index: number, arr: any[]) => {
        if (!batch || !batch._id) return false;
        return arr.findIndex((b: any) => b && b._id === batch._id) === index;
      });
      
      return uniqueBatches;
    } catch (error) {
      console.warn('Error processing batches:', error);
      return [];
    }
  }, [infiniteData]);

  const popularBatches = popularBatchesData || [];
  const total = infiniteData?.pages?.[0]?.total || 0;

  // Filter batches based on search with enhanced error handling
  const filteredBatches = useMemo(() => {
    try {
      if (!debouncedSearchTerm) return allBatches;
      const searchTerm = debouncedSearchTerm.toLowerCase();
      return allBatches.filter((batch: any) => {
        if (!batch || typeof batch !== 'object') return false;
        return batch.name?.toLowerCase().includes(searchTerm) ||
               batch.class?.toLowerCase().includes(searchTerm) ||
               batch.exam?.some((exam: string) => exam.toLowerCase().includes(searchTerm));
      });
    } catch (error) {
      console.warn('Error filtering batches:', error);
      return allBatches;
    }
  }, [allBatches, debouncedSearchTerm]);

  // Filter popular batches based on search with enhanced error handling
  const filteredPopularBatches = useMemo(() => {
    try {
      if (!debouncedSearchTerm) return popularBatches;
      const searchTerm = debouncedSearchTerm.toLowerCase();
      return popularBatches.filter((batch: any) => {
        if (!batch || typeof batch !== 'object') return false;
        const typeInfo = batch.typeInfo || batch;
        return typeInfo.name?.toLowerCase().includes(searchTerm) ||
               typeInfo.class?.toLowerCase().includes(searchTerm) ||
               typeInfo.exam?.some((exam: string) => exam.toLowerCase().includes(searchTerm)) ||
               typeInfo.card?.language?.toLowerCase().includes(searchTerm);
      });
    } catch (error) {
      console.warn('Error filtering popular batches:', error);
      return popularBatches;
    }
  }, [popularBatches, debouncedSearchTerm]);

  const isLoading = isPopularLoading || isAllLoading;
  const error = popularError || allError;

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center shadow-card">
            <p className="mb-4 text-muted-foreground">
              {(error as Error)?.message ?? "Something went wrong while fetching batches."}
            </p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-primary hover:opacity-90">
              Try again
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8">
          {/* Back Button - Separate from title */}
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Centered Title and Description */}
          <div className="text-center">
            <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Explore Our Batches
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Discover the perfect learning batch tailored to your educational journey
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm sm:text-base border-border/60 focus:border-primary/50 transition-colors duration-200"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Popular Batches Section */}
        {filteredPopularBatches.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <div className="mb-4 sm:mb-6 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                Popular Batches {debouncedSearchTerm && `(${filteredPopularBatches.length} found)`}
              </h2>
            </div>
            
            {isPopularLoading ? (
              <ContentGridSkeleton items={6} />
            ) : (
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPopularBatches.map((batch, index) => {
                  const uniqueKey = batch.typeId || `popular-${index}`;
                  return (
                    <PopularBatchCard key={uniqueKey} batch={batch} />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Batches Section */}
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                All Batches
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {isLoading ? 'Loading batches...' : `Showing ${filteredBatches.length} of ${total} batches`}
              </p>
            </div>
          </div>

          {/* Batches Grid with Infinite Scroll */}
          <div className="space-y-6 sm:space-y-8">
            {isAllLoading && filteredBatches.length === 0 ? (
              <ContentGridSkeleton items={9} />
            ) : filteredBatches.length === 0 && !isLoading ? (
              <Card className="p-6 sm:p-8 md:p-12 text-center shadow-card border-border/60">
                <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-light">
                  <CalendarClock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
                  No batches found
                </h3>
                <p className="mx-auto mb-6 sm:mb-8 max-w-md text-sm sm:text-base text-muted-foreground">
                  Try adjusting your search terms to find the perfect batch for you.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:scale-[1.02] shadow-md"
                >
                  Clear Search
                </Button>
              </Card>
            ) : (
              <>
                {/* Mobile Optimized Grid */}
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBatches.map((batch: any, index: number) => {
                    // Additional validation for each batch
                    if (!batch || !batch._id) {
                      console.warn('Invalid batch in filteredBatches:', batch);
                      return null;
                    }
                    
                    const uniqueKey = batch._id || `batch-${index}`;
                    return (
                      <div
                        key={uniqueKey}
                        className="transform transition-all duration-200"
                        style={{
                          animationDelay: `${Math.min(index * 30, 300)}ms`, // Reduced delay and capped max
                          animation: 'fadeInUp 0.3s ease-out forwards',
                          opacity: 0,
                        }}
                      >
                        <BatchCard batch={batch} />
                      </div>
                    );
                  }).filter(Boolean)}
                </div>

                {/* Load More Indicator */}
                <div ref={loadMoreRef} className="flex justify-center py-6 sm:py-8">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-3 text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span className="text-sm font-medium">Loading more batches...</span>
                    </div>
                  )}
                  {!hasNextPage && filteredBatches.length > 0 && (
                    <div className="text-center text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
                      <p className="text-sm font-medium">You've reached the end</p>
                      <p className="text-xs mt-1">Showing all {filteredBatches.length} batches</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Batches;
