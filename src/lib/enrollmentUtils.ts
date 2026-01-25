// Utility functions for managing enrolled batches in localStorage

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
const MAX_ENROLLMENTS = 7;

export { MAX_ENROLLMENTS };

export const getEnrolledBatches = (): EnrolledBatch[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
};

export const isEnrolled = (batchId: string): boolean => {
    const batches = getEnrolledBatches();
    return batches.some(batch => batch._id === batchId);
};

export const enrollInBatch = (batch: Omit<EnrolledBatch, 'enrolledAt'>): { success: boolean; message: string } => {
    try {
        const batches = getEnrolledBatches();

        // Check if already enrolled
        if (batches.some(b => b._id === batch._id)) {
            return { success: false, message: "Already enrolled in this batch" };
        }

        // Check enrollment limit
        if (batches.length >= MAX_ENROLLMENTS) {
            return { 
                success: false, 
                message: `Cannot enroll in more than ${MAX_ENROLLMENTS} batches. Please unenroll from a batch first.` 
            };
        }

        // Add new enrollment
        const newBatch: EnrolledBatch = {
            ...batch,
            enrolledAt: new Date().toISOString(),
        };

        batches.push(newBatch);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
        return { success: true, message: "Successfully enrolled" };
    } catch (error) {
        return { success: false, message: "Failed to enroll" };
    }
};

export const unenrollFromBatch = (batchId: string): boolean => {
    try {
        const batches = getEnrolledBatches();
        const filtered = batches.filter(batch => batch._id !== batchId);

        if (filtered.length === batches.length) {
            return false; // Batch not found
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        return false;
    }
};

export const getEnrolledBatchIds = (): string[] => {
    return getEnrolledBatches().map(batch => batch._id);
};

export const getEnrollmentCount = (): number => {
    return getEnrolledBatches().length;
};

export const canEnrollMore = (): boolean => {
    return getEnrollmentCount() < MAX_ENROLLMENTS;
};

export const canAccessBatchContent = (batchId: string): boolean => {
    return isEnrolled(batchId);
};

export const getRemainingEnrollments = (): number => {
    return Math.max(0, MAX_ENROLLMENTS - getEnrollmentCount());
};
