import { app, analytics, database, auth } from './firebase';
import { ref, set, get, update, remove, push, onValue } from 'firebase/database';
import type { EnrolledBatch } from './enrollmentUtils';
import type { UserProfile } from '@/services/userService';
import type { Message, Conversation } from '@/services/aiGuruService';

// Types for Firebase data structures
export interface FirebaseUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  primaryNumber: string;
  countryCode: string;
  profileId: {
    exams: string[];
    board: string;
    class: string;
    programId: string;
    cohortId: string;
  };
  organization: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseEnrolledBatch extends EnrolledBatch {
  userId: string;
}

export interface FirebaseChatMessage {
  id: string;
  conversationId: string;
  text: string;
  authorId: string;
  authorMetadata: any;
  createdAt: string;
  messageType: 'human' | 'ai';
  isDeleted?: boolean;
}

export interface FirebaseVideoHistory {
  id: string;
  userId: string;
  videoId: string;
  videoTitle: string;
  batchId: string;
  subjectId: string;
  watchedAt: string;
  watchDuration: number; // in seconds
  totalDuration: number; // in seconds
  completed: boolean;
  lastPosition: number; // in seconds
}

export interface FirebaseNote {
  id: string;
  userId: string;
  contentId: string; // lecture/video ID
  contentType: 'lecture' | 'dpp';
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
}

export interface FirebaseContentView {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'lecture' | 'dpp' | 'note';
  viewedAt: string;
  viewDuration: number; // in seconds
  completed: boolean;
}

export interface FirebaseLectureCompletion {
  id: string;
  userId: string;
  lectureId: string;
  batchId: string;
  subjectId: string;
  completedAt: string;
  completed: boolean;
}

export interface FirebaseUserProfile extends FirebaseUserInfo {
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  stats: {
    totalVideosWatched: number;
    totalWatchTime: number;
    completedLectures: number;
    notesCount: number;
  };
}

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  // First check Firebase Auth
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  
  // Fallback to localStorage
  const userData = localStorage.getItem('user_data');
  if (userData) {
    const user = JSON.parse(userData);
    const userId = user.id || user.username || user.uid;
    if (userId && userId !== 'anonymous') {
      return userId;
    }
  }
  
  // Check for auth token
  const authToken = localStorage.getItem('param_auth_token') || sessionStorage.getItem('param_auth_token');
  if (authToken) {
    // Try to extract user ID from token or use a consistent fallback
    const fallbackId = localStorage.getItem('user_id') || 'user_' + Date.now();
    localStorage.setItem('user_id', fallbackId); // Store for consistency
    return fallbackId;
  }
  
  return 'anonymous';
};

