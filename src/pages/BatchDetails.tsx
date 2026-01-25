import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Languages,
  GraduationCap,
  CheckCircle,
  Clock,
  Users,
  Target,
  Play,
  FileText,
  Download,
  Star,
  ChevronRight,
  Loader2,
  Info,
  AlertCircle,
  RefreshCw,
  Check,
  Share2,
  MessageSquare,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { enrollInBatch, isEnrolled, getEnrollmentCount, getRemainingEnrollments, canEnrollMore } from "@/lib/enrollmentUtils";
import { useToast } from "@/hooks/use-toast";
import { fetchBatchDetails, fetchAnnouncements } from "@/services/batchService";
import { fetchFAQs, type FAQ } from "@/services/faqService";
import type { Teacher } from "@/services/batchService";
import { CardSkeleton, ContentGridSkeleton, ListSkeleton } from "@/components/ui/skeleton-loaders";
import BackButton from "@/components/BackButton";
const IMAGE_FALLBACK = "/placeholder.svg";

type BatchSubject = {
  _id: string;
  subject: string;
  subjectDisplay?: string;
  slug?: string;
  imageId?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
  };
  lectureCount: number;
  tagCount: number;
  tags?: string[];
  teacherIds?: Teacher[];
};

type BatchDetails = {
  _id: string;
  name: string;
  batchName?: string;
  byName?: string;
  previewImage?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
  };
  language?: string;
  startDate?: string;
  endDate?: string;
  class?: string;
  description?: string;
  shortDescription?: string;
  subjects?: BatchSubject[];
  teacherIds?: Teacher[];
};

type Attachment = {
  _id: string;
  name: string;
  baseUrl: string;
  key: string;
  type: string;
  createdAt: string;
  status: string;
};

type Announcement = {
  _id: string;
  batchId: string;
  type: string;
  announcement: string;
  isSentNotification: boolean;
  isRealTime: boolean;
  createdBy: {
    createdAt: string;
    updatedAt: string;
  };
  attachment?: Attachment;
  createdAt: string;
  updatedAt?: string;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

const parseDescription = (description?: string) => {
  if (!description) return [];

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = description;

  // Try to find child-container items (structured format) - for shortDescription
  const childContainers = tempDiv.querySelectorAll('.child-container');
  if (childContainers.length > 0) {
    return Array.from(childContainers).map(container => {
      // Get the text content, preserving structure
      const textContainer = container.querySelector('.text-container');
      const textElement = container.querySelector('.text, .main-text');

      if (textContainer) {
        // Has sub-text and main-text structure
        const subText = textContainer.querySelector('.sub-text')?.textContent?.trim() || '';
        const mainText = textContainer.querySelector('.main-text')?.textContent?.trim() || '';
        return subText && mainText ? `${subText} ${mainText}` : (subText || mainText);
      } else if (textElement) {
        // Simple text element
        return textElement.textContent?.trim() || '';
      }

      // Fallback to container text
      return container.textContent?.trim() || '';
    }).filter(text => text.length > 0);
  }

  // Fallback: Try desc-row items - Extract text content from description
  const descRows = tempDiv.querySelectorAll('.desc-row');
  if (descRows.length > 0) {
    return Array.from(descRows)
      .map(row => {
        const titleElement = row.querySelector('.desc-row-item-title');
        const contentElement = row.querySelector('.desc-row-item-content');
        
        const title = titleElement?.textContent?.trim() || '';
        const content = contentElement?.textContent?.trim() || '';
        
        // Combine title and content, or just use content
        return title && content ? `${title} ${content}` : (content || title);
      })
      .filter(text => text.length > 3 && !text.match(/^\d+\.?$/))
      .map(text => text.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '').trim());
  }

  // Last resort: extract all text and split by lines
  const textContent = tempDiv.textContent || '';
  return textContent
    .split(/\n+/)
    .map(line => line.trim())
    .filter(line => line.length > 3 && !line.match(/^\d+\.?$/))
    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[•\-]\s*/, '').trim())
    .filter(line => line.length > 0);
};

