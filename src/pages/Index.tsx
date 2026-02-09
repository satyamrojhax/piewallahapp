import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Book, Users, Video, Award, Radio, Bot, FileText, User } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { getStoredUserData } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl, safeFetch } from "@/lib/apiConfig";
import { getCommonHeaders } from "@/lib/auth";
import { getEnrolledBatches } from "@/lib/enrollmentUtils";
import { useState, useEffect } from "react";
import { fetchBatchDetails, fetchAnnouncements } from "@/services/batchService";
import { fetchScheduleDetails } from "@/services/contentService";
import { BatchesIcon } from "@/components/icons/CustomIcons";
import "@/config/firebase";

const features = [
  {
    icon: Book,
    title: "Quality Content",
    description: "Learn from expertly crafted courses and materials designed for excellence",
  },
  {
    icon: Video,
    title: "HD Video Lectures",
    description: "Crystal-clear video lectures accessible anytime, anywhere",
  },
  {
    icon: Users,
    title: "Expert Educators",
    description: "Learn from India's most experienced and qualified teachers",
  },
  {
    icon: Award,
    title: "Structured Path",
    description: "Follow a carefully designed curriculum for optimal learning",
  },
];

// Type for schedule items
type ScheduleItem = {
  _id: string;
  topic: string;
  subject?: string;
  subjectId?: string;
  subjectName?: string;
  batchId: string;
  batchName?: string;
  teacherName?: string;
  teacherId?: string;
  teacherImage?: string;
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
  videoDetails?: any;
  homeworkIds?: Array<{
    _id: string;
    topic: string;
    note: string;
    attachmentIds?: Array<{
      _id: string;
      baseUrl: string;
      key: string;
      name: string;
    }>;
    actions?: string[];
  }>;
};

type EnrolledBatch = {
  _id: string;
  name?: string;
};

