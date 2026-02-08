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
import { BatchesIcon } from "@/components/icons/CustomIcons";

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
    staleTime: 1000 * 60 * 5,
  });

  const enrolledBatchIds = enrolledBatches.map((b) => b._id).filter(Boolean);
  const hasEnrollments = enrolledBatchIds.length > 0;

  // Today's schedule with teacher details
  const {
    data: scheduleItems = [],
    isLoading: isScheduleLoading,
    refetch: refetchSchedule,
  } = useQuery<ScheduleItem[]>({
    queryKey: ["todays-schedule", enrolledBatchIds, "with-teachers"],
    queryFn: async () => {
      const schedules = await fetchTodaysSchedule(enrolledBatchIds);
      
      // Fetch batch details to get teacher information
      const batchDetailsMap = new Map();
      await Promise.all(
        enrolledBatchIds.map(async (batchId) => {
          const batchDetails = await fetchBatchDetailsForTeachers(batchId);
          
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
      
      // Fetch teacher details for each schedule item
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
          
          // If still no teacher info, try direct API call
          if (!teacherInfo && item.teacherId) {
            const teacherDetails = await fetchTeacherDetails(item.teacherId);
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
    staleTime: 1000 * 60 * 2, // Reduced to 2 minutes for more frequent updates
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  // Ensure each item has a status and normalize it
  const itemsWithStatus = scheduleItems.map((item) => ({
    ...item,
    status: normalizeStatus(item.status) || getStatus(item.startTime, item.endTime),
  }));

  // Get live classes
  const liveClasses = itemsWithStatus.filter((item) => item.status === "live");
  const upcomingClasses = itemsWithStatus.filter((item) => item.status === "upcoming");
  const todayClasses = [...liveClasses, ...upcomingClasses].slice(0, 3);

  const handleJoinLive = (item: ScheduleItem) => {
    if (item.meetingUrl) {
      window.open(item.meetingUrl, "_blank");
    } else {
      const findKey = item.videoDetails?.findKey || item.videoDetails?._id || item._id;
      const subjectId = (item as any).subjectId?._id || (item as any).subjectId || "unknown";
      if (findKey && item.batchId) {
        window.location.href = `/watch?piewallah=video&author=satyamrojhax&batchId=${item.batchId}&subjectId=${subjectId}&childId=${findKey}&penpencilvdo=true`;
      }
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Hello, {userName} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Let's continue your learning journey
              </p>
            </div>
            <Link to="/profile">
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
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                  {item.status === "live" && (
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
                        {item.topic}
                      </h3>
                      <div className="text-xs text-muted-foreground font-medium">
                        {item.teacherName || 'Teacher'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    {formatTime(item.startTime)}
                    {item.endTime && ` - ${formatTime(item.endTime)}`}
                  </div>
                  {item.status === "live" && (
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