const BatchDetails = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "subjects" | "announcements">("subjects");
  const [enrolled, setEnrolled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [currentTeacherIndex, setCurrentTeacherIndex] = useState(0);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const nextTeacher = () => {
    if (teachers.length > 0) {
      setCurrentTeacherIndex((prev) => (prev + 1) % teachers.length);
    }
  };

  const prevTeacher = () => {
    if (teachers.length > 0) {
      setCurrentTeacherIndex((prev) => (prev - 1 + teachers.length) % teachers.length);
    }
  };

  const { data: batchResponse, isLoading: isBatchLoading, isError: isBatchError } = useQuery<{ success: boolean, data: BatchDetails } | null>({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      if (!batchId) return null;
      return await fetchBatchDetails(batchId);
    },
    enabled: !!batchId,
  });

  const batchData = batchResponse?.data;

  // Extract teachers from all subjects
  const teachers = batchData?.subjects?.reduce((acc: Teacher[], subject) => {
    if (subject.teacherIds && subject.teacherIds.length > 0) {
      acc.push(...subject.teacherIds);
    }
    return acc;
  }, []) || [];

  // Check enrollment status on mount and when batchId changes
  useEffect(() => {
    if (batchId) {
      setEnrolled(isEnrolled(batchId));
    }
  }, [batchId]);

  const { data: announcements = [], isLoading: isAnnouncementsLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements", batchId],
    queryFn: async () => {
      return await fetchAnnouncements(batchId!);
    },
    enabled: !!batchId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  const { data: faqResponse, isLoading: isFaqsLoading } = useQuery<{ success: boolean, data: FAQ[] } | null>({
    queryKey: ["faqs"],
    queryFn: async () => {
      return await fetchFAQs();
    },
  });

  const faqs = faqResponse?.data || [];

  const handleEnroll = () => {
    if (!batchData || !batchId) return;

    const result = enrollInBatch({
      _id: batchData._id,
      name: batchData.name || batchData.batchName || 'Unknown Batch',
      previewImage: batchData.previewImage,
      language: batchData.language,
      class: batchData.class,
      startDate: batchData.startDate,
      endDate: batchData.endDate,
    });

    if (result.success) {
      setEnrolled(true);
      toast({
        title: "Successfully Enrolled!",
        description: `You've been enrolled in ${batchData.name}`,
      });
    } else {
      toast({
        title: "Enrollment Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (!batchData) return;
    const url = `${window.location.origin}/batch/${batchData._id}`;
    const text = `Check out this batch: ${batchData.name}\n`
      + (batchData.language ? `Language: ${batchData.language}\n` : '')
      + (batchData.class ? `Class: ${batchData.class}\n` : '')
      + `Dates: ${formatDate(batchData.startDate)} - ${formatDate(batchData.endDate)}\n`
      + `Link: ${url}`;

    if (navigator.share) {
      navigator.share({ title: batchData.name, text, url }).catch(() => { });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: 'Batch link copied',
          description: 'Batch details copied to clipboard',
        });
      }).catch(() => { });
    }
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = IMAGE_FALLBACK;
  };

  const getSubjectSlug = (subject: BatchSubject) => {
    if (subject.slug) {
      return subject.slug;
    }
    return subject.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  if (isBatchLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="space-y-8">
            <CardSkeleton className="h-64" />
            <div>
              <div className="h-8 w-48 bg-muted rounded mb-4"></div>
              <ContentGridSkeleton items={6} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBatchError || !batchData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-3xl p-8 text-center shadow-card">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-3 text-3xl font-bold text-foreground">Batch not found</h1>
            <p className="mb-6 text-base text-muted-foreground">
              We couldn't find the batch you're looking for. It may have been removed or the ID is incorrect.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/batches">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90">
                  View all batches
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline">
                  Back to home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const descriptionPoints = parseDescription(batchData.description);
  const shortDescriptionPoints = parseDescription(batchData.shortDescription);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <BackButton label="Back" />
        </div>

        {/* Hero Section - Only show if not enrolled */}
        {!enrolled && (
          <div className="mb-6 sm:mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background">
            <div className="grid gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
                  {batchData.language && (
                    <Badge className="bg-primary/90 text-primary-foreground text-xs">
                      <Languages className="mr-1 h-3 w-3" />
                      {batchData.language}
                    </Badge>
                  )}
                  {batchData.class && (
                    <Badge variant="outline" className="text-xs">
                      <GraduationCap className="mr-1 h-3 w-3" />
                      {batchData.class}
                    </Badge>
                  )}
                </div>
                <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{batchData.name}</h1>
                {batchData.byName && (
                  <p className="mb-3 sm:mb-4 text-base sm:text-lg text-muted-foreground">{batchData.byName}</p>
                )}
                <div className="mb-4 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    {formatDate(batchData.startDate)} - {formatDate(batchData.endDate)}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    size="lg"
                    className={enrolled ? "bg-green-600 hover:bg-green-700 shadow-lg" : "bg-gradient-primary hover:opacity-90 shadow-lg"}
                    onClick={handleEnroll}
                    disabled={enrolled || (!enrolled && !canEnrollMore())}
                  >
                    {enrolled ? (
                      <>
                        <Check className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Enrolled
                      </>
                    ) : canEnrollMore() ? (
                      <>
                        <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Enroll Now ({getRemainingEnrollments()} left)
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Enrollment Full
                      </>
                    )}
                  </Button>
                  {/* Share Batch Button */}
                  <Button
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 shadow-lg"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Share</span>
                    <span className="sm:hidden">Share</span>
                  </Button>
                  {/* Community Button */}
                  {enrolled && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/10 shadow-lg"
                      asChild
                    >
                      <Link to={`/community`}>
                        <MessageSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Community</span>
                        <span className="sm:hidden">Community</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
                <img
                  src={batchData.previewImage ? `${batchData.previewImage.baseUrl}${batchData.previewImage.key}` : IMAGE_FALLBACK}
                  alt={batchData.name}
                  className="h-full w-full object-cover"
                  onError={handleImageError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Batch Title for Enrolled Users */}
        {enrolled && (
          <div className="mb-3 sm:mb-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{batchData.name}</h1>
                {batchData.byName && (
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">{batchData.byName}</p>
                )}
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <Button
                  size="sm"
                  className="bg-gradient-primary hover:opacity-90 shadow-md flex-shrink-0"
                  onClick={handleShare}
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10 shadow-md flex-shrink-0"
                  asChild
                >
                  <Link to={`/community`}>
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-3 sm:mb-6 flex gap-1 sm:gap-1.5 overflow-x-auto">
          {/* Description Tab - Only show if not enrolled */}
          {!enrolled && (
            <button
              onClick={() => setActiveTab("description")}
              className={`px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-md sm:rounded-lg transition-all flex-shrink-0 ${activeTab === "description"
                ? "bg-gradient-primary text-primary-foreground shadow-md hover:opacity-90"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
                }`}
            >
              Description
            </button>
          )}
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-md sm:rounded-lg transition-all flex-shrink-0 ${activeTab === "subjects"
              ? "bg-gradient-primary text-primary-foreground shadow-md hover:opacity-90"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
              }`}
          >
            All classes ({batchData.subjects?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2.5 font-semibold text-xs sm:text-sm whitespace-nowrap rounded-md sm:rounded-lg transition-all flex-shrink-0 ${activeTab === "announcements"
              ? "bg-gradient-primary text-primary-foreground shadow-md hover:opacity-90"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
              }`}
          >
            Announcements ({announcements.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "description" && (
          <div className="space-y-3 sm:space-y-6">
            {/* This Batch Includes */}
            {shortDescriptionPoints.length > 0 && (
              <Card className="p-3 sm:p-4 md:p-6 shadow-card">
                <h2 className="mb-2 sm:mb-4 flex items-center gap-2 text-base sm:text-lg md:text-xl font-bold text-foreground">
                  <CheckCircle className="h-3 w-3 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  This Batch Includes
                </h2>
                <div className="space-y-1.5 sm:space-y-3">
                  {shortDescriptionPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-1.5 sm:gap-3">
                      <div className="flex h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span
                        className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: point }}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Know Your Teachers Section */}
            {teachers && teachers.length > 0 && (
              <Card className="p-3 sm:p-4 md:p-6 shadow-card">
                <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  Know Your Teachers
                </h2>
                
                <div className="relative">
                  {/* Navigation Buttons */}
                  {teachers.length > 1 && (
                    <>
                      <button
                        onClick={prevTeacher}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-border/50 rounded-full p-2 shadow-lg hover:bg-muted transition-colors -translate-x-1/2 sm:-translate-x-0"
                        aria-label="Previous teacher"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={nextTeacher}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-border/50 rounded-full p-2 shadow-lg hover:bg-muted transition-colors translate-x-1/2 sm:translate-x-0"
                        aria-label="Next teacher"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </>
                  )}

                  {/* Teacher Slider */}
                  <div className="overflow-hidden">
                    <div 
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${currentTeacherIndex * 100}%)` }}
                    >
                      {teachers.map((teacher) => (
                        <div key={teacher._id} className="w-full flex-shrink-0 px-8 sm:px-12">
                          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6">
                            <div className="relative">
                              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                                {teacher.imageId ? (
                                  <img
                                    src={`${teacher.imageId.baseUrl}${teacher.imageId.key}`}
                                    alt={`${teacher.firstName} ${teacher.lastName}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      // Fallback to initials
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-2xl sm:text-3xl font-bold';
                                      fallback.textContent = `${teacher.firstName[0]}${teacher.lastName[0]}`;
                                      target.parentNode?.replaceChild(fallback, target);
                                    }}
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-2xl sm:text-3xl font-bold">
                                    {teacher.firstName[0]}{teacher.lastName[0]}
                                  </div>
                                )}
                              </div>
                              {teacher.experience && (
                                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  {teacher.experience}+ years
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3 max-w-md">
                              <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                                {teacher.firstName} {teacher.lastName}
                              </h3>
                              {teacher.subject && (
                                <p className="text-base sm:text-lg text-primary font-medium">{teacher.subject}</p>
                              )}
                              {teacher.qualification && (
                                <p className="text-sm sm:text-base text-muted-foreground">
                                  {teacher.qualification}
                                </p>
                              )}
                              {teacher.featuredLine && (
                                <p className="text-sm sm:text-base text-muted-foreground italic">
                                  "{teacher.featuredLine}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Indicators */}
                  {teachers.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4 sm:mt-6">
                      {teachers.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentTeacherIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentTeacherIndex
                              ? 'bg-primary w-6'
                              : 'bg-muted hover:bg-muted/70 w-2'
                          }`}
                          aria-label={`Go to teacher ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Description Section */}
            {descriptionPoints.length > 0 && (
              <Card className="p-3 sm:p-4 md:p-6 shadow-card">
                <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  Description
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {descriptionPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2 sm:gap-3">
                      <div className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <span
                        className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed"
                      >
                        {point}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* FAQs Section */}
            <Card className="p-3 sm:p-4 md:p-6 shadow-card">
              <h2 className="mb-3 sm:mb-4 flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                FAQs
              </h2>
              {isFaqsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin text-primary mr-3" />
                  <p className="text-sm text-muted-foreground">Loading FAQs...</p>
                </div>
              ) : faqs.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq._id} className="border border-border/50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFaq(faq._id)}
                        className="w-full px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm sm:text-base font-medium text-foreground pr-4">
                          {faq.title}
                        </span>
                        <div className={`flex-shrink-0 transition-transform duration-200 ${expandedFaq === faq._id ? 'rotate-180' : ''}`}>
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                      </button>
                      {expandedFaq === faq._id && (
                        <div className="px-4 pb-3 sm:px-6 sm:pb-4 border-t border-border/50">
                          <div 
                            className="text-xs sm:text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none pt-3"
                            dangerouslySetInnerHTML={{ __html: faq.description }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No FAQs available at the moment.</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "subjects" && (
          <div className="space-y-3 sm:space-y-6">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">All classes</h2>
            {batchData.subjects && batchData.subjects.length > 0 ? (
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {batchData.subjects.map((subject, index) => (
                  <Link
                    key={index}
                    to={`/batch/${batchData._id}/subject/${getSubjectSlug(subject)}/topics`}
                    state={{
                      subjectName: subject.subjectDisplay || subject.subject,
                      batchName: batchData.name,
                      subjectId: subject._id,
                    }}
                    className="block"
                  >
                    <Card className="group flex items-center gap-2 sm:gap-4 rounded-xl sm:rounded-2xl border border-border/60 p-2 sm:p-4 shadow-card transition-all hover:-translate-y-1 hover:shadow-soft">
                      <div className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10">
                        {subject.imageId ? (
                          <img
                            src={`${subject.imageId.baseUrl}${subject.imageId.key}`}
                            alt={subject.subjectDisplay || subject.subject}
                            className="h-6 w-6 sm:h-12 sm:w-12 object-contain"
                            onError={handleImageError}
                          />
                        ) : (
                          <img
                            src="https://static.pw.live/react-batches/assets/images/logo.png"
                            alt={subject.subjectDisplay || subject.subject}
                            className="h-6 w-6 sm:h-10 sm:w-10 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Final fallback to icon if logo fails
                              const icon = document.createElement('div');
                              icon.className = 'flex items-center justify-center';
                              icon.innerHTML = '<svg class="h-5 w-5 sm:h-8 sm:w-8 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
                              target.parentNode?.replaceChild(icon, target);
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-1 text-xs sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {subject.subjectDisplay || subject.subject}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <PlayCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {subject.lectureCount} Chapters
                          </span>
                        </div>
                        {subject.tags && subject.tags.length > 0 && (
                          <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-2">
                            {subject.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-muted text-muted-foreground text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {subject.tags.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{subject.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-12 text-center shadow-card">
                <CheckCircle className="mx-auto mb-2 sm:mb-4 h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                <p className="text-xs sm:text-base text-muted-foreground">No subjects available yet</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="space-y-3 sm:space-y-6">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground">Announcements</h2>
            {isAnnouncementsLoading ? (
              <Card className="p-6 sm:p-12 text-center shadow-card">
                <Clock className="mx-auto mb-2 sm:mb-4 h-6 w-6 sm:h-10 sm:w-10 animate-spin text-primary" />
                <p className="text-xs sm:text-base text-muted-foreground">Loading announcements...</p>
              </Card>
            ) : announcements.length > 0 ? (
              <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {announcements.map((announcement) => (
                  <Card key={announcement._id} className="overflow-hidden shadow-card hover:shadow-lg transition-shadow">
                    {/* PW TEAM Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-2 sm:px-3 md:px-4 py-1.5 sm:py-3 md:py-4 border-b">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-1">
                          <img
                            src="https://static.pw.live/react-batches/assets/images/logo.png"
                            alt="PW Logo"
                            className="h-4 w-auto sm:h-6 md:h-8 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Fallback to text logo if image fails
                              const fallback = document.createElement('div');
                              fallback.className = 'h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0';
                              fallback.innerHTML = '<span class="text-primary-foreground font-bold text-xs sm:text-sm">PW</span>';
                              target.parentNode?.replaceChild(fallback, target);
                            }}
                          />
                          <span className="font-semibold text-primary text-xs sm:text-sm md:text-base truncate">PW TEAM</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(announcement.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Announcement Content */}
                    <div className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-1.5 sm:space-y-3 md:space-y-4">
                      {/* Message */}
                      {announcement.announcement && (
                        <div className="prose max-w-none text-muted-foreground">
                          <div
                            className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words [&>a]:text-primary [&>a]:underline hover:[&>a]:text-primary/80 [&>a]:break-all"
                            dangerouslySetInnerHTML={{
                              __html: announcement.announcement.replace(
                                /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
                                (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
                              )
                            }}
                          />
                        </div>
                      )}

                      {/* Image Attachment - Clickable for large view */}
                      {announcement.attachment && announcement.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <div className="mt-1.5 sm:mt-4">
                          <div 
                            className="cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(`${announcement.attachment.baseUrl}${announcement.attachment.key}`)}
                          >
                            <img
                              src={`${announcement.attachment.baseUrl}${announcement.attachment.key}`}
                              alt={announcement.attachment.name}
                              className="w-full h-auto max-h-48 sm:max-h-80 md:max-h-96 object-contain rounded-lg border bg-white"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'block';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* File Attachment - Download link */}
                      {announcement.attachment && !announcement.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                        <div className="mt-1.5 sm:mt-4">
                          <a
                            href={`${announcement.attachment.baseUrl}${announcement.attachment.key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-3 sm:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs sm:text-sm"
                          >
                            <Download className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                            <span className="font-medium">{announcement.attachment.name}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 sm:p-12 text-center shadow-card">
                <AlertCircle className="mx-auto mb-2 sm:mb-4 h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                <p className="text-xs sm:text-base text-muted-foreground">No announcements yet</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Image Modal for Large View */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={selectedImage} 
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-white/30 transition-colors"
              onClick={closeImageModal}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;
