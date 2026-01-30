import { firebaseServices } from '@/lib/firebaseServices';

// Note management functions
export const saveNote = async (noteData: {
  contentId: string;
  contentType: 'lecture' | 'dpp';
  title: string;
  content: string;
  isPrivate?: boolean;
}): Promise<string> => {
  try {
    // Get current user ID
    const userData = localStorage.getItem('user_data');
    const userId = userData ? JSON.parse(userData).id || JSON.parse(userData).username || 'anonymous' : 'anonymous';
    
    return await firebaseServices.notes.saveNote({
      ...noteData,
      userId,
      isPrivate: noteData.isPrivate ?? true
    });
  } catch (error) {
        throw error;
  }
};

export const updateNote = async (noteId: string, updates: {
  title?: string;
  content?: string;
  isPrivate?: boolean;
}): Promise<void> => {
  try {
    await firebaseServices.notes.updateNote(noteId, updates);
  } catch (error) {
        throw error;
  }
};

export const getNotes = async (): Promise<any[]> => {
  try {
    return await firebaseServices.notes.getNotes();
  } catch (error) {
        return [];
  }
};

export const getNotesByContent = async (contentId: string): Promise<any[]> => {
  try {
    return await firebaseServices.notes.getNotesByContent(contentId);
  } catch (error) {
        return [];
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    await firebaseServices.notes.deleteNote(noteId);
  } catch (error) {
        throw error;
  }
};

export const subscribeToNotes = (callback: (notes: any[]) => void) => {
  return firebaseServices.notes.subscribeToNotes(callback);
};

// Content view tracking (for DPP views, etc.)
export const saveContentView = async (viewData: {
  contentId: string;
  contentType: 'lecture' | 'dpp' | 'note';
  viewDuration?: number;
  completed?: boolean;
}): Promise<void> => {
  try {
    // Get current user ID
    const userData = localStorage.getItem('user_data');
    const userId = userData ? JSON.parse(userData).id || JSON.parse(userData).username || 'anonymous' : 'anonymous';
    
    await firebaseServices.contentViews.saveContentView({
      ...viewData,
      userId,
      viewDuration: viewData.viewDuration || 0,
      completed: viewData.completed || false
    });
  } catch (error) {
      }
};

export const getContentViews = async (): Promise<any[]> => {
  try {
    return await firebaseServices.contentViews.getContentViews();
  } catch (error) {
        return [];
  }
};

export const getContentViewsByContent = async (contentId: string): Promise<any[]> => {
  try {
    return await firebaseServices.contentViews.getContentViewsByContent(contentId);
  } catch (error) {
        return [];
  }
};

export const subscribeToContentViews = (callback: (views: any[]) => void) => {
  return firebaseServices.contentViews.subscribeToContentViews(callback);
};

// Helper function to track DPP views
export const trackDPPView = async (
  dppId: string,
  viewDuration: number = 0,
  completed: boolean = false
): Promise<void> => {
  await saveContentView({
    contentId: dppId,
    contentType: 'dpp',
    viewDuration,
    completed
  });
};

// Helper function to track lecture views
export const trackLectureView = async (
  lectureId: string,
  viewDuration: number = 0,
  completed: boolean = false
): Promise<void> => {
  await saveContentView({
    contentId: lectureId,
    contentType: 'lecture',
    viewDuration,
    completed
  });
};

// Helper function to track note views
export const trackNoteView = async (
  noteId: string,
  viewDuration: number = 0
): Promise<void> => {
  await saveContentView({
    contentId: noteId,
    contentType: 'note',
    viewDuration,
    completed: false // Notes don't have completion status
  });
};
