import { safeFetch } from "@/lib/apiConfig";
import { getCommonHeaders } from "@/lib/auth";

export interface Notification {
  _id: string;
  batchId: string;
  type: string;
  announcement: string;
  isSentNotification: boolean;
  isRealTime: boolean;
  createdBy: any;
  isParentAnnouncement: boolean;
  isStudentAnnouncement: boolean;
  organizationId: string;
  linkedBatchIds: string[];
  heading: string;
  scheduleTime: string;
  createdAt: string;
  updatedAt: string;
  attachment?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
    type: string;
    createdAt: string;
    status: string;
  };
  created: string;
}

export const fetchNotifications = async (batchId: string = "6960d1d20549bb69d7d7e872"): Promise<Notification[]> => {
  const authToken = localStorage.getItem("param_auth_token");
  if (!authToken) {
    return [];
  }

  try {
    const response = await safeFetch(`https://api.penpencil.co/v1/batches/${batchId}/announcement?page=1&limit=100`, {
      method: 'GET',
      headers: {
        ...getCommonHeaders(),
        'authorization': `Bearer ${authToken}`,
        'client-version': '1.0.0',
        'referer': 'https://www.pw.live/',
        'origin': 'https://www.pw.live'
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return [];
  }
};
