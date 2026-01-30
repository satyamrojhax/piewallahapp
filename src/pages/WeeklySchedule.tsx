import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getApiUrl, safeFetch } from '../lib/apiConfig';
import { getVideoStreamUrl } from '../services/videoService';
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Users, Video, Clock, BookOpen, PlayCircle, Radio, FileText, Download, Loader2, ArrowLeft, Bell, Calendar, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { getEnrolledBatches } from "@/lib/enrollmentUtils";
import { toast } from "sonner";
import { getCommonHeaders } from "@/lib/auth";
import { fetchScheduleDetails } from "@/services/contentService";
import DotsLoader from "@/components/ui/DotsLoader";
import CountdownTimer from "@/components/CountdownTimer";
import { cn } from "@/lib/utils";

const IMAGE_FALLBACK = "/placeholder.svg";
const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const GC_TIME = 1000 * 60 * 10; // 10 minutes

export type ScheduleItem = {
  _id: string;
  topic: string;
  subject?: string;
  subjectId?: string;
  subjectName?: string;
  batchId: string;
  batchName?: string;
  teacherName?: string;
  startTime: string;
  endTime?: string;
  status?: "live" | "upcoming" | "completed" | string;
  meetingUrl?: string;
  recordingUrl?: string;
  platform?: string;
  image?: string;
  duration?: string;
  tag?: string;
  lectureType?: string;
  parentScheduleId?: string;
  scheduleIds?: string[];
  type?: "LECTURE" | "NOTES" | "DPP_QUIZ" | "DPP_PDF" | "BULK_SCHEDULE";
  // API response structures
  videoDetails?: {
    _id: string;
    dppCount: number;
    startTime: string;
    endTime: string;
    restrictedSchedule: boolean;
    restrictedTime: number;
    batchSubjectId: string;
    date: string;
    teachers: string[];
    urlType: string;
    url: string;
    exerciseIds: any[];
    homeworkIds: any[];
    topic: string;
    isFree: boolean;
    scheduleCode: string;
    lectureType: string;
    scheduleType: string;
    lowDataMode: boolean;
    slug: string;
    status: string;
    chapterId: string;
    isBatchDoubtEnabled: boolean;
    day: number;
    videoDetails?: {
      _id: string;
      id: string;
      name: string;
      image: string;
      videoUrl: string;
      description: string;
      duration: string;
      status: string;
      types: string[];
      createdAt: string;
      drmProtected: boolean;
      isZipDownloadEnabled: boolean;
      findKey: string;
      embedCode: string;
      video_id: string;
      vimeoId: string;
      hls_url: string;
    };
    subjectId: {
      _id: string;
      name: string;
      slug: string;
    };
    tag: string;
    tags: any[];
    videoAnalytics: any;
    isSingleScheduling: boolean;
    isVideoLecture: boolean;
    hasAttachment: boolean;
    isDPPVideos: boolean;
    isDPPNotes: boolean;
    batchId: string;
    previewImageUrl: string;
    previewImageUrlMWeb: string;
    dppScheduleId: string;
    isParentSchedule: boolean;
    classActiveTime: string;
    classEndTime: string;
    meetingId: string;
    zoomCohostId: string[];
    zoomHostId: string[];
    isChatEnabled: boolean;
    timeline: any[];
    contentType: any[];
    conversationId: string;
    isPathshala: boolean;
    isDoubtEnabled: boolean;
    isCopilotEnabled: boolean;
    isCopilotDoubtAllocationEnabled: boolean;
    isCommentDisabled: boolean;
    isShareable: boolean;
    uWebSocketEnabled: boolean;
    isSimulatedLecture: boolean;
    hinglishScheduleId: string;
    classTeaserUrl: string;
    videoContentId: string;
    teacherImage: string;
  };
  notesDetails?: any;
  dppQuizDetails?: any;
  dppPDFDetails?: any;
  bulkScheduleDetails?: any;
  homeworkIds?: Array<{
    _id?: string;
    topic?: string;
    note?: string;
    attachmentIds?: Array<{
      _id?: string;
      baseUrl?: string;
      key?: string;
      name?: string;
    }>;
  }>;
};

