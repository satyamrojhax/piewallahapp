import { getAuthToken } from "@/lib/auth";
import "@/config/firebase";

const BASE_URL = "https://pw-api-gate.penpencil.co/v3/community";

export interface CommunityChannel {
  _id: string;
  name: string;
  type: "forum" | "feed";
  order: number;
  is_public: boolean;
  userId: string;
  batchIds: string[];
  is_hide: boolean;
  is_scholar: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CommunityUser {
  _id: string;
  name: string;
  profileImage: string;
  roles: string[];
  isGloballyBlocked?: boolean;
  firstName?: string;
  lastName?: string;
  imageId?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
    organization: string;
    createdAt: string;
  };
}

export interface PostAttachment {
  type: string;
  url: string;
  FileSize?: string;
}

export interface CommunityPost {
  _id: string;
  user_id: string;
  description: string;
  reported_by: string[];
  isHidden: boolean;
  total_likes: number;
  total_comments: number;
  total_reports: number;
  attachmentUrls: PostAttachment[];
  video_link: string;
  Post_type: string;
  post_status: string;
  channel_id: string;
  batch_id: string;
  is_comments_allowed: boolean;
  is_notification_sent: boolean;
  pinned: boolean;
  reactions: {
    heart: number;
    smile: number;
    laugh: number;
    like: number;
    fire: number;
  };
  post_reactions: {
    heart: number;
    smile: number;
    laugh: number;
    like: number;
    fire: number;
  };
  totalUniqueViews: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  isOwnedBySelf: boolean;
  hasReported: boolean;
  followed: boolean;
  self_reaction: string | null;
  views: number[];
  viewed: boolean;
  user: CommunityUser;
}

export interface PostsResponse {
  success: boolean;
  statusCode: number;
  data: {
    posts: CommunityPost[];
    count: number;
    hasNextPage: boolean;
  };
}

export interface ChannelsResponse {
  success: boolean;
  statusCode: number;
  data: CommunityChannel[];
}

export interface PaginatedPostsResult {
  posts: CommunityPost[];
  hasNextPage: boolean;
  currentPage: number;
  totalCount: number;
}

export interface Comment {
  _id: string;
  isEdited: boolean;
  isVerified: boolean;
  displayOrder: number;
  satisfactoryRate: number;
  reportCount: number;
  downVoteCount: number;
  upVoteCount: number;
  childCommentCount: number;
  status: string;
  createdBy: CommunityUser;
  creatorRoleDetails: string;
  typeId: string;
  type: string;
  text: string;
  createdAt: string;
  rated: number;
  parentId?: string;
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
  dataFrom: string;
}

export const fetchCommunityChannels = async (batchId: string): Promise<CommunityChannel[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`${BASE_URL}/channels/batch/${batchId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community channels: ${response.statusText}`);
    }

    const data: ChannelsResponse = await response.json();
    return data.data;
  } catch (error) {
    // Error fetching community channels
    throw error;
  }
};

export const fetchCommunityPosts = async (
  channelId: string,
  page: number = 1,
  timestamp?: number
): Promise<PostsResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const currentTimestamp = timestamp || Date.now();
    const url = `${BASE_URL}/posts/v2?channelId=${channelId}&page=${page}&timestamp=${currentTimestamp}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community posts: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Error fetching community posts
    throw error;
  }
};

export const fetchCommunityPostsWithPagination = async (
  channelId: string,
  page: number = 1
): Promise<PaginatedPostsResult> => {
  try {
    const response = await fetchCommunityPosts(channelId, page);
    
    return {
      posts: response.data.posts,
      hasNextPage: response.data.hasNextPage,
      currentPage: page,
      totalCount: response.data.count
    };
  } catch (error) {
    // Error fetching paginated community posts
    throw error;
  }
};

export const fetchUserProfile = async (teacherId?: string): Promise<CommunityUser> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const url = teacherId 
      ? `${BASE_URL}/users/profile?teacherId=${teacherId}`
      : `${BASE_URL}/users/profile`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // Error fetching user profile
    throw error;
  }
};

export const fetchPostComments = async (
  postId: string,
  limit: number = 10,
  skip: number = 0
): Promise<CommentsResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`https://api.penpencil.co/v1/comments/${postId}?type=COMMUNITY&limit=${limit}&skip=${skip}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch post comments: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Error fetching post comments
    throw error;
  }
};

export const fetchCommentReplies = async (
  postId: string,
  parentId: string,
  limit: number = 3,
  skip: number = 0
): Promise<CommentsResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(`https://api.penpencil.co/v1/comments/${postId}?type=COMMUNITY&parentId=${parentId}&limit=${limit}&skip=${skip}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comment replies: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Error fetching comment replies
    throw error;
  }
};
