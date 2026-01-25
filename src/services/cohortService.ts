import { getAuthToken, getCommonHeaders } from '@/lib/auth';

const API_BASE = "https://api.penpencil.co/batch-service/v2";
const COHORT_API_BASE = "https://api.penpencil.co/v1";
const BATCH_API_BASE = "https://api.penpencil.co/v3";

export type CohortItem = {
  _id: string;
  name: string;
  type: "SECTION" | "LAYER";
  icon?: string;
  title?: string;
  description?: string;
  key?: string;
  value?: string;
  displayOrder: number;
  hasChild: boolean;
  isOptional: boolean;
  isRoot?: boolean;
  isMultiSelect?: boolean;
  redirectionLink?: string;
  version: number;
  uiType?: string;
  meta?: string;
  metaData?: any;
  status: "Active" | "Inactive";
  organizationId: string;
  parentId?: string;
  rootId?: string;
  createdAt: string;
  updatedAt: string;
  child?: CohortItem[];
  getChild?: boolean;
  parentType?: string;
};

export type CohortResponse = {
  success: boolean;
  data: CohortItem[];
};

export type UserClassSelection = {
  exam?: string;
  class?: string;
  board?: string;
  stream?: string;
  path: Array<{
    id: string;
    name: string;
    type: string;
    value?: string;
  }>;
};

const internalFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error("Authentication required");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...getCommonHeaders(),
      "authorization": `Bearer ${token}`,
      ...options?.headers,
    },
  });
};

export const fetchRootCohorts = async (): Promise<CohortResponse> => {
  try {
    const response = await internalFetch(`${API_BASE}/cohort-landing-questions/root?version=2`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch root cohorts");
    }
    
    return response.json();
  } catch (error) {
    // Error fetching root cohorts
    throw error;
  }
};

export const fetchCohortChildren = async (parentId: string): Promise<CohortResponse> => {
  try {
    const response = await internalFetch(`${API_BASE}/cohort-landing-questions/${parentId}?version=2`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch cohort children");
    }
    
    return response.json();
  } catch (error) {
    // Error fetching cohort children
    throw error;
  }
};

export const saveUserClassSelection = (selection: UserClassSelection): void => {
  try {
    localStorage.setItem('user_class_selection', JSON.stringify(selection));
  } catch (error) {
    // Error saving class selection
  }
};

export const getUserClassSelection = (): UserClassSelection | null => {
  try {
    const stored = localStorage.getItem('user_class_selection');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    // Error retrieving class selection
    return null;
  }
};

export const clearUserClassSelection = (): void => {
  try {
    localStorage.removeItem('user_class_selection');
  } catch (error) {
    // Error clearing class selection
  }
};

export const hasUserSelectedClasses = (): boolean => {
  return getUserClassSelection() !== null;
};

// Helper function to extract class information from selection
export const getClassFiltersFromSelection = (selection: UserClassSelection): {
  exam?: string;
  class?: string;
  board?: string;
  stream?: string;
} => {
  return {
    exam: selection.exam,
    class: selection.class,
    board: selection.board,
    stream: selection.stream,
  };
};

// Helper function to check if a batch matches user's class selection
export const doesBatchMatchUserSelection = (
  batch: any,
  userSelection: UserClassSelection
): boolean => {
  const filters = getClassFiltersFromSelection(userSelection);
  
  // If no filters, return true (show all batches)
  if (!filters.exam && !filters.class && !filters.board && !filters.stream) {
    return true;
  }
  
  // Check exam match
  if (filters.exam && batch.exam) {
    const batchExamLower = batch.exam.toLowerCase();
    const userExamLower = filters.exam.toLowerCase();
    
    if (!batchExamLower.includes(userExamLower) && !userExamLower.includes(batchExamLower)) {
      return false;
    }
  }
  
  // Check class match
  if (filters.class && batch.class) {
    const batchClassLower = batch.class.toLowerCase();
    const userClassLower = filters.class.toLowerCase();
    
    // Handle various class formats (e.g., "10" matches "Class 10", "10th")
    const normalizeClass = (classStr: string) => {
      return classStr.replace(/class|th|st|nd|rd/gi, '').trim();
    };
    
    const normalizedBatchClass = normalizeClass(batchClassLower);
    const normalizedUserClass = normalizeClass(userClassLower);
    
    if (normalizedBatchClass !== normalizedUserClass && 
        !batchClassLower.includes(userClassLower) && 
        !userClassLower.includes(batchClassLower)) {
      return false;
    }
  }
  
  // Check board match
  if (filters.board && batch.board) {
    const batchBoardLower = batch.board.toLowerCase();
    const userBoardLower = filters.board.toLowerCase();
    
    if (!batchBoardLower.includes(userBoardLower) && !userBoardLower.includes(batchBoardLower)) {
      return false;
    }
  }
  
  // Check stream match
  if (filters.stream && batch.stream) {
    const batchStreamLower = batch.stream.toLowerCase();
    const userStreamLower = filters.stream.toLowerCase();
    
    if (!batchStreamLower.includes(userStreamLower) && !userStreamLower.includes(batchStreamLower)) {
      return false;
    }
  }
  
  return true;
};