type BatchScheduleResponse = {
  success?: boolean;
  data?: ScheduleItem[];
  schedule?: ScheduleItem[];
};

type EnrolledBatch = {
  _id: string;
  name?: string;
};

type EnrolledBatchesResponse = {
  success?: boolean;
  data?: EnrolledBatch[];
  batches?: EnrolledBatch[];
};

// Fetch weekly schedules for a batch
const fetchWeeklySchedules = async (batchId: string, startDate: string, endDate: string, batchSubjectId?: string): Promise<ScheduleItem[]> => {
  const authToken = localStorage.getItem("param_auth_token");
  if (!authToken) {
    // No auth token found
    return [];
  }

  try {
    const subjectId = batchSubjectId || '';
    const url = getApiUrl(`/v2/batches/${batchId}/weekly-schedules`, {
      batchSubjectId: subjectId,
      startDate,
      endDate,
      page: '1'
    });
    
    const response = await safeFetch(url, {
      method: 'GET',
      headers: {
        ...getCommonHeaders(),
        'authorization': `Bearer ${authToken}`,
        'client-version': '1.0.0',
        'referer': 'https://www.pw.live/',
        'origin': 'https://www.pw.live'
      }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        // Weekly Schedules API Error
        return [];
    }
    
    const data: BatchScheduleResponse = await response.json();
    const items = data.data || data.schedule || [];
    
    return items.map((item) => {
      // Extract the correct nested object based on type
      let details: any = {};
      if (item.type === 'LECTURE' && item.videoDetails) {
        details = item.videoDetails;
      } else if (item.type === 'NOTES' && item.notesDetails) {
        details = item.notesDetails;
      } else if (item.type === 'DPP_QUIZ' && item.dppQuizDetails) {
        details = item.dppQuizDetails;
      } else if (item.type === 'DPP_PDF' && item.dppPDFDetails) {
        details = item.dppPDFDetails;
      } else if (item.type === 'BULK_SCHEDULE' && item.bulkScheduleDetails) {
        details = item.bulkScheduleDetails;
      } else {
        // Fallback to item itself if no specific type structure
        details = item;
      }
      
      return {
        ...item,
        batchId,
        startTime: details.startTime || item.startTime,
        endTime: details.endTime || item.endTime,
        topic: details.topic || item.topic,
        subject: details.subjectId?.name || item.subject,
        subjectId: details.subjectId?._id || item.subjectId || batchSubjectId,
        subjectName: details.subjectId?.name || item.subject,
        image: details.videoDetails?.image ||
          details.previewImageUrl ||
          details.previewImageUrlMWeb ||
          details.image ||
          details.thumbnail ||
          details.imageUrl ||
          "https://static.pw.live/5eb393ee95fab7468a79d189/9ef3bea0-6eed-46a8-b148-4a35dd6b3b61.png",
        status: details.status || item.status,
        lectureType: details.lectureType || item.lectureType,
        tag: details.tag || item.tag,
        homeworkIds: details.homeworkIds || item.homeworkIds,
      };
    });
  } catch (error) {
    // Error fetching weekly schedules
    return [];
  }
};

const fetchEnrolledBatches = async (): Promise<EnrolledBatch[]> => {
  return getEnrolledBatches();
};

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getStatus = (startTime: string, endTime?: string): "live" | "upcoming" | "completed" => {
  const now = new Date();
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;
  if (now < start) return "upcoming";
  if (end && now > end) return "completed";
  return "live";
};

const normalizeStatus = (status?: string): "live" | "upcoming" | "completed" => {
  if (!status) return "upcoming";
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("COMPLETED")) return "completed";
  if (upperStatus.includes("LIVE")) return "live";
  if (upperStatus.includes("UPCOMING") || upperStatus.includes("PENDING") || upperStatus.includes("SCHEDULED")) return "upcoming";
  return "upcoming";
};

