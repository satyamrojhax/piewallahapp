import { getDatabase, ref, set, get, update, push, remove, onValue } from 'firebase/database';
import { app } from '@/config/firebase';

const database = getDatabase(app);

// Types for real-time database storage
export interface CompletedLecture {
  id: string;
  userId: string;
  lectureId: string;
  batchId: string;
  subject: string;
  topic: string;
  completedAt: number;
  duration: number;
  watchTime: number;
  completed: boolean;
}

export interface EnrolledBatch {
  id: string;
  userId: string;
  batchId: string;
  batchName: string;
  enrolledAt: number;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  totalLectures: number;
  completedLectures: number;
}

export interface UserProfileData {
  id: string;
  userId: string;
  profileData: any;
  lastUpdated: number;
  academicInfo: {
    class?: string;
    board?: string;
    exams?: string[];
    stream?: string;
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    primaryNumber: string;
    countryCode: string;
  };
  stats: {
    totalCoins: number;
    walletBalance: number;
    memberSince: string;
  };
}

export interface UserBehavior {
  id: string;
  userId: string;
  action: string;
  page: string;
  data?: any;
  timestamp: number;
  sessionId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    screenResolution?: string;
  };
  location?: {
    path: string;
    query?: string;
  };
}

// Real-time database paths
const getPaths = (userId: string) => ({
  completedLectures: `users/${userId}/completedLectures`,
  enrolledBatches: `users/${userId}/enrolledBatches`,
  userProfile: `users/${userId}/profile`,
  userBehaviors: `users/${userId}/behaviors`,
  userSessions: `users/${userId}/sessions`,
});

// Completed Lectures Functions
export const saveCompletedLecture = async (userId: string, lectureData: Omit<CompletedLecture, 'id' | 'userId' | 'completedAt'>): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const lectureRef = ref(database, `${paths.completedLectures}/${lectureData.lectureId}`);
    
    const lecture: CompletedLecture = {
      ...lectureData,
      id: lectureData.lectureId,
      userId,
      completedAt: Date.now(),
    };

    await set(lectureRef, lecture);
  } catch (error) {
    console.error('Error saving completed lecture:', error);
    throw error;
  }
};

export const getCompletedLectures = async (userId: string): Promise<CompletedLecture[]> => {
  try {
    const paths = getPaths(userId);
    const lecturesRef = ref(database, paths.completedLectures);
    const snapshot = await get(lecturesRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as CompletedLecture[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching completed lectures:', error);
    return [];
  }
};

export const isLectureCompleted = async (userId: string, lectureId: string): Promise<boolean> => {
  try {
    const paths = getPaths(userId);
    const lectureRef = ref(database, `${paths.completedLectures}/${lectureId}`);
    const snapshot = await get(lectureRef);
    return snapshot.exists() && snapshot.val().completed;
  } catch (error) {
    console.error('Error checking lecture completion:', error);
    return false;
  }
};

// Enrolled Batches Functions
export const saveEnrolledBatch = async (userId: string, batchData: Omit<EnrolledBatch, 'id' | 'userId' | 'enrolledAt'>): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const batchRef = ref(database, `${paths.enrolledBatches}/${batchData.batchId}`);
    
    const batch: EnrolledBatch = {
      ...batchData,
      id: batchData.batchId,
      userId,
      enrolledAt: Date.now(),
    };

    await set(batchRef, batch);
  } catch (error) {
    console.error('Error saving enrolled batch:', error);
    throw error;
  }
};

