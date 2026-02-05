import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, Calendar, Languages, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { getEnrolledBatches, unenrollFromBatch, type EnrolledBatch, getEnrollmentCount, MAX_ENROLLMENTS } from "@/lib/enrollmentUtils";
import { useToast } from "@/hooks/use-toast";
import DotsLoader from "@/components/ui/DotsLoader";

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MyBatches = () => {
  const [enrolledBatches, setEnrolledBatches] = useState<EnrolledBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load enrolled batches from localStorage
    const loadBatches = async () => {
      try {
        setIsLoading(true);
        const batches = await getEnrolledBatches();
        setEnrolledBatches(batches);
      } catch (error) {
        // Failed to load enrolled batches
        setEnrolledBatches([]);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };
    
    loadBatches();
  }, []);

  // Handle initial load state timing (same as Community)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUnenroll = async (batchId: string, batchName: string) => {
    try {
      setIsLoading(true);
      const success = await unenrollFromBatch(batchId);
      if (success) {
        const batches = await getEnrolledBatches();
        setEnrolledBatches(batches);
        toast({
          title: "Unenrolled Successfully",
          description: `You've been unenrolled from ${batchName}`,
        });
      } else {
        toast({
          title: "Unenroll Failed",
          description: `Failed to unenroll from ${batchName}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unenroll Failed",
        description: `An error occurred while unenrolling from ${batchName}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">My Batches</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
            <p className="text-sm sm:text-base">
              {enrolledBatches.length > 0
                ? `You're enrolled in ${enrolledBatches.length} ${enrolledBatches.length === 1 ? "batch" : "batches"}`
                : "Access your enrolled courses"}
            </p>
            {enrolledBatches.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {enrolledBatches.length}/{MAX_ENROLLMENTS} slots used
              </Badge>
            )}
          </div>
        </div>

        {isInitialLoad ? (
          /* Loading State - Same as Community */
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6">
                <DotsLoader size="lg" color="rgb(59, 130, 246)" />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground">Loading...</h1>
              <p className="mb-6 text-muted-foreground">
                Please wait...
              </p>
            </div>
          </div>
        ) : enrolledBatches.length === 0 ? (
          /* Empty State */
          <Card className="p-8 sm:p-12 text-center shadow-card">
            <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary-light">
              <Book className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg sm:text-xl font-semibold text-foreground">
              No batches enrolled yet
            </h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground">
              Explore our courses and start your learning journey
            </p>
            <Link to="/batches">
              <Button className="bg-gradient-primary hover:opacity-90">
                Browse Batches
              </Button>
            </Link>
          </Card>
        ) : (
          /* Enrolled Batches Grid */
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledBatches.map((batch) => (
              <Card
                key={batch._id}
                className="group overflow-hidden shadow-card transition-all hover:shadow-soft hover:-translate-y-1"
              >
                {/* Batch Image */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                  {batch.previewImage ? (
                    <img
                      src={`${batch.previewImage.baseUrl}${batch.previewImage.key}`}
                      alt={batch.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Book className="h-12 w-12 sm:h-16 sm:w-16 text-primary/30" />
                    </div>
                  )}
                </div>

                {/* Batch Info */}
                <div className="p-3 sm:p-4">
                  <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                    {batch.language && (
                      <Badge variant="secondary" className="text-xs">
                        <Languages className="mr-1 h-3 w-3" />
                        {batch.language}
                      </Badge>
                    )}
                    {batch.class && (
                      <Badge variant="outline" className="text-xs">
                        <Book className="mr-1 h-3 w-3" />
                        Class {batch.class}
                      </Badge>
                    )}
                  </div>

                  <h3 className="mb-2 text-base sm:text-lg font-bold text-foreground line-clamp-2">
                    {batch.name}
                  </h3>

                  {(batch.startDate || batch.endDate) && (
                    <div className="mb-2 sm:mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                      </span>
                    </div>
                  )}

                  <p className="mb-3 sm:mb-4 text-xs text-muted-foreground">
                    Enrolled on {formatDate(batch.enrolledAt)}
                  </p>

                  <div className="flex gap-2">
                    <Link to={`/batch/${batch._id}`} className="flex-1">
                      <Button className="w-full bg-gradient-primary hover:opacity-90 text-xs sm:text-sm" size="sm">
                        Continue Learning
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnenroll(batch._id, batch.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      title="Unenroll from batch"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBatches;