// Generic CRUD operations
export const firebaseCRUD = {
  // Create/Update
  async set(path: string, data: any): Promise<void> {
    const dbRef = ref(database, path);
    await set(dbRef, data);
  },

  // Read
  async get(path: string): Promise<any> {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Push (for arrays/lists)
  async push(path: string, data: any): Promise<string> {
    const dbRef = ref(database, path);
    const result = await push(dbRef, data);
    return result.key || '';
  },

  // Update (partial update)
  async update(path: string, data: any): Promise<void> {
    const dbRef = ref(database, path);
    await update(dbRef, data);
  },

  // Delete
  async remove(path: string): Promise<void> {
    const dbRef = ref(database, path);
    await remove(dbRef);
  },

  // Real-time listener
  subscribe(path: string, callback: (data: any) => void) {
    const dbRef = ref(database, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return unsubscribe;
  }
};

// User info operations
export const userInfoService = {
  async saveUserInfo(userInfo: Partial<UserProfile>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `users/${userId}`;
    const data = {
      ...userInfo,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString() // Will be overwritten if exists
    };
    await firebaseCRUD.set(path, data);
  },

  async getUserInfo(): Promise<FirebaseUserInfo | null> {
    const userId = getCurrentUserId();
    const path = `users/${userId}`;
    return await firebaseCRUD.get(path);
  },

  async updateUserPreferences(preferences: Partial<FirebaseUserProfile['preferences']>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `users/${userId}/preferences`;
    await firebaseCRUD.update(path, preferences);
  },

  subscribeToUserInfo(callback: (userInfo: FirebaseUserInfo | null) => void) {
    const userId = getCurrentUserId();
    const path = `users/${userId}`;
    return firebaseCRUD.subscribe(path, callback);
  }
};

// Batch enrollment operations
export const batchEnrollmentService = {
  async enrollBatch(batch: Omit<EnrolledBatch, 'enrolledAt'>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userBatches/${userId}`;
    const enrolledBatch: FirebaseEnrolledBatch = {
      ...batch,
      userId,
      enrolledAt: new Date().toISOString()
    };
    await firebaseCRUD.push(path, enrolledBatch);
  },

  async getEnrolledBatches(): Promise<FirebaseEnrolledBatch[]> {
    const userId = getCurrentUserId();
    const path = `userBatches/${userId}`;
    const data = await firebaseCRUD.get(path);
    return data ? Object.values(data) : [];
  },

  async unenrollBatch(batchId: string): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userBatches/${userId}`;
    const batches = await this.getEnrolledBatches();
    const batchToRemove = batches.find(b => b._id === batchId);
    
    if (batchToRemove && batchToRemove.id) {
      await firebaseCRUD.remove(`${path}/${batchToRemove.id}`);
    }
  },

  subscribeToEnrolledBatches(callback: (batches: FirebaseEnrolledBatch[]) => void) {
    const userId = getCurrentUserId();
    const path = `userBatches/${userId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      const batches = data ? Object.values(data) : [];
      callback(batches as FirebaseEnrolledBatch[]);
    });
  }
};

// AI Guru chat operations
export const chatService = {
  async saveMessage(message: Omit<FirebaseChatMessage, 'id' | 'createdAt'>): Promise<string> {
    const userId = getCurrentUserId();
    const path = `userChats/${userId}/${message.conversationId}`;
    const chatMessage: Omit<FirebaseChatMessage, 'id'> = {
      ...message,
      createdAt: new Date().toISOString()
    };
    return await firebaseCRUD.push(path, chatMessage);
  },

  async getConversationMessages(conversationId: string): Promise<FirebaseChatMessage[]> {
    const userId = getCurrentUserId();
    const path = `userChats/${userId}/${conversationId}`;
    const data = await firebaseCRUD.get(path);
    if (!data) return [];
    const messages = Object.values(data) as any[];
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userChats/${userId}/${conversationId}/${messageId}`;
    await firebaseCRUD.remove(path);
  },

  subscribeToConversation(conversationId: string, callback: (messages: FirebaseChatMessage[]) => void) {
    const userId = getCurrentUserId();
    const path = `userChats/${userId}/${conversationId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      if (!data) {
        callback([]);
        return;
      }
      const messages = Object.values(data) as any[];
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      callback(sortedMessages as FirebaseChatMessage[]);
    });
  }
};

// Video history operations
export const videoHistoryService = {
  async saveVideoHistory(videoHistory: Omit<FirebaseVideoHistory, 'id' | 'watchedAt'>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `videoHistory/${userId}`;
    const history: FirebaseVideoHistory = {
      ...videoHistory,
      id: `${videoHistory.videoId}_${userId}`, // Unique ID
      watchedAt: new Date().toISOString()
    };
    await firebaseCRUD.set(`${path}/${history.id}`, history);
  },

  async getVideoHistory(): Promise<FirebaseVideoHistory[]> {
    const userId = getCurrentUserId();
    const path = `videoHistory/${userId}`;
    const data = await firebaseCRUD.get(path);
    if (!data) return [];
    const history = Object.values(data) as any[];
    return history.sort((a, b) => 
      new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
  },

  async getVideoHistoryByVideo(videoId: string): Promise<FirebaseVideoHistory | null> {
    const userId = getCurrentUserId();
    const path = `videoHistory/${userId}/${videoId}_${userId}`;
    return await firebaseCRUD.get(path);
  },

  subscribeToVideoHistory(callback: (history: FirebaseVideoHistory[]) => void) {
    const userId = getCurrentUserId();
    const path = `videoHistory/${userId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      if (!data) {
        callback([]);
        return;
      }
      const history = Object.values(data) as any[];
      const sortedHistory = history.sort((a, b) => 
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
      );
      callback(sortedHistory as FirebaseVideoHistory[]);
    });
  }
};

// Notes operations
export const notesService = {
  async saveNote(note: Omit<FirebaseNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = getCurrentUserId();
    const path = `userNotes/${userId}`;
    const newNote: Omit<FirebaseNote, 'id'> = {
      ...note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await firebaseCRUD.push(path, newNote);
  },

  async updateNote(noteId: string, updates: Partial<FirebaseNote>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userNotes/${userId}/${noteId}`;
    await firebaseCRUD.update(path, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async getNotes(): Promise<FirebaseNote[]> {
    const userId = getCurrentUserId();
    const path = `userNotes/${userId}`;
    const data = await firebaseCRUD.get(path);
    if (!data) return [];
    const notes = Object.values(data) as any[];
    return notes.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getNotesByContent(contentId: string): Promise<FirebaseNote[]> {
    const userId = getCurrentUserId();
    const notes = await this.getNotes();
    return notes.filter(note => note.contentId === contentId);
  },

  async deleteNote(noteId: string): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userNotes/${userId}/${noteId}`;
    await firebaseCRUD.remove(path);
  },

  subscribeToNotes(callback: (notes: FirebaseNote[]) => void) {
    const userId = getCurrentUserId();
    const path = `userNotes/${userId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      if (!data) {
        callback([]);
        return;
      }
      const notes = Object.values(data) as any[];
      const sortedNotes = notes.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      callback(sortedNotes as FirebaseNote[]);
    });
  }
};

// Content views operations (for DPP views, etc.)
export const contentViewsService = {
  async saveContentView(contentView: Omit<FirebaseContentView, 'id' | 'viewedAt'>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `contentViews/${userId}`;
    const view: FirebaseContentView = {
      ...contentView,
      id: `${contentView.contentId}_${contentView.contentType}_${userId}`,
      viewedAt: new Date().toISOString()
    };
    await firebaseCRUD.set(`${path}/${view.id}`, view);
  },

  async getContentViews(): Promise<FirebaseContentView[]> {
    const userId = getCurrentUserId();
    const path = `contentViews/${userId}`;
    const data = await firebaseCRUD.get(path);
    if (!data) return [];
    const views = Object.values(data) as any[];
    return views.sort((a, b) => 
      new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );
  },

  async getContentViewsByContent(contentId: string): Promise<FirebaseContentView[]> {
    const userId = getCurrentUserId();
    const views = await this.getContentViews();
    return views.filter(view => view.contentId === contentId);
  },

  subscribeToContentViews(callback: (views: FirebaseContentView[]) => void) {
    const userId = getCurrentUserId();
    const path = `contentViews/${userId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      if (!data) {
        callback([]);
        return;
      }
      const views = Object.values(data) as any[];
      const sortedViews = views.sort((a, b) => 
        new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      );
      callback(sortedViews as FirebaseContentView[]);
    });
  }
};

// Lecture completion operations
export const lectureCompletionService = {
  async markLectureComplete(lectureData: Omit<FirebaseLectureCompletion, 'id' | 'completedAt'>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `lectureCompletions/${userId}`;
    const completion: FirebaseLectureCompletion = {
      ...lectureData,
      id: `${lectureData.lectureId}_${userId}`,
      completedAt: new Date().toISOString(),
      completed: true
    };
    await firebaseCRUD.set(`${path}/${completion.id}`, completion);
  },

  async getLectureCompletions(): Promise<FirebaseLectureCompletion[]> {
    const userId = getCurrentUserId();
    const path = `lectureCompletions/${userId}`;
    const data = await firebaseCRUD.get(path);
    return data ? Object.values(data) : [];
  },

  async isLectureCompleted(lectureId: string): Promise<boolean> {
    const userId = getCurrentUserId();
    const path = `lectureCompletions/${userId}/${lectureId}_${userId}`;
    const completion = await firebaseCRUD.get(path);
    return completion?.completed || false;
  },

  async getCompletedLecturesByBatch(batchId: string): Promise<FirebaseLectureCompletion[]> {
    const userId = getCurrentUserId();
    const completions = await this.getLectureCompletions();
    return completions.filter(completion => completion.batchId === batchId);
  },

  subscribeToLectureCompletions(callback: (completions: FirebaseLectureCompletion[]) => void) {
    const userId = getCurrentUserId();
    const path = `lectureCompletions/${userId}`;
    
    return firebaseCRUD.subscribe(path, (data) => {
      const completions = data ? Object.values(data) : [];
      callback(completions as FirebaseLectureCompletion[]);
    });
  }
};

// User profile operations
export const userProfileService = {
  async saveUserProfile(profile: Partial<FirebaseUserProfile>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userProfiles/${userId}`;
    const data = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    await firebaseCRUD.set(path, data);
  },

  async getUserProfile(): Promise<FirebaseUserProfile | null> {
    const userId = getCurrentUserId();
    const path = `userProfiles/${userId}`;
    return await firebaseCRUD.get(path);
  },

  async updateUserStats(stats: Partial<FirebaseUserProfile['stats']>): Promise<void> {
    const userId = getCurrentUserId();
    const path = `userProfiles/${userId}/stats`;
    await firebaseCRUD.update(path, stats);
  },

  subscribeToUserProfile(callback: (profile: FirebaseUserProfile | null) => void) {
    const userId = getCurrentUserId();
    const path = `userProfiles/${userId}`;
    return firebaseCRUD.subscribe(path, callback);
  }
};

// Export all services
export const firebaseServices = {
  userInfo: userInfoService,
  batchEnrollment: batchEnrollmentService,
  chat: chatService,
  videoHistory: videoHistoryService,
  notes: notesService,
  contentViews: contentViewsService,
  lectureCompletion: lectureCompletionService,
  userProfile: userProfileService,
  crud: firebaseCRUD
};