const statusStyles: Record<"live" | "upcoming" | "completed", string> = {
  live: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  upcoming: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const WeeklySchedule = () => {
  const navigate = useNavigate();
  const [openingMaterialId, setOpeningMaterialId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  // Calendar slider state
  const [currentCalendarIndex, setCurrentCalendarIndex] = useState(0);

  // Enrolled batches
  const {
    data: enrolledBatches = [],
    isLoading: isEnrolledLoading,
    isError: isEnrolledError,
    error: enrolledError,
    refetch: refetchEnrolled,
  } = useQuery<EnrolledBatch[]>({
    queryKey: ["enrolled-batches"],
    queryFn: fetchEnrolledBatches,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  const enrolledBatchIds = useMemo(() => enrolledBatches.map((b) => b._id).filter(Boolean), [enrolledBatches]);
  const hasEnrollments = enrolledBatchIds.length > 0;

  // Calculate week dates
  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Weekly schedules query
  const {
    data: weeklyScheduleItems = [],
    isLoading: isWeeklyLoading,
    isFetching: isWeeklyFetching,
    isError: isWeeklyError,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useQuery<ScheduleItem[]>({
    queryKey: ["weekly-schedules", enrolledBatchIds, formatDate(currentWeekStart), formatDate(currentWeekEnd)],
    queryFn: async () => {
      if (enrolledBatchIds.length === 0) return [];
      
      const schedules = await Promise.all(
        enrolledBatchIds.map(async (batchId) => {
          return await fetchWeeklySchedules(batchId, formatDate(currentWeekStart), formatDate(currentWeekEnd));
        })
      );
      return schedules.flat();
    },
    enabled: hasEnrollments,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  const isLoading = isEnrolledLoading || (hasEnrollments && isWeeklyLoading);
  const isFetching = hasEnrollments && isWeeklyFetching;

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart);
    if (direction === 'prev') {
      newWeekStart.setDate(newWeekStart.getDate() - 7);
    } else {
      newWeekStart.setDate(newWeekStart.getDate() + 7);
    }
    setCurrentWeekStart(newWeekStart);
  };

  // Calendar slider navigation functions
  const prevCalendarSlide = () => {
    setCurrentCalendarIndex((prev) => (prev > 0 ? prev - 1 : maxCalendarIndex));
  };

  const nextCalendarSlide = () => {
    setCurrentCalendarIndex((prev) => (prev < maxCalendarIndex ? prev + 1 : 0));
  };

  // Calculate visible calendar days based on screen size
  const getVisibleDaysCount = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 1; // xs: 1 day
      if (width < 768) return 2; // sm: 2 days
      if (width < 1024) return 3; // md: 3 days
      return 7; // lg: 7 days
    }
    return 7; // default to 7 for SSR
  };

  const visibleDaysCount = getVisibleDaysCount();

  // Group items by day of week
  const groupedByDay = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped: Record<string, ScheduleItem[]> = {};
    
    // Initialize all days
    days.forEach(day => {
      grouped[day] = [];
    });
    
    if (weeklyScheduleItems && Array.isArray(weeklyScheduleItems)) {
      weeklyScheduleItems.forEach(item => {
        if (item && item.startTime) {
          const itemDate = new Date(item.startTime);
          const dayName = days[itemDate.getDay() === 0 ? 6 : itemDate.getDay() - 1];
          if (selectedBatchId === "all" || item.batchId === selectedBatchId) {
            grouped[dayName].push(item);
          }
        }
      });
    }
    
    // Sort items within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    
    return grouped;
  }, [weeklyScheduleItems, selectedBatchId]);

  // Ensure each item has a status and normalize it
  const itemsWithStatus = useMemo(() =>
    weeklyScheduleItems.map((item) => ({
      ...item,
      status: normalizeStatus(item.status) || getStatus(item.startTime, item.endTime),
    })),
    [weeklyScheduleItems]
  );

  // Filter by selected batch
  const displayedClasses = useMemo(() => {
    if (selectedBatchId === "all") {
      return itemsWithStatus;
    }
    return itemsWithStatus.filter((item) => item.batchId === selectedBatchId);
  }, [itemsWithStatus, selectedBatchId]);

  // Generate calendar days with enhanced design
  const calendarDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(currentWeekStart);
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      
      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
      const daySchedules = groupedByDay[dayName] || [];
      const isToday = currentDay.toDateString() === today.toDateString();
      const isPast = currentDay < today && !isToday;
      
      // Count classes by status
      const liveClasses = daySchedules.filter(s => s.tag === 'Live' || s.status === 'live').length;
      const upcomingClasses = daySchedules.filter(s => s.tag === 'Upcoming' || s.status === 'upcoming').length;
      const completedClasses = daySchedules.filter(s => s.tag === 'Ended' || s.status === 'completed').length;
      
      days.push({
        date: currentDay,
        dayName: dayName.substring(0, 3), // Short day name
        fullDayName: dayName,
        schedules: daySchedules,
        isToday,
        isPast,
        totalClasses: daySchedules.length,
        liveClasses,
        upcomingClasses,
        completedClasses,
        hasClasses: daySchedules.length > 0
      });
    }
    
    return days;
  }, [currentWeekStart, groupedByDay]);

  const maxCalendarIndex = Math.max(0, calendarDays.length - visibleDaysCount);

  // Reset calendar index when week changes to stay within bounds
  useMemo(() => {
    if (currentCalendarIndex > maxCalendarIndex) {
      setCurrentCalendarIndex(maxCalendarIndex);
    }
  }, [maxCalendarIndex, currentCalendarIndex]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "https://static.pw.live/5eb393ee95fab7468a79d189/9ef3bea0-6eed-46a8-b148-4a35dd6b3b61.png";

    event.currentTarget.onerror = (e: Event | string) => {
      const target = e instanceof Event ? (e.target as HTMLImageElement) : event.currentTarget;
      target.style.display = 'none';
      const icon = document.createElement('div');
      icon.className = 'flex items-center justify-center h-48 w-full rounded-lg bg-muted/30';
      icon.innerHTML = '<svg class="h-12 w-12 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
      target.parentNode?.replaceChild(icon, target);
    };
  };

  const handleRefresh = () => {
    refetchEnrolled();
    if (hasEnrollments) {
      refetchWeekly();
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenMaterial = async (item: ScheduleItem) => {
    if (!item.batchId || !item._id) return;

    setOpeningMaterialId(item._id);
    try {
      const subjectId = (item as any).subjectId?._id || (item as any).subjectId || (item as any).batchSubjectId || "unknown";
      const subjectName = (item as any).subjectId?.name || (item as any).subjectName || (item as any).subject || subjectId;
      
      const scheduleDetails = await fetchScheduleDetails(item.batchId, subjectId, item._id);
      
      if (!scheduleDetails) {
        toast.error("No materials found for this session.");
        return;
      }

      let url = "";
      
      if (scheduleDetails.homeworkIds && scheduleDetails.homeworkIds.length > 0) {
        const homework = scheduleDetails.homeworkIds[0];
        if (homework.attachmentIds && homework.attachmentIds.length > 0) {
          const att = homework.attachmentIds[0];
          const base = att.baseUrl || "";
          const key = att.key || "";
          if (base && key) {
            url = key.startsWith('http') ? key : `${base}${key}`;
          }
        }
      }
      
      if (!url && scheduleDetails.dppHomeworks && scheduleDetails.dppHomeworks.length > 0) {
        const dppHomework = scheduleDetails.dppHomeworks[0];
        if (dppHomework.attachmentIds && dppHomework.attachmentIds.length > 0) {
          const att = dppHomework.attachmentIds[0];
          const base = att.baseUrl || "";
          const key = att.key || "";
          if (base && key) {
            url = key.startsWith('http') ? key : `${base}${key}`;
          }
        }
      }

      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("No document found for this session.");
      }
    } catch (error) {
      toast.error("Failed to open material. Please try again.");
    } finally {
      setOpeningMaterialId(null);
    }
  };

  const handleJoinLive = async (item: ScheduleItem) => {
    if (!item.batchId) return;

    setLoadingVideoId(item._id);
    try {
      if (item.meetingUrl) {
        window.open(item.meetingUrl, "_blank");
        setLoadingVideoId(null);
        return;
      }

      const findKey = item.videoDetails?.videoDetails?.findKey || item.videoDetails?.videoDetails?._id || item.videoDetails?._id || item._id;
      const subjectId = (item as any).subjectId?._id || (item as any).subjectId || "unknown";
      const subjectName = (item as any).subjectId?.name || (item as any).subjectName || subjectId;

      if (findKey && item.batchId) {
        // Navigate to video player page with new URL format
        navigate(`/watch?piewallah=video&author=satyamrojhax&batchId=${item.batchId}&subjectId=${subjectId}&childId=${findKey}&penpencilvdo=true`);
      } else {
        toast.error("Video details not available");
      }
    } catch (error) {
      toast.error("Failed to join live session. Please try again.");
    } finally {
      setLoadingVideoId(null);
    }
  };

  const handleSetReminder = async (item: ScheduleItem) => {
    try {
      if (!("Notification" in window)) {
        toast.error("Your browser doesn't support notifications");
        return;
      }

      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notification permission denied");
          return;
        }
      }

      const lectureStartTime = new Date(item.startTime);
      const reminderTime = new Date(lectureStartTime.getTime() - 15 * 60 * 1000);
      const now = new Date();

      if (reminderTime <= now) {
        toast.error("Lecture starts soon or has already started");
        return;
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      setTimeout(() => {
        new Notification("Lecture Reminder", {
          body: `${item.topic} starts in 15 minutes at ${formatTime(item.startTime)}`,
          icon: "/favicon.ico",
          tag: item._id,
        });

        toast.success(`Reminder set for ${item.topic}`);
      }, timeUntilReminder);

      toast.success(`Reminder set for ${item.topic} - 15 minutes before start`);
    } catch (error) {
      toast.error("Failed to set reminder. Please try again.");
    }
  };

  const handleWatchRecording = async (item: ScheduleItem) => {
    if (!item.batchId) return;

    setLoadingVideoId(item._id);
    try {
      if (item.recordingUrl) {
        window.open(item.recordingUrl, "_blank");
        setLoadingVideoId(null);
        return;
      }

      const findKey = item.videoDetails?.videoDetails?.findKey || item.videoDetails?.videoDetails?._id || item.videoDetails?._id || item._id;
      const subjectId = (item as any).subjectId?._id || (item as any).subjectId || (item as any).batchSubjectId || "unknown";
      const subjectName = (item as any).subjectId?.name || (item as any).subjectName || (item as any).subject || subjectId;

      if (findKey && item.batchId) {
        // Navigate to video player page with new URL format
        navigate(`/watch?piewallah=video&author=satyamrojhax&batchId=${item.batchId}&subjectId=${subjectId}&childId=${findKey}&penpencilvdo=true`);
      } else {
        toast.error("Recording not available yet");
      }
    } catch (error) {
      toast.error("Failed to load recording. Please try again.");
    } finally {
      setLoadingVideoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pb-28 pt-8 md:pb-12">
        <div className="mb-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Weekly Schedule
              </h1>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full px-2 sm:px-3" onClick={handleRefresh}>Refresh</Button>
          </div>

          {/* Week Navigation */}
          {hasEnrollments && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 bg-card/60 rounded-2xl border border-border/60">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="rounded-full px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 text-center order-1 sm:order-2">
                <span className="text-sm sm:text-base font-medium">
                  {currentWeekStart.toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {currentWeekEnd.toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric',
                    year: currentWeekEnd.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 order-3 sm:order-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="rounded-full px-2 sm:px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Batch Toggle - Only show if user has multiple batches */}
        {hasEnrollments && enrolledBatches.length > 1 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-1 sm:gap-2 p-3 sm:p-4 bg-card/60 rounded-2xl border border-border/60">
              <Button
                variant={selectedBatchId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBatchId("all")}
                className="rounded-full text-xs sm:text-sm px-2 sm:px-3"
              >
                All ({displayedClasses.length})
              </Button>
              {enrolledBatches.map((batch) => (
                <Button
                  key={batch._id}
                  variant={selectedBatchId === batch._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBatchId(batch._id)}
                  className="rounded-full text-xs sm:text-sm px-2 sm:px-3 truncate max-w-[120px]"
                  title={batch.name || `Batch ${batch._id.slice(-6)}`}
                >
                  {batch.name || `Batch ${batch._id.slice(-6)}`}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error handling */}
        {isEnrolledError ? (
          <Card className="p-12 text-center shadow-card">
            <p className="mb-4 text-muted-foreground">{(enrolledError as Error)?.message ?? "We couldn't load your enrolled batches."}</p>
            <Button onClick={() => refetchEnrolled()} className="bg-gradient-primary hover:opacity-90">Try again</Button>
          </Card>
        ) : !hasEnrollments && !isEnrolledLoading ? (
          <Card className="p-12 text-center shadow-card">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl font-semibold text-foreground">Enroll to view schedules</h3>
            <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
              You haven't enrolled in any batches yet. Join a batch to see your weekly schedule.
            </p>
            <Link to="/batches">
              <Button size="lg" className="bg-gradient-primary px-6">Browse batches</Button>
            </Link>
          </Card>
        ) : isLoading ? (
          <Card className="p-12 text-center shadow-card">
            <div className="mx-auto mb-4">
              <DotsLoader size="lg" color="rgb(59, 130, 246)" />
            </div>
            <p className="text-muted-foreground">
              Fetching weekly schedule, please wait...
            </p>
          </Card>
        ) : isWeeklyError ? (
          <Card className="p-12 text-center shadow-card">
            <p className="mb-4 text-muted-foreground">
              {(weeklyError as Error)?.message ?? "Something went wrong while fetching weekly schedule."}
            </p>
            <Button onClick={() => refetchWeekly()} className="bg-gradient-primary hover:opacity-90">
              Try again
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Calendar Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                        {currentWeekStart.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Week {Math.ceil((currentWeekStart.getDate() + new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 0).getDate()) / 7)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek('prev')}
                      className="rounded-lg px-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const dayOfWeek = today.getDay();
                        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                        setCurrentWeekStart(new Date(today.setDate(diff)));
                      }}
                      className="rounded-lg px-2 sm:px-3 text-xs sm:text-sm"
                    >
                      <span className="hidden xs:inline">Today</span>
                      <span className="xs:hidden">Now</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek('next')}
                      className="rounded-lg px-2 sm:px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Week Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-primary">{displayedClasses.length}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-emerald-600">
                      {displayedClasses.filter(c => c.status === 'live' || c.tag === 'Live').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Live</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-amber-600">
                      {displayedClasses.filter(c => c.status === 'upcoming' || c.tag === 'Upcoming').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 bg-background/50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-slate-600">
                      {displayedClasses.filter(c => c.status === 'completed' || c.tag === 'Ended').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Enhanced Calendar Grid - Horizontal Slider */}
            <Card className="p-3 sm:p-6">
              <div className="relative">
                {/* Navigation Buttons */}
                {calendarDays.length > visibleDaysCount && (
                  <>
                    <button
                      onClick={prevCalendarSlide}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-border/50 rounded-full p-2 shadow-lg hover:bg-muted transition-colors -translate-x-1/2 sm:-translate-x-0"
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={nextCalendarSlide}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-border/50 rounded-full p-2 shadow-lg hover:bg-muted transition-colors translate-x-1/2 sm:translate-x-0"
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </>
                )}

                {/* Calendar Slider */}
                <div className="overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentCalendarIndex * (100 / visibleDaysCount)}%)` }}
                  >
                    {calendarDays.map((day, index) => (
                      <div 
                        key={index} 
                        className={`w-full flex-shrink-0 px-1 sm:px-2`}
                        style={{ width: `${100 / visibleDaysCount}%` }}
                      >
                        <div
                          className={cn(
                            "relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[120px] sm:min-h-[140px] mx-auto",
                            "hover:shadow-lg hover:scale-105",
                            day.isToday && "border-primary bg-primary/10 shadow-lg",
                            !day.isToday && day.hasClasses && "border-border/60 bg-card/80 hover:border-primary/50",
                            !day.isToday && !day.hasClasses && "border-border/30 bg-muted/20",
                            day.isPast && "opacity-60"
                          )}
                        >
                          {/* Day Header */}
                          <div className="text-center mb-2 sm:mb-3">
                            <div className={cn(
                              "text-xs font-medium mb-1",
                              day.isToday ? "text-primary" : "text-muted-foreground"
                            )}>
                              {day.dayName}
                            </div>
                            <div className={cn(
                              "text-lg sm:text-xl font-bold",
                              day.isToday ? "text-primary" : "text-foreground"
                            )}>
                              {day.date.getDate()}
                            </div>
                          </div>
                          
                          {/* Class Indicators */}
                          <div className="space-y-1">
                            {day.totalClasses > 0 ? (
                              <>
                                <div className="flex justify-center gap-1">
                                  {day.liveClasses > 0 && (
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Live classes" />
                                  )}
                                  {day.upcomingClasses > 0 && (
                                    <div className="w-2 h-2 bg-amber-500 rounded-full" title="Upcoming classes" />
                                  )}
                                  {day.completedClasses > 0 && (
                                    <div className="w-2 h-2 bg-slate-400 rounded-full" title="Completed classes" />
                                  )}
                                </div>
                                <div className="text-center">
                                  <div className="text-sm sm:text-base font-medium text-foreground">
                                    {day.totalClasses}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {day.totalClasses === 1 ? 'class' : 'classes'}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-center text-xs text-muted-foreground py-2">
                                <span className="hidden sm:inline">No classes</span>
                                <span className="sm:hidden">-</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Today Badge */}
                          {day.isToday && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-3 h-3 bg-primary rounded-full border-2 border-background" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slide Indicators */}
                {calendarDays.length > visibleDaysCount && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: Math.min(calendarDays.length - visibleDaysCount + 1, calendarDays.length) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentCalendarIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          index === currentCalendarIndex ? "bg-primary" : "bg-muted/50"
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Enhanced Detailed Schedule List */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Detailed Schedule
                </h2>
                <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
                  {displayedClasses.length} classes this week
                </div>
              </div>
              
              {Object.entries(groupedByDay).map(([dayName, schedules]) => (
                schedules.length > 0 && (
                  <Card key={dayName} className="overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 sm:px-6 py-3 sm:py-4 border-b">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          {dayName}
                        </span>
                        <Badge variant="secondary" className="bg-primary/20 text-primary">
                          {schedules.length} {schedules.length === 1 ? 'class' : 'classes'}
                        </Badge>
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {schedules.map((item) => (
                          <Card
                            key={item._id}
                            className="flex flex-col rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6 shadow-card transition-all hover:shadow-soft hover:scale-105 duration-200"
                          >
                            {item.image && (
                              <div className="relative w-full overflow-hidden rounded-lg mb-3 sm:mb-4">
                                <img
                                  src={item.image}
                                  alt={item.topic}
                                  className="w-full h-32 sm:h-48 object-cover"
                                  onError={handleImageError}
                                />
                                {item.tag === 'Live' && (
                                  <div className="absolute top-2 right-2">
                                    <Badge className="bg-emerald-500 text-white animate-pulse">
                                      <div className="w-2 h-2 bg-white rounded-full mr-1" />
                                      LIVE
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="mb-3 sm:mb-4 flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                {item.tag && item.tag !== 'Live' && (
                                  <Badge className={statusStyles[item.tag.toLowerCase() === "live" ? "live" :
                                    item.tag.toLowerCase() === "ended" ? "completed" : "upcoming"] + " text-xs"}>
                                    {item.tag}
                                  </Badge>
                                )}
                                {item.subject && (
                                  <Badge variant="outline" className="bg-background/60 ml-1 sm:ml-2 text-xs">{item.subject}</Badge>
                                )}
                                <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-1 sm:mt-2 line-clamp-2">{item.topic}</h3>
                                {item.batchName && <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">{item.batchName}</p>}
                              </div>
                              {item.platform && (
                                <Badge variant="outline" className="bg-background/60 text-muted-foreground text-xs flex-shrink-0">{item.platform}</Badge>
                              )}
                            </div>
                            
                            <div className="mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <CalendarClock className="h-3 w-3 sm:h-4 sm:w-4 text-primary/80 flex-shrink-0" />
                                <span className="truncate">{formatTime(item.startTime)}{item.endTime ? ` – ${formatTime(item.endTime)}` : ""}</span>
                                {(item.duration || item.videoDetails?.videoDetails?.duration) && (
                                  <span className="ml-auto text-xs bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                                    {item.duration || item.videoDetails?.videoDetails?.duration}
                                  </span>
                                )}
                              </div>
                              {item.teacherName && (
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary/80 flex-shrink-0" />
                                  <span className="truncate">{item.teacherName}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-auto flex flex-col gap-2">
                              {/* Show View Material button for items with homeworkIds (NOTES, DPP_QUIZ, etc.) */}
                              {item.homeworkIds && item.homeworkIds.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full min-w-0 text-xs sm:text-sm"
                                  onClick={() => handleOpenMaterial(item)}
                                  disabled={openingMaterialId === item._id}
                                >
                                  {openingMaterialId === item._id ? (
                                    <>
                                      <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" /> <span className="hidden sm:inline">Opening...</span><span className="sm:hidden">...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">View Material</span><span className="sm:hidden">Material</span>
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Show video buttons only for LECTURE type items with video content */}
                              {item.type === 'LECTURE' && (item.videoDetails?.videoDetails || item.duration || item.videoDetails?.videoDetails?.duration || item.meetingUrl || item.recordingUrl ||
                                (item.tag === "Live" && item.lectureType === "LIVE")) && (
                                  item.tag === "Live" && item.lectureType === "LIVE" ? (
                                    <Button
                                      className="w-full bg-gradient-primary min-w-0 text-xs sm:text-sm"
                                      size="sm"
                                      onClick={() => handleJoinLive(item)}
                                      disabled={loadingVideoId === item._id}
                                    >
                                      {loadingVideoId === item._id ? (
                                        <>
                                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" /> <span className="hidden sm:inline">Loading...</span><span className="sm:hidden">...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Radio className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Join Live</span><span className="sm:hidden">Live</span>
                                        </>
                                      )}
                                    </Button>
                                  ) : (item.status === "completed" || item.tag === "Ended" || item.lectureType === "RECORDED") ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full min-w-0 text-xs sm:text-sm"
                                      onClick={() => handleWatchRecording(item)}
                                      disabled={loadingVideoId === item._id}
                                    >
                                      {loadingVideoId === item._id ? (
                                        <>
                                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" /> <span className="hidden sm:inline">Loading...</span><span className="sm:hidden">...</span>
                                        </>
                                      ) : (
                                        <>
                                          <PlayCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Watch Recording</span><span className="sm:hidden">Recording</span>
                                        </>
                                      )}
                                    </Button>
                                  ) : item.tag === "Upcoming" ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full min-w-0 text-xs sm:text-sm"
                                      onClick={() => handleSetReminder(item)}
                                    >
                                      <Bell className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> <span className="hidden sm:inline">Set Reminder</span><span className="sm:hidden">Reminder</span>
                                    </Button>
                                  ) : null
                                )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklySchedule;