// New API types for cohort-based batches
export type RecentCohort = {
  _id: string;
  icon: string;
  name: string;
  exam: string;
  class: string;
  board: string;
  mobIcon: string;
  webIcon: string;
};

export type RecentCohortsResponse = {
  success: boolean;
  data: {
    recentCohorts: RecentCohort[];
    selectedCohortId: string;
  };
};

export type BatchFromAPI = {
  type: string;
  typeId: string;
  displayOrder: number;
  typeInfo: {
    _id: string;
    name: string;
    previewImage?: {
      _id: string;
      name: string;
      baseUrl: string;
      key: string;
    };
    class?: string;
    exam?: string[];
    language?: string;
    startDate?: string;
    endDate?: string;
    card?: {
      files?: Array<{
        url?: string;
        type?: string;
        text?: string;
        video?: {
          image?: string;
        };
      }>;
      descriptionPointers?: Array<{
        image?: string;
        text?: string;
        postText?: string;
        isOngoing?: boolean;
      }>;
    };
    link?: string;
  };
};

export type BatchesResponse = {
  success: boolean;
  data: BatchFromAPI[];
  paginate?: {
    limit: number;
    totalCount: number;
  };
};

// Fetch recent cohorts for the logged-in user
export const fetchRecentCohorts = async (): Promise<RecentCohortsResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${COHORT_API_BASE}/cohort/recent-cohorts`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent cohorts");
    }

    return response.json();
  } catch (error) {
    // Error fetching recent cohorts
    throw error;
  }
};

// Fetch batches for a specific cohort with pagination
export const fetchCohortBatches = async (
  cohortId: string,
  page: number = 1
): Promise<BatchesResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${BATCH_API_BASE}/cohort/${cohortId}/widgets/all-courses?page=${page}`,
      {
        headers: {
          ...getCommonHeaders(),
          "authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cohort batches");
    }

    return response.json();
  } catch (error) {
    // Error fetching cohort batches
    throw error;
  }
};

// Get user's cohort ID from profile
export const getUserCohortId = async (): Promise<string | null> => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.profileId && user.profileId.cohortId) {
        return user.profileId.cohortId;
      }
    }

    // Try to fetch recent cohorts and get the selected cohort ID
    const recentCohorts = await fetchRecentCohorts();
    if (recentCohorts.success && recentCohorts.data.selectedCohortId) {
      return recentCohorts.data.selectedCohortId;
    }

    return null;
  } catch (error) {
    // Error getting user cohort ID
    return null;
  }
};

// Get cohort ID from token API (new method)
export const getCohortIdFromToken = async (): Promise<string | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    // Decode token to get user ID
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenPayload.data?._id;
    
    if (!userId) {
      throw new Error("User ID not found in token");
    }

    // Fetch recent cohorts to get the selected cohort ID
    const recentCohorts = await fetchRecentCohorts();
    if (recentCohorts.success && recentCohorts.data.selectedCohortId) {
      return recentCohorts.data.selectedCohortId;
    }

    return null;
  } catch (error) {
    // Error getting cohort ID from token
    return null;
  }
};

// Get cohort details using the nebula API
export const getCohortDetails = async (cohortId: string) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `https://api.penpencil.co/student-engagement-core/private/v1/nebula/client/${cohortId}/get-cohort`,
      {
        headers: {
          ...getCommonHeaders(),
          "authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch cohort details");
    }

    return response.json();
  } catch (error) {
    // Error fetching cohort details
    throw error;
  }
};
