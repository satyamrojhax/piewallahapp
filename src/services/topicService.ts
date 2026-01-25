import { getApiUrl, safeFetch } from '../lib/apiConfig';

export type Topic = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  lectureVideos?: number | unknown[];
  notes?: number | unknown[];
  exercises?: number | unknown[];
  DppVideos?: number | unknown[];
  DppNotes?: number | unknown[];
  icon?: string;
  thumbnail?: string;
  order?: number;
  isFree?: boolean;
  isLocked?: boolean;
  status?: string;
};

type ApiResponse = {
  success: boolean;
  topics?: Topic[];
  data?: Topic[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  paginate?: {
    limit: number;
    totalCount: number;
    videosCount?: number;
  };
};

export const fetchTopicsChunked = async (batchId: string, subjectId: string, page: number = 1, limit: number = 12): Promise<{
  topics: Topic[];
  total: number;
  hasMore: boolean;
  page: number;
}> => {
  try {
    const token = localStorage.getItem('param_auth_token');
    if (!token) {
      throw new Error("Authentication required - Please login first");
    }

    const url = getApiUrl(`/topics`, {
      batchId,
      subjectId,
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await safeFetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch topics (${response.status})`);
    }
    
    const json: ApiResponse = await response.json();
    const topics = json.data || json.topics || [];
    const pagination = json.paginate;
    
    const total = pagination?.totalCount || topics.length;
    const itemsPerPage = pagination?.limit || limit;
    const totalPages = Math.ceil(total / itemsPerPage);
    const hasMore = page < totalPages;

    return {
      topics,
      total,
      hasMore,
      page,
    };
  } catch (error) {
    // Error fetching topics chunk
    return {
      topics: [],
      total: 0,
      hasMore: false,
      page,
    };
  }
};