export const getEnrolledBatches = async (userId: string): Promise<EnrolledBatch[]> => {
  try {
    const paths = getPaths(userId);
    const batchesRef = ref(database, paths.enrolledBatches);
    const snapshot = await get(batchesRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data) as EnrolledBatch[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching enrolled batches:', error);
    return [];
  }
};

export const updateBatchProgress = async (userId: string, batchId: string, progress: number): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const batchRef = ref(database, `${paths.enrolledBatches}/${batchId}`);
    
    await update(batchRef, {
      progress,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Error updating batch progress:', error);
    throw error;
  }
};

// User Profile Functions
export const saveUserProfile = async (userId: string, profileData: any): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const profileRef = ref(database, paths.userProfile);
    
    const userProfile: UserProfileData = {
      id: userId,
      userId,
      profileData,
      lastUpdated: Date.now(),
      academicInfo: {
        class: profileData.profileId?.class,
        board: profileData.profileId?.board,
        exams: profileData.profileId?.exams,
        stream: profileData.profileId?.stream,
      },
      personalInfo: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        primaryNumber: profileData.primaryNumber,
        countryCode: profileData.countryCode,
      },
      stats: {
        totalCoins: profileData.profileId?.coins?.totalCoins || 0,
        walletBalance: profileData.profileId?.wallet || 0,
        memberSince: profileData.createdAt,
      },
    };

    await set(profileRef, userProfile);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfileData | null> => {
  try {
    const paths = getPaths(userId);
    const profileRef = ref(database, paths.userProfile);
    const snapshot = await get(profileRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// User Behavior Tracking Functions
export const trackUserBehavior = async (userId: string, action: string, page: string, data?: any): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const behaviorsRef = ref(database, paths.userBehaviors);
    const newBehaviorRef = push(behaviorsRef);

    // Clean data to remove undefined values
    const cleanData = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (typeof obj !== 'object') {
        return obj;
      }
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = typeof obj[key] === 'object' ? cleanData(obj[key]) : obj[key];
        }
      }
      return cleaned;
    };

    const behavior: UserBehavior = {
      id: newBehaviorRef.key!,
      userId,
      action,
      page,
      data: data ? cleanData(data) : undefined,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
      location: {
        path: window.location.pathname,
        query: window.location.search,
      },
    };

    await set(newBehaviorRef, behavior);
  } catch (error) {
    console.error('Error tracking user behavior:', error);
    // Don't throw error for behavior tracking to avoid breaking app functionality
  }
};

export const trackPageView = async (userId: string, page: string): Promise<void> => {
  await trackUserBehavior(userId, 'page_view', page);
};

export const trackVideoInteraction = async (userId: string, videoId: string, action: string, data?: any): Promise<void> => {
  await trackUserBehavior(userId, `video_${action}`, 'video_player', { videoId, ...data });
};

export const trackBatchInteraction = async (userId: string, batchId: string, action: string, data?: any): Promise<void> => {
  await trackUserBehavior(userId, `batch_${action}`, 'batch_page', { batchId, ...data });
};

// Session Management
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

export const startUserSession = async (userId: string): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const sessionsRef = ref(database, `${paths.userSessions}/${getSessionId()}`);
    
    await set(sessionsRef, {
      userId,
      sessionId: getSessionId(),
      startTime: Date.now(),
      startPage: window.location.pathname,
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
    });
  } catch (error) {
    console.error('Error starting user session:', error);
  }
};

export const endUserSession = async (userId: string): Promise<void> => {
  try {
    const paths = getPaths(userId);
    const sessionsRef = ref(database, `${paths.userSessions}/${getSessionId()}`);
    
    await update(sessionsRef, {
      endTime: Date.now(),
      endPage: window.location.pathname,
      duration: Date.now() - parseInt(sessionStorage.getItem('session_start_time') || Date.now().toString()),
    });
  } catch (error) {
    console.error('Error ending user session:', error);
  }
};

// Real-time listeners
export const listenToCompletedLectures = (userId: string, callback: (lectures: CompletedLecture[]) => void) => {
  const paths = getPaths(userId);
  const lecturesRef = ref(database, paths.completedLectures);
  
  return onValue(lecturesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Object.values(data) as CompletedLecture[]);
    } else {
      callback([]);
    }
  });
};

export const listenToEnrolledBatches = (userId: string, callback: (batches: EnrolledBatch[]) => void) => {
  const paths = getPaths(userId);
  const batchesRef = ref(database, paths.enrolledBatches);
  
  return onValue(batchesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      callback(Object.values(data) as EnrolledBatch[]);
    } else {
      callback([]);
    }
  });
};

export const listenToUserProfile = (userId: string, callback: (profile: UserProfileData | null) => void) => {
  const paths = getPaths(userId);
  const profileRef = ref(database, paths.userProfile);
  
  return onValue(profileRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as UserProfileData);
    } else {
      callback(null);
    }
  });
};

// Utility Functions
export const getUserStats = async (userId: string): Promise<{
  totalLecturesCompleted: number;
  totalBatchesEnrolled: number;
  averageProgress: number;
  totalTimeSpent: number;
}> => {
  try {
    const [lectures, batches] = await Promise.all([
      getCompletedLectures(userId),
      getEnrolledBatches(userId),
    ]);

    const totalLecturesCompleted = lectures.length;
    const totalBatchesEnrolled = batches.length;
    const averageProgress = batches.length > 0 
      ? batches.reduce((sum, batch) => sum + batch.progress, 0) / batches.length 
      : 0;
    const totalTimeSpent = lectures.reduce((sum, lecture) => sum + (lecture.watchTime || 0), 0);

    return {
      totalLecturesCompleted,
      totalBatchesEnrolled,
      averageProgress,
      totalTimeSpent,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      totalLecturesCompleted: 0,
      totalBatchesEnrolled: 0,
      averageProgress: 0,
      totalTimeSpent: 0,
    };
  }
};
