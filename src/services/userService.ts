import { getAuthToken, getCommonHeaders } from '@/lib/auth';

const API_BASE = "https://api.penpencil.co/v1";
const AUTH_BASE = "https://api.penpencil.co/v3";
const ENGAGEMENT_BASE = "https://api.penpencil.co/student-engagement-core/private/v1";

export type UserProfile = {
  status: string;
  id: string;
  firstName: string;
  lastName: string;
  primaryNumber: string;
  countryCode: string;
  username: string;
  email: string;
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
};

export type UserProfileInfo = {
  success: boolean;
  data: {
    cohortId?: string;
    exams?: string[];
    class?: string;
    stream?: string;
    language?: string;
    board?: string;
  };
};

export type UserConfig = {
  statusCode: number;
  data: {
    is_enabled: boolean;
    is_existing: boolean;
    is_onboarded: boolean;
    experiments: Array<{
      user_id: string;
      experiment: string;
      created_at: string;
      enabled_at: string;
      is_enabled: boolean;
    }>;
  };
  from: string;
  success: boolean;
};

export type ExchangeTokenResponse = {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    tokenId: string;
    user: UserProfile;
  };
  dataFrom: string;
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
      "client-id": "5eb393ee95fab7468a79d189",
      "client-type": "WEB",
      "x-sdk-version": "0.0.12",
      "randomid": crypto.randomUUID(),
      ...options?.headers,
    },
  });
};

