import { getAuthToken, getCommonHeaders } from '@/lib/auth';
import "@/config/firebase";

const NEBULA_BASE = 'https://api.penpencil.co/student-engagement-core/private/v1/nebula';
const NEBULA_V1_BASE = 'https://api.penpencil.co/v1/nebula';

// Types for AI Guru
export interface IntentType {
  title: string;
  icon: string;
  display_order: number;
  tag?: string;
  tag_expiry_time?: string;
  placeholder: string;
  onboarding_messages: OnboardingMessage[];
  type: string;
  downvote_config: DownvoteConfig[];
  exam?: string;
}

export interface OnboardingMessage {
  id: string;
  text: string;
  type: string;
  author_id: string;
  author_metadata: AuthorMetadata;
  created_at: string;
  is_question: boolean;
  display_order: number;
  sub_type: string;
  question_status: string;
  web_deep_link: string;
  app_deep_link: string;
  banner_image_url?: string;
  web_banner_image_url?: string;
}

export interface AuthorMetadata {
  first_name: string;
  last_name: string;
  profile_pic: string;
  classes?: string;
  exam?: string;
}

export interface DownvoteConfig {
  rating: number;
  options: Array<{
    text: string;
  }>;
}

export interface CohortData {
  cohort_id: string;
  source_config: {
    title: string;
    options: Array<{
      text: string;
    }>;
  };
  intent_types: IntentType[];
  enable_batch_check: boolean;
  is_ai_mentor_enabled: boolean | null;
  created_at: string | null;
  updated_at: string;
  created_by: string | null;
  updated_by: string;
  is_user_batch_enabled: string;
}

export interface Conversation {
  type: string;
  user_id: string;
  id: string;
  conversation_id: string;
  display_name: string;
  display_order: number;
  is_blocked: boolean;
  is_deleted: boolean;
  is_migrated: boolean;
  joined_at: string;
  last_message: string;
  role: string[];
  sub_type: string;
}

export interface Message {
  created_at: string;
  metadata?: any[];
  voted: any;
  conversation_id: string;
  id: string;
  admission_metadata: string;
  author_id: string;
  author_metadata: AuthorMetadata;
  bookmarked: any;
  is_deleted: boolean;
  media_url: string;
  text: string;
  tools_used?: string[];
  transcribed_text: string;
  type: string;
}

export interface MessagesResponse {
  messages: Message[];
  suggestive_questions: any[];
  next_page_token: string;
}

export interface StreamMessage {
  id: string;
  author_id: string;
  message_type: 'human' | 'ai';
  type: string;
  conversation_id: string;
  text: string;
  author_metadata: AuthorMetadata;
  created_at: string;
  chunk?: number;
}

export interface StreamEvent {
  id: string;
  event: string;
  data: any;
}

export interface StreamResponse {
  human_message: StreamMessage;
  ai_message: StreamMessage;
}

export interface StudentMetadata {
  classes: string;
  exam: string;
  first_name: string;
  last_name: string;
}

export interface SendMessagePayload {
  cohort_id: string;
  conversation_id: string;
  intent_type: string;
  student_metadata: StudentMetadata;
  text: string;
  isSuggestiveMessage: boolean;
}

// API Functions
export const fetchCohortDetails = async (cohortId: string): Promise<{ success: boolean; data: CohortData }> => {
  try {
    const response = await fetch(`${NEBULA_BASE}/client/${cohortId}/get-cohort`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cohort details");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchUserConfig = async (): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(`${NEBULA_BASE}/user-config`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user config");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchCohortNotifications = async (cohortId: string): Promise<{ success: boolean; data: any[] }> => {
  try {
    const response = await fetch(`${NEBULA_BASE}/notification/cohort/${cohortId}/list`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch cohort notifications");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchConversationList = async (type: string): Promise<{ success: boolean; data: Conversation[] }> => {
  try {
    const response = await fetch(`${NEBULA_BASE}/conversation-list?type=${type}`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch conversation list");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchMessages = async (conversationId: string, limit: number = 10, pageState?: string): Promise<{ success: boolean; data: MessagesResponse }> => {
  try {
    let url = `${NEBULA_BASE}/messages/${conversationId}?limit=${limit}`;
    if (pageState) {
      url += `&page_state=${pageState}`;
    }

    const response = await fetch(url, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const sendMessage = async (payload: SendMessagePayload): Promise<{ success: boolean; data: any }> => {
  try {
    // Send to API
    const response = await fetch(`${NEBULA_V1_BASE}/conversation`, {
      method: 'POST',
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
        "client-type": "WEB",
        "client-id": "5eb393ee95fab7468a79d189",
        "client-version": "300",
        "version": "0.0.1",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const sendMessageStream = async (
  payload: SendMessagePayload,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  try {
    const response = await fetch(`${NEBULA_V1_BASE}/stream/conversation`, {
      method: 'POST',
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
        "client-type": "WEB",
        "client-id": "5eb393ee95fab7468a79d189",
        "client-version": "300",
        "version": "0.0.1",
        "accept": "application/json, text/plain, */*",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw new Error("Failed to start stream");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEventId = '';
    let currentEventType = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        
        const match = line.match(/^id: (.+)$/);
        if (match) {
          currentEventId = match[1];
          continue;
        }

        const eventMatch = line.match(/^event: (.+)$/);
        if (eventMatch) {
          currentEventType = eventMatch[1];
          continue;
        }

        const dataMatch = line.match(/^data: (.+)$/);
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);
            onEvent({
              id: data.id || currentEventId,
              event: currentEventType || 'unknown',
              data
            });
          } catch (e) {
            throw e;
          }
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

export const submitFeedback = async (payload: any): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(`${NEBULA_V1_BASE}/feedback`, {
      method: 'POST',
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to submit feedback");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const clearConversationSession = async (conversationId: string, payload: any = {}): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(`${NEBULA_V1_BASE}/conversation/${conversationId}/clear-context`, {
      method: 'POST',
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to clear conversation session");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteMessages = async (conversationId: string, payload: any): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(`${NEBULA_V1_BASE}/conversation/${conversationId}/delete`, {
      method: 'PUT',
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to delete messages");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const getFeedbackOptions = async (rateType: string): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await fetch(`${NEBULA_V1_BASE}/feedback-ratings?rate_type=${rateType}`, {
      headers: {
        ...getCommonHeaders(),
        "authorization": `Bearer ${getAuthToken()}`,
        "randomid": crypto.randomUUID(),
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch feedback options");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};


// Utility function to get user metadata from localStorage
export const getUserMetadata = (): StudentMetadata => {
  const userData = localStorage.getItem('user_data');
  if (!userData) {
    return {
      classes: '',
      exam: '',
      first_name: '',
      last_name: ''
    };
  }

  const user = JSON.parse(userData);
  return {
    classes: user.classes || '',
    exam: user.exam || '',
    first_name: user.firstName || user.first_name || '',
    last_name: user.lastName || user.last_name || ''
  };
};
