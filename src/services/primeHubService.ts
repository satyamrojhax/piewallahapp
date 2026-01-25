// PrimeHub API Service
const BASE_URL = "https://viralmmsbackend.vercel.app/api/viralmms";

// Types
export interface PrimeVideo {
  id: number;
  title: string;
  date: string;
  description: string;
  thumbnail_url: string;
  video_url: string;
  categories: number[];
  tags: number[];
  slug: string;
  link: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: string | null;
}

export interface VideosResponse {
  data: PrimeVideo[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface PaginatedVideosResult {
  videos: PrimeVideo[];
  hasNextPage: boolean;
  currentPage: number;
  totalCount: number;
  totalPages: number;
}

// Helper function for safe fetch
const safeFetch = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Fetch all videos with pagination
export const fetchPrimeVideosChunked = async (
  page: number = 1,
  limit: number = 52,
  filters?: {
    category?: number;
    tags?: number[];
    search?: string;
  }
): Promise<PaginatedVideosResult> => {
  try {
    let url = `${BASE_URL}?page=${page}&limit=${limit}`;
    
    if (filters?.category) {
      url += `&categories=${filters.category}`;
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      // For multiple tags, we might need to make multiple requests or use comma-separated
      url += `&tags=${filters.tags[0]}`; // Using first tag for now
    }
    
    if (filters?.search) {
      // The API doesn't seem to have search parameter, but we'll include it
      url += `&search=${encodeURIComponent(filters.search)}`;
    }

    const response: VideosResponse = await safeFetch(url);
    
    return {
      videos: response.data || [],
      hasNextPage: response.pagination?.has_next || false,
      currentPage: response.pagination?.current_page || page,
      totalCount: response.pagination?.total_count || 0,
      totalPages: response.pagination?.total_pages || 0,
    };
  } catch (error) {
    throw error;
  }
};

// Fetch all categories
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const url = `${BASE_URL}/categories`;
    const categories: Category[] = await safeFetch(url);
    return categories || [];
  } catch (error) {
    throw error;
  }
};

// Fetch all tags
export const fetchTags = async (): Promise<Tag[]> => {
  try {
    const url = `${BASE_URL}/tags`;
    const tags: Tag[] = await safeFetch(url);
    return tags || [];
  } catch (error) {
    throw error;
  }
};

// Fetch videos by category
export const fetchVideosByCategory = async (
  categoryId: number,
  page: number = 1,
  limit: number = 52
): Promise<PaginatedVideosResult> => {
  try {
    const url = `${BASE_URL}?categories=${categoryId}&page=${page}&limit=${limit}`;
    const response: VideosResponse = await safeFetch(url);
    
    return {
      videos: response.data || [],
      hasNextPage: response.pagination?.has_next || false,
      currentPage: response.pagination?.current_page || page,
      totalCount: response.pagination?.total_count || 0,
      totalPages: response.pagination?.total_pages || 0,
    };
  } catch (error) {
    throw error;
  }
};

// Fetch videos by tag
export const fetchVideosByTag = async (
  tagId: number,
  page: number = 1,
  limit: number = 52
): Promise<PaginatedVideosResult> => {
  try {
    const url = `${BASE_URL}?tags=${tagId}&page=${page}&limit=${limit}`;
    const response: VideosResponse = await safeFetch(url);
    
    return {
      videos: response.data || [],
      hasNextPage: response.pagination?.has_next || false,
      currentPage: response.pagination?.current_page || page,
      totalCount: response.pagination?.total_count || 0,
      totalPages: response.pagination?.total_pages || 0,
    };
  } catch (error) {
    throw error;
  }
};

// Get video by ID (if needed for individual video page)
export const getVideoById = async (videoId: number): Promise<PrimeVideo | null> => {
  try {
    // Since the API doesn't have a direct endpoint for single video,
    // we'll need to fetch all videos and find the one we need
    const response = await fetchPrimeVideosChunked(1, 100); // Fetch more videos to find the one
    const video = response.videos.find(v => v.id === videoId);
    return video || null;
  } catch (error) {
    return null;
  }
};

// Helper function to format duration (if available)
export const formatDuration = (seconds?: number): string => {
  if (!seconds) return "Unknown";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Helper function to format views (if available)
export const formatViews = (views?: number): string => {
  if (!views) return "0";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return "Unknown";
  }
};