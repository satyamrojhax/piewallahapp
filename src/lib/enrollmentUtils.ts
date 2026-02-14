// Utility functions for managing enrolled batches in localStorage
import "@/config/firebase";
import { saveEnrolledBatch, trackBatchInteraction } from "@/services/realtimeDatabaseService";

export type EnrolledBatch = {
    _id: string;
    name: string;
    previewImage?: {
        baseUrl: string;
        key: string;
    };
    language?: string;
    class?: string;
    startDate?: string;
    endDate?: string;
    enrolledAt: string;
};

const STORAGE_KEY = 'enrolledBatches';
const MAX_ENROLLMENTS_DESKTOP = 7;
const MAX_ENROLLMENTS_MOBILE = 2;

// Helper function to detect mobile device
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768; // md breakpoint in Tailwind
};

// Get max enrollments based on device type
const getMaxEnrollments = (): number => {
  return isMobileDevice() ? MAX_ENROLLMENTS_MOBILE : MAX_ENROLLMENTS_DESKTOP;
};

export { MAX_ENROLLMENTS_DESKTOP, MAX_ENROLLMENTS_MOBILE, getMaxEnrollments };

export const getEnrolledBatches = async (): Promise<EnrolledBatch[]> => {
    try {
        // Get from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        const localStorageBatches = stored ? JSON.parse(stored) : [];
        
        // Remove duplicates from localStorage as well
        const uniqueBatches = localStorageBatches.reduce((acc: EnrolledBatch[], batch: EnrolledBatch) => {
            const existingIndex = acc.findIndex(b => b._id === batch._id);
            if (existingIndex === -1) {
                acc.push(batch);
            } else {
                // Keep the one with the latest enrolledAt
                if (new Date(batch.enrolledAt) > new Date(acc[existingIndex].enrolledAt)) {
                    acc[existingIndex] = batch;
                }
            }
            return acc;
        }, []);
        
        // Update localStorage with deduplicated data
        if (uniqueBatches.length !== localStorageBatches.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueBatches));
        }
        
        return uniqueBatches;
    } catch (error) {
        return [];
    }
};

export const isEnrolled = async (batchId: string): Promise<boolean> => {
    const batches = await getEnrolledBatches();
    return batches.some(batch => batch._id === batchId);
};

export const enrollInBatch = async (batch: Omit<EnrolledBatch, 'enrolledAt'>, userId?: string): Promise<{ success: boolean; message: string }> => {
    try {
        const batches = await getEnrolledBatches();

        // Check if already enrolled
        if (batches.some(b => b._id === batch._id)) {
            return { success: false, message: "Already enrolled in this batch" };
        }

        // Check enrollment limit
        const maxEnrollments = getMaxEnrollments();
        if (batches.length >= maxEnrollments) {
            return { 
                success: false, 
                message: `Cannot enroll in more than ${maxEnrollments} batches on ${isMobileDevice() ? 'mobile' : 'desktop'}. Please unenroll from a batch first.` 
            };
        }

        // Save to localStorage
        const newBatch: EnrolledBatch = {
            ...batch,
            enrolledAt: new Date().toISOString(),
        };
        
        const currentBatches = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        currentBatches.push(newBatch);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBatches));
        
        // Also save to real-time database if userId is provided
        if (userId) {
            try {
                await saveEnrolledBatch(userId, {
                    batchId: batch._id,
                    batchName: batch.name,
                    status: 'active',
                    progress: 0,
                    totalLectures: 0,
                    completedLectures: 0,
                });
                
                // Track enrollment action
                await trackBatchInteraction(userId, batch._id, 'enrolled', {
                    batchName: batch.name,
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error('Error saving batch to real-time database:', error);
                // Don't fail the enrollment if real-time database fails
            }
        }
        
        return { success: true, message: "Successfully enrolled" };
    } catch (error) {
        return { success: false, message: "Failed to enroll" };
    }
};

export const unenrollFromBatch = async (batchId: string): Promise<boolean> => {
    try {
        const batches = await getEnrolledBatches();
        
        // Check if batch exists
        if (!batches.some(batch => batch._id === batchId)) {
            return false; // Batch not found
        }

        // Remove from localStorage
        const filtered = batches.filter(batch => batch._id !== batchId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        
        return true;
    } catch (error) {
        return false;
    }
};

export const getEnrolledBatchIds = async (): Promise<string[]> => {
    const batches = await getEnrolledBatches();
    return batches.map(batch => batch._id);
};

export const getEnrollmentCount = async (): Promise<number> => {
    const batches = await getEnrolledBatches();
    return batches.length;
};

export const canEnrollMore = async (): Promise<boolean> => {
    const count = await getEnrollmentCount();
    const maxEnrollments = getMaxEnrollments();
    return count < maxEnrollments;
};

export const canAccessBatchContent = (batchId: string): boolean => {
  // For synchronous access, check localStorage directly
  const stored = localStorage.getItem('enrolledBatches');
  if (!stored) return false;
  
  try {
    const batches = JSON.parse(stored);
    return batches.some((batch: any) => batch._id === batchId);
  } catch (error) {
    return false;
  }
};

export const getRemainingEnrollments = async (): Promise<number> => {
    const count = await getEnrollmentCount();
    const maxEnrollments = getMaxEnrollments();
    return Math.max(0, maxEnrollments - count);
};
