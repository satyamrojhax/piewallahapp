import { firebaseServices } from '@/lib/firebaseServices';

// Lecture completion tracking functions
export const markLectureComplete = async (lectureData: {
  lectureId: string;
  batchId: string;
  subjectId: string;
}): Promise<void> => {
  try {
    // Get current user ID
    const userData = localStorage.getItem('user_data');
    const userId = userData ? JSON.parse(userData).id || JSON.parse(userData).username || 'anonymous' : 'anonymous';
    
    await firebaseServices.lectureCompletion.markLectureComplete({
      ...lectureData,
      userId,
      completed: true // Mark as completed
    });
  } catch (error) {
    // Failed to mark lecture complete in Firebase
    throw error;
  }
};

export const getLectureCompletions = async (): Promise<any[]> => {
  try {
    return await firebaseServices.lectureCompletion.getLectureCompletions();
  } catch (error) {
    // Failed to get lecture completions from Firebase
    return [];
  }
};

export const isLectureCompleted = async (lectureId: string): Promise<boolean> => {
  try {
    return await firebaseServices.lectureCompletion.isLectureCompleted(lectureId);
  } catch (error) {
        return false;
  }
};

export const getCompletedLecturesByBatch = async (batchId: string): Promise<any[]> => {
  try {
    return await firebaseServices.lectureCompletion.getCompletedLecturesByBatch(batchId);
  } catch (error) {
        return [];
  }
};

export const subscribeToLectureCompletions = (callback: (completions: any[]) => void) => {
  return firebaseServices.lectureCompletion.subscribeToLectureCompletions(callback);
};

// Helper function to get lecture completion statistics
export const getLectureCompletionStats = async (batchId?: string): Promise<{
  totalCompleted: number;
  totalLectures?: number;
  completionPercentage?: number;
}> => {
  try {
    const completions = batchId 
      ? await getCompletedLecturesByBatch(batchId)
      : await getLectureCompletions();
    
    const totalCompleted = completions.length;
    
    // If batchId is provided, we could calculate total lectures from batch data
    // For now, we'll return just the completed count
    return {
      totalCompleted,
      totalLectures: undefined, // Would need batch data to calculate this
      completionPercentage: undefined // Would need total lectures to calculate this
    };
  } catch (error) {
        return {
      totalCompleted: 0,
      totalLectures: undefined,
      completionPercentage: undefined
    };
  }
};

// Helper function to toggle lecture completion
export const toggleLectureCompletion = async (lectureData: {
  lectureId: string;
  batchId: string;
  subjectId: string;
}): Promise<boolean> => {
  try {
    const isCompleted = await isLectureCompleted(lectureData.lectureId);
    
    if (isCompleted) {
      // Lecture is already completed, we could add an "uncomplete" function if needed
      // For now, we'll just return the current status
      return true;
    } else {
      // Mark as completed
      await markLectureComplete(lectureData);
      return true;
    }
  } catch (error) {
        return false;
  }
};

// Helper function to mark multiple lectures as complete (batch operation)
export const markMultipleLecturesComplete = async (lectures: Array<{
  lectureId: string;
  batchId: string;
  subjectId: string;
}>): Promise<void> => {
  try {
    await Promise.all(
      lectures.map(lecture => markLectureComplete(lecture))
    );
  } catch (error) {
        throw error;
  }
};
