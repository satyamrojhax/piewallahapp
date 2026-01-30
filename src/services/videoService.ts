import { safeFetch } from '../lib/apiConfig';
import { firebaseServices } from '@/lib/firebaseServices';

const VIDEO_API_BASE = "https://piewallahapi.vercel.app/api";

export type VideoResponse = {
  success: boolean;
  data: {
    url: string;
    signedUrl: string;
    urlType: string;
    scheduleInfo: {
      startTime: string;
      endTime: string;
    };
    videoContainer: string;
    isCmaf: boolean;
    serverTime: number;
    cdnType: string;
  };
  stream_url: string;
  url_type: string;
  drm?: {
    kid: string;
    key: string;
  };
};

export const fetchVideoUrl = async (
  batchId: string,
  subjectId: string,
  childId: string
): Promise<VideoResponse> => {
  try {
    const url = `${VIDEO_API_BASE}/video?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`;
    
    const response = await safeFetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video URL: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Video API returned unsuccessful response');
    }
    
    return data as VideoResponse;
  } catch (error) {
    throw new Error(`Error fetching video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getVideoStreamUrl = async (
  batchId: string,
  subjectId: string,
  childId: string
): Promise<string> => {
  const videoData = await fetchVideoUrl(batchId, subjectId, childId);
  return videoData.stream_url;
};

export const getVideoData = async (
  batchId: string,
  subjectId: string,
  childId: string
): Promise<{
  stream_url: string;
  drm?: {
    kid: string;
    key: string;
  };
  cdnType?: string;
  urlType?: string;
}> => {
  const videoData = await fetchVideoUrl(batchId, subjectId, childId);
  
  return {
    stream_url: videoData.stream_url,
    drm: videoData.drm ? {
      kid: videoData.drm.kid,
      key: videoData.drm.key
    } : undefined,
    cdnType: videoData.data?.cdnType,
    urlType: videoData.url_type
  };
};

// Video history tracking functions
export const saveVideoHistory = async (videoData: {
  videoId: string;
  videoTitle: string;
  batchId: string;
  subjectId: string;
  watchDuration: number;
  totalDuration: number;
  completed: boolean;
  lastPosition: number;
}): Promise<void> => {
  try {
    // Get current user ID and include it in the data
    const userData = localStorage.getItem('user_data');
    const userId = userData ? JSON.parse(userData).id || JSON.parse(userData).username || 'anonymous' : 'anonymous';
    
    await firebaseServices.videoHistory.saveVideoHistory({
      ...videoData,
      userId
    });
  } catch (error) {
      }
};

export const getVideoHistory = async (): Promise<any[]> => {
  try {
    return await firebaseServices.videoHistory.getVideoHistory();
  } catch (error) {
        return [];
  }
};

export const getVideoHistoryByVideo = async (videoId: string): Promise<any | null> => {
  try {
    return await firebaseServices.videoHistory.getVideoHistoryByVideo(videoId);
  } catch (error) {
        return null;
  }
};

export const subscribeToVideoHistory = (callback: (history: any[]) => void) => {
  return firebaseServices.videoHistory.subscribeToVideoHistory(callback);
};

// Helper function to track video progress
export const trackVideoProgress = async (
  videoId: string,
  videoTitle: string,
  batchId: string,
  subjectId: string,
  currentTime: number,
  duration: number
): Promise<void> => {
  const watchDuration = currentTime;
  const completed = duration > 0 && (currentTime / duration) >= 0.9; // 90% watched
  
  await saveVideoHistory({
    videoId,
    videoTitle,
    batchId,
    subjectId,
    watchDuration,
    totalDuration: duration,
    completed,
    lastPosition: currentTime
  });
};