export const fetchUserProfile = async (): Promise<{ success: boolean; data: UserProfile }> => {
  try {
    const response = await internalFetch(`${AUTH_BASE}/oauth/profile`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchUserProfileInfo = async (): Promise<UserProfileInfo> => {
  try {
    const response = await internalFetch(`${API_BASE}/users/user-profile-info?fields=cohortId%2Cexams%2Cclass%2Cstream%2Clanguage%2Cboard`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch user profile info");
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchUserConfig = async (): Promise<UserConfig> => {
  try {
    const response = await internalFetch(`${ENGAGEMENT_BASE}/nebula/user-config`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch user config");
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const exchangeToken = async (): Promise<ExchangeTokenResponse> => {
  try {
    const response = await internalFetch(`${AUTH_BASE}/oauth/exchange-token`);
    
    if (!response.ok) {
      throw new Error("Failed to exchange token");
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const updateUserCohort = async (cohortData: {
  exam?: string;
  class?: string;
  board?: string;
  stream?: string;
}): Promise<{ success: boolean }> => {
  try {
    const response = await internalFetch(`${API_BASE}/users/update-cohort`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(cohortData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to update user cohort");
    }
    
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const getUserCohortId = async (): Promise<string | null> => {
  try {
    // First try localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.profileId && user.profileId.cohortId) {
        return user.profileId.cohortId;
      }
    }

    // Try to get from profile info API
    try {
      const profileInfo = await fetchUserProfileInfo();
      if (profileInfo.success && profileInfo.data && profileInfo.data.cohortId) {
        // Store cohortId in user data for future use
        const existingUserData = userData ? JSON.parse(userData) : {};
        existingUserData.profileId = existingUserData.profileId || {};
        existingUserData.profileId.cohortId = profileInfo.data.cohortId;
        localStorage.setItem('user_data', JSON.stringify(existingUserData));
        return profileInfo.data.cohortId;
      }
    } catch (error) {
    }

    // Try to get from exchange token API
    try {
      const tokenResponse = await exchangeToken();
      if (tokenResponse.success && tokenResponse.data.user && tokenResponse.data.user.profileId && tokenResponse.data.user.profileId.cohortId) {
        // Store cohortId in user data
        const existingUserData = userData ? JSON.parse(userData) : {};
        existingUserData.profileId = existingUserData.profileId || {};
        existingUserData.profileId.cohortId = tokenResponse.data.user.profileId.cohortId;
        localStorage.setItem('user_data', JSON.stringify(existingUserData));
        return tokenResponse.data.user.profileId.cohortId;
      }
    } catch (error) {
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const getUserClassesFromProfile = async (): Promise<UserClassSelection | null> => {
  try {
    // First try to get from localStorage for immediate response
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      const profileId = user.profileId;

      if (profileId) {
        const selection = createSelectionFromProfile(profileId);
        if (selection) return selection;
      }
    }

    // If not in localStorage or incomplete, fetch from API
    try {
      // Try profile info first (most efficient)
      const profileInfo = await fetchUserProfileInfo();
      if (profileInfo.success && profileInfo.data) {
        const selection = createSelectionFromProfileInfo(profileInfo.data);
        if (selection) return selection;
      }
    } catch (profileInfoError) {
    }

    // Fallback to exchange token API
    try {
      const tokenResponse = await exchangeToken();
      if (tokenResponse.success && tokenResponse.data.user) {
        const selection = createSelectionFromProfile(tokenResponse.data.user.profileId);
        if (selection) return selection;
      }
    } catch (tokenError) {
    }

    return null;
  } catch (error) {
    return null;
  }
};

const createSelectionFromProfile = (profileId: any): UserClassSelection | null => {
  if (!profileId) return null;

  const selection: UserClassSelection = {
    path: []
  };

  // Extract class information from profile
  if (profileId.class) {
    selection.class = profileId.class;
  }

  if (profileId.board) {
    selection.board = profileId.board;
  }

  if (profileId.exams && profileId.exams.length > 0) {
    selection.exam = profileId.exams[0]; // Take first exam
  }

  // Create path from profile data
  if (selection.class) {
    selection.path.push({
      id: 'class',
      name: `Class ${selection.class}`,
      type: 'CLASS',
      value: selection.class
    });
  }

  if (selection.board) {
    selection.path.push({
      id: 'board',
      name: selection.board,
      type: 'BOARD',
      value: selection.board
    });
  }

  if (selection.exam) {
    selection.path.push({
      id: 'exam',
      name: selection.exam,
      type: 'EXAM',
      value: selection.exam
    });
  }

  return selection;
};

const createSelectionFromProfileInfo = (profileInfo: UserProfileInfo['data']): UserClassSelection | null => {
  if (!profileInfo) return null;

  const selection: UserClassSelection = {
    path: []
  };

  // Extract class information from profile info
  if (profileInfo.class) {
    selection.class = profileInfo.class;
  }

  if (profileInfo.board) {
    selection.board = profileInfo.board;
  }

  if (profileInfo.exams && profileInfo.exams.length > 0) {
    selection.exam = profileInfo.exams[0]; // Take first exam
  }

  if (profileInfo.stream) {
    selection.stream = profileInfo.stream;
  }

  // Create path from profile data
  if (selection.class) {
    selection.path.push({
      id: 'class',
      name: `Class ${selection.class}`,
      type: 'CLASS',
      value: selection.class
    });
  }

  if (selection.board) {
    selection.path.push({
      id: 'board',
      name: selection.board,
      type: 'BOARD',
      value: selection.board
    });
  }

  if (selection.exam) {
    selection.path.push({
      id: 'exam',
      name: selection.exam,
      type: 'EXAM',
      value: selection.exam
    });
  }

  if (selection.stream) {
    selection.path.push({
      id: 'stream',
      name: selection.stream,
      type: 'STREAM',
      value: selection.stream
    });
  }

  return selection;
};

export const saveUserClassSelection = (selection: UserClassSelection): void => {
  try {
    localStorage.setItem('user_class_selection', JSON.stringify(selection));
  } catch (error) {
  }
};

export const getUserClassSelection = async (): Promise<UserClassSelection | null> => {
  try {
    // First try to get from localStorage
    const stored = localStorage.getItem('user_class_selection');
    if (stored) {
      return JSON.parse(stored);
    }

    // If not in localStorage, try to get from user profile (async)
    return await getUserClassesFromProfile();
  } catch (error) {
    return null;
  }
};

export const hasUserSelectedClasses = async (): Promise<boolean> => {
  const selection = await getUserClassSelection();
  return selection !== null;
};

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

// Utility function to refresh user data from all available sources
export const refreshUserData = async (): Promise<{
  profile?: UserProfile;
  profileInfo?: UserProfileInfo['data'];
  config?: UserConfig['data'];
  tokenResponse?: ExchangeTokenResponse['data'];
}> => {
  const results: any = {};

  try {
    // Try to get profile info (most efficient)
    try {
      results.profileInfo = (await fetchUserProfileInfo()).data;
    } catch (error) {
    }

    // Try to get full profile
    try {
      results.profile = (await fetchUserProfile()).data;
    } catch (error) {
    }

    // Try to get user config
    try {
      results.config = (await fetchUserConfig()).data;
    } catch (error) {
    }

    // Try to exchange token (most comprehensive)
    try {
      results.tokenResponse = (await exchangeToken()).data;
    } catch (error) {
    }

    return results;
  } catch (error) {
    return results;
  }
};
