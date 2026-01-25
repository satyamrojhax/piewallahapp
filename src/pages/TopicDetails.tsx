import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getApiUrl, safeFetch } from '../lib/apiConfig';
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, BookOpen, ChevronRight, Lock, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown, Loader2 } from "lucide-react";
import { canAccessBatchContent } from "@/lib/enrollmentUtils";
import { TopicCardSkeleton, ListSkeleton } from "@/components/ui/skeleton-loaders";
import { fetchTopicsChunked, Topic } from "@/services/topicService";

const TOPICS_API = "/api/topics";

type ResourceValue = number | unknown[];

type ApiResponse = {
  success: boolean;
  topics?: Topic[];
  data?: Topic[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  paginate?: {
    limit: number;
    totalCount: number;
    videosCount: number;
  };
};

type LocationState = {
  subjectName?: string;
  batchName?: string;
  subjectId?: string;
};

const getResourceCount = (value?: ResourceValue) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  return 0;
};

const getTotalResources = (topic: Topic) => {
  const videosCount = getResourceCount(topic.lectureVideos);
  const dppVideosCount = getResourceCount(topic.DppVideos);
  const notesCount = getResourceCount(topic.notes);
  const dppNotesCount = getResourceCount(topic.DppNotes);
  const exercisesCount = getResourceCount(topic.exercises);
  
  return {
    videos: videosCount + dppVideosCount,
    notes: notesCount + dppNotesCount,
    exercises: exercisesCount
  };
};

const TopicDetails = () => {
  const { batchId, subjectSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectName, batchName } = (location.state as LocationState) || {};
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Check if user has access to this batch content
  if (batchId && !canAccessBatchContent(batchId)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="mb-6">
            <BackButton label="Back" />
          </div>
          <Card className="mx-auto max-w-3xl p-8 text-center shadow-card">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-3 text-3xl font-bold text-foreground">Access Restricted</h1>
            <p className="mb-6 text-base text-muted-foreground">
              You need to enroll in this batch to access topics and content.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate(`/batch/${batchId}`)} className="bg-gradient-primary hover:opacity-90">
                Enroll Now
              </Button>
              <Button onClick={() => navigate('/batches')} variant="outline">
                View All Batches
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Infinite scroll for topics
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    error,
  } = useInfiniteQuery({
    queryKey: ["batch-topics-infinite", batchId, subjectSlug],
    queryFn: ({ pageParam = 1 }) => fetchTopicsChunked(batchId!, subjectSlug!, pageParam as number, 12),
    getNextPageParam: (lastPage: any) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: Boolean(batchId && subjectSlug),
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
  const topics = useMemo(() => {
    return infiniteData?.pages.flatMap((page: any) => page.topics || []) || [];
  }, [infiniteData]);

  const total = infiniteData?.pages?.[0]?.total || 0;

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 md:pb-12">
          <div className="mb-6 flex items-center justify-between">
            <BackButton label="Back" />
          </div>

          <div className="mb-8 flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">{subjectName ?? "Subject"}</h1>
            {batchName && <p className="text-sm text-muted-foreground">{batchName}</p>}
          </div>

          {isLoading && topics.length === 0 ? (
            <ListSkeleton items={8} />
          ) : isError ? (
            <Card className="p-12 text-center shadow-card">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-4 text-muted-foreground">{(error as Error)?.message ?? "Unable to load topics."}</p>
              <Button onClick={() => refetch()} className="bg-gradient-primary hover:opacity-90">
                Try again
              </Button>
            </Card>
          ) : topics.length === 0 && !isLoading ? (
            <Card className="p-12 text-center shadow-card">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
              <p className="text-muted-foreground">No topics have been added yet for this subject.</p>
            </Card>
          ) : (
            <>
              {/* Mobile Optimized Grid */}
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic: Topic, index: number) => {
                  const resources = getTotalResources(topic);

                  return (
                    <div
                      key={topic._id}
                      className="transform transition-all duration-300"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      <Card
                        className="rounded-3xl border border-border/60 p-5 shadow-card cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 card-hover"
                        onClick={() => {
                          navigate(`/batch/${batchId}/subject/${subjectSlug}/topic/${topic._id}`, {
                            state: {
                              subjectName,
                              batchName,
                              subjectId: (location.state as LocationState)?.subjectId,
                              topicName: topic.name,
                            },
                          });
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{topic.name}</h3>
                              {topic.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                              {topic.isFree && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Free
                                </span>
                              )}
                            </div>
                            {topic.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {topic.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{resources.videos} Videos</span>
                              <span className="text-border">|</span>
                              <span className="font-medium text-foreground">{resources.exercises} Exercises</span>
                              <span className="text-border">|</span>
                              <span className="font-medium text-foreground">{resources.notes} Notes</span>
                            </div>
                          </div>
                          <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Load More Indicator */}
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Loading more topics...</span>
                  </div>
                )}
                {!hasNextPage && topics.length > 0 && (
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">You've reached the end</p>
                    <p className="text-xs mt-1">Showing all {topics.length} topics</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TopicDetails;
