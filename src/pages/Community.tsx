import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Users, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { fetchBatchDetails } from "@/services/batchService";
import { getEnrolledBatches } from "@/lib/enrollmentUtils";
import { useAuth } from "@/contexts/AuthContext";
import CommunitySection from "@/components/community/CommunitySection";

const Community = () => {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [enrolledBatches, setEnrolledBatches] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();

  // Get enrolled batches on mount
  useEffect(() => {
    const enrolled = getEnrolledBatches();
    setEnrolledBatches(enrolled);
    if (enrolled.length > 0 && !selectedBatchId) {
      setSelectedBatchId(enrolled[0]._id);
    }
  }, []);

  // Handle initial load state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
  };

  // Show loading state during initial load
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground dark:text-white">Loading...</h1>
              <p className="mb-6 text-muted-foreground dark:text-gray-400">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Since this component is wrapped in ProtectedRoute, we don't need to check authentication here
  // The ProtectedRoute will redirect to login if not authenticated

  if (enrolledBatches.length === 0) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground dark:text-white">No Enrolled Batches</h1>
              <p className="mb-6 text-muted-foreground dark:text-gray-400">
                You need to enroll in at least one batch to access the community features.
              </p>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <a href="/batches">Browse Batches</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 overflow-hidden flex flex-col">
      <Navbar />

      {/* Sticky Header - Outside scrolling container */}
      <div className="sticky top-0 z-40 bg-background dark:bg-gray-900 border-b border-border dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white">Community</h1>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Connect with students and teachers in your enrolled batches
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Content Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4">
          {/* Batch Selector */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 max-w-sm">
                <label className="block text-sm font-medium text-foreground dark:text-white mb-2">
                  Select Batch
                </label>
                <Select value={selectedBatchId} onValueChange={handleBatchChange}>
                  <SelectTrigger className="w-full h-12 bg-background dark:bg-gray-800 border-border dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="Choose a batch..." className="text-foreground dark:text-white" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-lg z-50">
                    {enrolledBatches.map((batch) => (
                      <SelectItem 
                        key={batch._id} 
                        value={batch._id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer text-gray-900 dark:text-white focus:bg-gray-100 dark:focus:bg-gray-800"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-primary font-semibold">
                              {batch.name?.charAt(0)?.toUpperCase() || 'B'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-foreground dark:text-white text-sm">
                              {batch.name || 'Unknown Batch'}
                            </div>
                            {batch.class && (
                              <div className="text-xs text-muted-foreground dark:text-gray-400">
                                Class {batch.class}
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground dark:text-gray-400">
                {enrolledBatches.length} enrolled batch{enrolledBatches.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>

          {/* Community Section */}
          <div className="pb-8">
            {selectedBatchId && (
              <CommunitySection batchId={selectedBatchId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