// Fetch today's schedule from all enrolled batches
const fetchTodaysSchedule = async (batchIds: string[]): Promise<ScheduleItem[]> => {
  if (batchIds.length === 0) return [];
  
  const authToken = localStorage.getItem("param_auth_token");
  if (!authToken) {
    return [];
  }

  try {
    const schedules = await Promise.all(
      batchIds.map(async (batchId) => {
        try {
          const url = getApiUrl(`/v1/batches/${batchId}/todays-schedule`, {
            isNewStudyMaterialFlow: 'true'
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
            return [];
          }
          
          const data = await response.json();
          const items = data.data || data.schedule || [];
          
          return items.map((item: any) => ({
            ...item,
            batchId,
            topic: item.topic || item.videoDetails?.topic || 'Untitled',
            teacherName: item.teacherName || item.videoDetails?.teachers?.[0] || 'Teacher',
            teacherId: item.teacherId || item.videoDetails?.teacherIds?.[0]?._id || item.videoDetails?.teachers?.[0]?._id,
            startTime: item.startTime || item.videoDetails?.startTime,
            endTime: item.endTime || item.videoDetails?.endTime,
            status: item.status || item.tag || 'upcoming',
            image: item.videoDetails?.image || item.image,
            meetingUrl: item.meetingUrl || item.videoDetails?.url,
          }));
        } catch (error) {
          return [];
        }
      })
    );
    return schedules.flat();
  } catch (error) {
    return [];
  }
};

// Fetch teacher details by ID
const fetchTeacherDetails = async (teacherId: string): Promise<any> => {
  const authToken = localStorage.getItem("param_auth_token");
  if (!authToken || !teacherId) {
    return null;
  }

  try {
    const response = await safeFetch(`https://api.penpencil.co/v3/users/${teacherId}`, {
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
      return null;
    }
    
    return await response.json();
  } catch (error) {
    return null;
  }
};

// Fetch batch details to get teacher information
const fetchBatchDetailsForTeachers = async (batchId: string): Promise<any> => {
  const authToken = localStorage.getItem("param_auth_token");
  if (!authToken || !batchId) {
    return null;
  }

  try {
    const response = await safeFetch(`https://api.penpencil.co/v3/batches/${batchId}/details?type=EXPLORE_LEAD`, {
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
      return null;
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    return null;
  }
};

// Optimized teacher cache to reduce API calls
const teacherCache = new Map<string, any>();
const batchDetailsCache = new Map<string, any>();
const scheduleDetailsCache = new Map<string, any>();

// Optimized fetch with caching
const fetchTeacherDetailsOptimized = async (teacherId: string) => {
  if (teacherCache.has(teacherId)) {
    return teacherCache.get(teacherId);
  }
  
  const teacherDetails = await fetchTeacherDetails(teacherId);
  const data = teacherDetails?.data;
  
  if (data) {
    teacherCache.set(teacherId, data);
  }
  
  return data;
};

// Optimized batch details with caching
const fetchBatchDetailsOptimized = async (batchId: string) => {
  if (batchDetailsCache.has(batchId)) {
    return batchDetailsCache.get(batchId);
  }
  
  const batchDetails = await fetchBatchDetailsForTeachers(batchId);
  if (batchDetails) {
    batchDetailsCache.set(batchId, batchDetails);
  }
  
  return batchDetails;
};

// Optimized schedule details with caching
const fetchScheduleDetailsOptimized = async (batchId: string, subjectName: string, scheduleId: string) => {
  const cacheKey = `${batchId}-${subjectName}-${scheduleId}`;
  if (scheduleDetailsCache.has(cacheKey)) {
    return scheduleDetailsCache.get(cacheKey);
  }
  
  const details = await fetchScheduleDetails(batchId, subjectName, scheduleId);
  if (details) {
    scheduleDetailsCache.set(cacheKey, details);
  }
  
  return details;
};

const fetchEnrolledBatches = async (): Promise<EnrolledBatch[]> => {
  return getEnrolledBatches();
};

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getTimeUntilLive = (startTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  const diff = start.getTime() - now.getTime();
  
  if (diff <= 0) return "Starting soon";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  } else {
    return `Starts in ${minutes}m`;
  }
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

// Material Access Button Component - Lazy loads schedule details only on click
const MaterialAccessButton: React.FC<{
  batchId: string;
  subjectName: string;
  scheduleId: string;
  homeworkItem: any;
}> = ({ batchId, subjectName, scheduleId, homeworkItem }) => {
  const [scheduleDetails, setScheduleDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const handleMaterialClick = async () => {
    // Only fetch if not already fetched
    if (!hasFetched && !scheduleDetails) {
      setLoading(true);
      try {
        const details = await fetchScheduleDetailsOptimized(batchId, subjectName, scheduleId);
        setScheduleDetails(details);
        setHasFetched(true);
        
        // Open the material after fetching details
        if (details?.homeworkIds && details.homeworkIds.length > 0) {
          const homework = details.homeworkIds[0];
          if (homework.attachmentIds && homework.attachmentIds.length > 0) {
            const att = homework.attachmentIds[0];
            const base = att.baseUrl || "";
            const key = att.key || "";
            
            if (base && key) {
              const url = key.startsWith('http') ? key : `${base}${key}`;
              window.open(url, '_blank');
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch schedule details:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Don't render button until we know if there are attachments
  if (!hasFetched) {
    return (
      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleMaterialClick}
          disabled={loading}
        >
          <FileText className="mr-1 h-3 w-3 flex-shrink-0" />
          <span className="hidden sm:inline">View Material</span><span className="sm:hidden">Material</span>
        </Button>
      </div>
    );
  }

  // After fetching, show button if attachments exist
  if (!scheduleDetails || !scheduleDetails.homeworkIds || scheduleDetails.homeworkIds.length === 0) {
    return null;
  }

  const homework = scheduleDetails.homeworkIds[0];
  if (!homework.attachmentIds || homework.attachmentIds.length === 0) {
    return null;
  }

  const att = homework.attachmentIds[0];
  const base = att.baseUrl || "";
  const key = att.key || "";

  if (!base && !key) {
    return null;
  }

  const url = key.startsWith('http') ? key : `${base}${key}`;

  return (
    <div className="mb-3">
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => window.open(url, '_blank')}
      >
        <FileText className="mr-1 h-3 w-3 flex-shrink-0" />
        <span className="hidden sm:inline">View Material</span><span className="sm:hidden">Material</span>
      </Button>
    </div>
  );
};

// Auto-updating Time Until Live Component
const TimeUntilLive: React.FC<{ startTime: string }> = ({ startTime }) => {
  const [timeUntil, setTimeUntil] = useState(getTimeUntilLive(startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntil(getTimeUntilLive(startTime));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-orange-500 font-medium">
      {timeUntil}
    </div>
  );
};

const Index = () => {
  const [userName, setUserName] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");

  // Get user data
  useEffect(() => {
    const userData = getStoredUserData();
    if (userData) {
      const name = userData.firstName || userData.name || userData.username || "Student";
      setUserName(name);
      // Get user photo if available
      if (userData.imageId) {
        const photoUrl = userData.imageId.baseUrl && userData.imageId.key 
          ? `${userData.imageId.baseUrl}${userData.imageId.key}`
          : userData.imageId;
        setUserPhoto(photoUrl);
      } else if (userData.photo) {
        setUserPhoto(userData.photo);
      } else if (userData.profileImage) {
        setUserPhoto(userData.profileImage);
      }
    }
  }, []);

  // Enrolled batches
  const {
    data: enrolledBatches = [],
    isLoading: isEnrolledLoading,
  } = useQuery<EnrolledBatch[]>({
    queryKey: ["enrolled-batches"],
    queryFn: fetchEnrolledBatches,
    staleTime: 1000 * 60 * 30, // Increased to 30 minutes to reduce API calls
    gcTime: 1000 * 60 * 60, // Keep in memory for 1 hour
  });

  const enrolledBatchIds = enrolledBatches.map((b) => b._id).filter(Boolean);
  const hasEnrollments = enrolledBatchIds.length > 0;
  
  // If user has multiple batches, only use the first one for today's schedule
  const primaryBatchId = enrolledBatchIds.length > 0 ? [enrolledBatchIds[0]] : enrolledBatchIds;

  // Today's schedule with teacher details
  const {
    data: scheduleItems = [],
    isLoading: isScheduleLoading,
    refetch: refetchSchedule,
  } = useQuery<ScheduleItem[]>({
    queryKey: ["todays-schedule", primaryBatchId, "with-teachers"],
    queryFn: async () => {
      const schedules = await fetchTodaysSchedule(primaryBatchId);
      
      // Fetch batch details to get teacher information (optimized with cache)
      const batchDetailsMap = new Map();
      await Promise.all(
        primaryBatchId.map(async (batchId) => {
          const batchDetails = await fetchBatchDetailsOptimized(batchId);
          
          if (batchDetails && batchDetails.subjects) {
            // Create a teacher lookup map for this batch
            const teacherMap = new Map();
            batchDetails.subjects.forEach((subject: any) => {
              if (subject.teacherIds && subject.teacherIds.length > 0) {
                subject.teacherIds.forEach((teacher: any) => {
                  teacherMap.set(teacher._id, teacher);
                });
              }
            });
            batchDetailsMap.set(batchId, teacherMap);
          }
        })
      );
      
      // Fetch teacher details for each schedule item (optimized with cache)
      const scheduleWithTeachers = await Promise.all(
        schedules.map(async (item) => {
          let teacherInfo = null;
          
          // Always try to get teacher from batch details (even if no teacherId)
          if (item.batchId && batchDetailsMap.has(item.batchId)) {
            const teacherMap = batchDetailsMap.get(item.batchId);
            
            // If we have a teacherId, try to find the specific teacher
            if (item.teacherId) {
              teacherInfo = teacherMap.get(item.teacherId);
            }
            
            // If no specific teacher found, use the first teacher from the batch
            if (!teacherInfo) {
              const firstTeacher = teacherMap.values().next().value;
              if (firstTeacher) {
                teacherInfo = firstTeacher;
              }
            }
          }
          
          // If still no teacher info, try direct API call (optimized)
          if (!teacherInfo && item.teacherId) {
            const teacherDetails = await fetchTeacherDetailsOptimized(item.teacherId);
            teacherInfo = teacherDetails?.data;
          }
          
          return {
            ...item,
            teacherImage: teacherInfo?.imageId?.baseUrl && teacherInfo?.imageId?.key
              ? `${teacherInfo.imageId.baseUrl}${teacherInfo.imageId.key}`
              : teacherInfo?.photo || teacherInfo?.profileImage,
            teacherName: teacherInfo?.firstName && teacherInfo?.lastName
              ? `${teacherInfo.firstName} ${teacherInfo.lastName}`
              : item.teacherName || teacherInfo?.firstName || 'Teacher'
          };
        })
      );
      
      return scheduleWithTeachers;
    },
    enabled: hasEnrollments,
    staleTime: 1000 * 60 * 5, // 5 minutes cache for schedule
    gcTime: 1000 * 60 * 15, // Keep in memory for 15 minutes
    refetchOnWindowFocus: false, // Disabled for 20K users to reduce load
    refetchOnReconnect: true, // Keep on reconnect
  });

  // Ensure each item has a status and normalize it
  const itemsWithStatus = scheduleItems.map((item) => ({
    ...item,
    status: normalizeStatus(item.status) || getStatus(item.startTime, item.endTime),
  }));

  // Get live classes
  const liveClasses = itemsWithStatus.filter((item) => item.status === "live");
  const upcomingClasses = itemsWithStatus.filter((item) => item.status === "upcoming");
  const todayClasses = [...liveClasses, ...upcomingClasses].slice(0, 6);

  const handleJoinLive = async (item: ScheduleItem) => {
    if (!item.batchId) return;

    try {
      // First try to use existing meetingUrl
      if (item.meetingUrl) {
        window.open(item.meetingUrl, "_blank");
        return;
      }

      // Try to get video details and navigate to player
      const findKey = item.videoDetails?.findKey || item.videoDetails?._id || item._id;
      const subjectId = (item as any).subjectId?._id || (item as any).subjectId || "unknown";

      if (findKey && item.batchId) {
        // Navigate to video player page with new URL format
        window.location.href = `/watch?piewallah=video&author=satyamrojhax&batchId=${item.batchId}&subjectId=${subjectId}&childId=${findKey}&penpencilvdo=true`;
      }
    } catch (error) {
      console.error("Failed to join live session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 page-transition">
      <Navbar />

      {/* Desktop View - Keep Original */}
      <div className="hidden md:block">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-8 text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl slideInFromBottom">
                Welcome to
                <br />
                <span className="text-gradient">Pie Wallah</span>
              </h1>
              <p className="mb-12 text-xl text-muted-foreground md:text-2xl leading-relaxed max-w-2xl mx-auto slideInFromBottom" style={{ animationDelay: '200ms' }}>
                Your journey to academic excellence begins here. Learn from the best educators and achieve your goals.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center slideInFromBottom" style={{ animationDelay: '400ms' }}>
                <Link to="/batches">
                  <Button size="lg" className="bg-foreground text-background hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 px-8 py-4 text-base btn-smooth hover-lift group">
                    Explore Batches
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/my-batches">
                  <Button size="lg" variant="outline" className="border-border hover:bg-muted/50 transition-all duration-300 px-8 py-4 text-base btn-smooth hover-lift">
                    My Batches
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-semibold tracking-tight text-foreground slideInFromBottom">Why Choose Pie Wallah?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto slideInFromBottom" style={{ animationDelay: '200ms' }}>
                Everything you need to excel academically, all in one place
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="p-8 border-border/50 bg-card shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 group card-hover slideInFromBottom" 
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-muted transition-colors duration-300 group-hover:scale-110">
                    <feature.icon className="h-7 w-7 text-foreground transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed transition-colors duration-300">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-4xl font-semibold tracking-tight text-foreground slideInFromBottom">
                Ready to Transform Your Learning?
              </h2>
              <p className="mb-12 text-lg text-muted-foreground slideInFromBottom" style={{ animationDelay: '200ms' }}>
                Join thousands of students who are already excelling with our platform
              </p>
              <Link to="/batches">
                <Button size="lg" className="bg-foreground text-background hover:bg-primary-hover shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 px-10 py-4 text-base btn-smooth hover-lift slideInFromBottom" style={{ animationDelay: '400ms' }}>
                  Browse All Courses
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile View - New Design */}
      <div className="md:hidden">
        {/* Header Section */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                Hello, {userName} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Let's continue your learning journey
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link to="/profile" className="ml-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <User className={`h-6 w-6 text-primary ${userPhoto ? 'hidden' : ''}`} />
              </div>
            </Link>
          </div>
        </div>

        {/* Today's Classes Section */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Today's Classes</h2>
            <Link to="/study">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 p-0 h-auto">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isScheduleLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 border-border/60 bg-card/80">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted/50 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-16 bg-muted/50 rounded animate-pulse" />
                        <div className="h-6 w-6 bg-muted/50 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : todayClasses.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
            </Card>
          ) : !hasEnrollments ? (
            <Card className="p-6 text-center">
              <Book className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Enroll in batches to see your classes</p>
              <Link to="/batches" className="mt-3 inline-block">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Browse Batches
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {todayClasses.map((item) => (
                <Card
                  key={item._id}
                  className="flex-shrink-0 w-64 p-4 border-border/60 bg-card/80 shadow-sm hover:shadow-md transition-all"
                >
                  {((item.tag === "Live" && item.lectureType === "LIVE") || item.status === "live") && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-medium text-red-500">LIVE</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center mb-4">
                    {item.teacherImage ? (
                      <img
                        src={item.teacherImage}
                        alt={item.teacherName || 'Teacher'}
                        className="w-20 h-20 rounded-full object-cover border-3 border-primary/20 shadow-lg mb-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center ${item.teacherImage ? 'hidden' : ''} border-3 border-primary/20 shadow-lg mb-2`}>
                      <User className="h-10 w-10 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
                        {item.topic || 'Untitled Class'}
                      </h3>
                      <div className="text-xs text-muted-foreground font-medium">
                        {item.teacherName || 'Teacher'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {item.status === "upcoming" ? (
                      <div>
                        <TimeUntilLive startTime={item.startTime} />
                        <div className="text-muted-foreground">
                          {formatTime(item.startTime)}
                          {item.endTime && ` - ${formatTime(item.endTime)}`}
                        </div>
                      </div>
                    ) : (
                      <>
                        {formatTime(item.startTime)}
                        {item.endTime && ` - ${formatTime(item.endTime)}`}
                      </>
                    )}
                  </div>
                  
                  {/* Material Access */}
                  {(() => {
                    if (!item.homeworkIds || item.homeworkIds.length === 0) return null;
                    
                    const homeworkItem = item.homeworkIds[0];
                    const subjectId = (item as any).subjectId?._id || (item as any).subjectId || (item as any).batchSubjectId || "unknown";
                    const subjectName = (item as any).subjectId?.name || (item as any).subjectName || subjectId;
                    
                    return (
                      <MaterialAccessButton 
                        batchId={item.batchId!}
                        subjectName={subjectName}
                        scheduleId={item._id}
                        homeworkItem={homeworkItem}
                      />
                    );
                  })()}
                  
                  {/* Show Join Live button for LIVE lectures that are currently live or tagged as Live */}
                  {((item.tag === "Live" && item.lectureType === "LIVE") || item.status === "live") && (
                    <Button
                      size="sm"
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handleJoinLive(item)}
                    >
                      Join Now
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/batches">
              <Card className="p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group">
                <BatchesIcon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">Batches</span>
              </Card>
            </Link>
            <Link to="/study">
              <Card className="p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group">
                <Radio className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">Live</span>
              </Card>
            </Link>
            <Link to="/ai-guru">
              <Card className="p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group">
                <Bot className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">AI Guru</span>
              </Card>
            </Link>
            <Link to="/pdf-bank">
              <Card className="p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all cursor-pointer group">
                <FileText className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">PDF Bank</span>
              </Card>
            </Link>
          </div>
        </div>

        {/* Motivation Section */}
        <div className="px-4 py-6 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <p className="text-lg font-semibold text-foreground mb-2">
              Padhlo Chahe Kahi Se, Selection Hoga Yahi Se...
            </p>
            <p className="text-xs text-muted-foreground">
            ❤️ From Pie Wallah
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
