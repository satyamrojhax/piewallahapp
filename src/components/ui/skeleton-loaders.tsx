import { Skeleton } from "./skeleton";
import { Card } from "./card";

// Enhanced Card Skeleton Loader with shimmer effect
export const CardSkeleton = ({ className }: { className?: string }) => (
  <Card className={`${className} overflow-hidden`}>
    <div className="p-6 space-y-4">
      <div className="relative overflow-hidden rounded-lg">
        <Skeleton className="h-4 w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-muted animate-shimmer" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  </Card>
);

// Enhanced Batch Card Skeleton with hover effect
export const BatchCardSkeleton = () => (
  <Card className="overflow-hidden group">
    <div className="relative">
      <Skeleton className="h-48 w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
    </div>
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </Card>
);

// Enhanced Topic Card Skeleton
export const TopicCardSkeleton = () => (
  <Card className="p-4 hover:shadow-elevation-2 transition-all duration-300">
    <div className="flex items-start gap-3">
      <div className="relative overflow-hidden rounded-lg">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-muted animate-shimmer" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </Card>
);

// Enhanced Video Player Skeleton
export const VideoPlayerSkeleton = () => (
  <div className="space-y-4">
    <div className="relative overflow-hidden rounded-lg bg-muted">
      <Skeleton className="h-96 w-full" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// Enhanced Profile Skeleton
export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background pb-20">
    <div className="container mx-auto px-4 pt-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="relative overflow-hidden rounded-full mx-auto mb-4 w-24 h-24">
              <Skeleton className="h-full w-full rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-muted animate-shimmer rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
            <Skeleton className="h-10 w-full" />
          </Card>
          <Card className="mt-8 p-6">
            <Skeleton className="h-6 w-1/3 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8">
            <Skeleton className="h-6 w-1/3 mb-6" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-2/3" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced List Skeleton Loader
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div 
        key={i} 
        className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <div className="relative overflow-hidden rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

// Enhanced Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-4">
    <div className="flex space-x-4 p-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={rowIndex} 
        className="flex space-x-4 p-4 border-b hover:bg-muted/30 transition-all duration-300"
        style={{ animationDelay: `${rowIndex * 50}ms` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Enhanced Dashboard Stats Skeleton
export const StatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card 
        key={i} 
        className="p-6 hover:shadow-elevation-2 transition-all duration-300 card-hover"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <div className="relative overflow-hidden rounded-lg mb-2">
          <Skeleton className="h-8 w-8" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
        </div>
        <Skeleton className="h-8 w-1/2 mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </Card>
    ))}
  </div>
);

// Enhanced Schedule Card Skeleton
export const ScheduleCardSkeleton = () => (
  <Card className="p-4 hover:shadow-elevation-2 transition-all duration-300">
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="relative overflow-hidden rounded-full">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-muted animate-shimmer" />
        </div>
        <Skeleton className="h-4 w-12 mt-1" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  </Card>
);

// Enhanced Content Grid Skeleton
export const ContentGridSkeleton = ({ items = 6 }: { items?: number }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: items }).map((_, i) => (
      <Card 
        key={i} 
        className="overflow-hidden hover:shadow-elevation-2 transition-all duration-300 card-hover"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <div className="relative">
          <Skeleton className="h-32 w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
        </div>
        <div className="p-4 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    ))}
  </div>
);

// Enhanced Navigation Skeleton
export const NavigationSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center space-x-4">
      <div className="relative overflow-hidden rounded-lg">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer" />
      </div>
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="flex items-center space-x-2">
      <div className="relative overflow-hidden rounded-full">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-muted animate-shimmer rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-muted border-t-transparent`}>
        <div className="h-full w-full rounded-full border-2 border-transparent border-t-current" />
      </div>
    </div>
  );
};

// Pulse Loading Component
export const PulseLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-12 w-12 bg-muted rounded-full loading-pulse" />
  </div>
);
