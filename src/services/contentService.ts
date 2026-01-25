import { getApiUrl, getAttachmentsApiUrl, safeFetch } from '../lib/apiConfig';

const API_BASE = "contents";

interface ContentResponse {
  success: boolean;
  data: any[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type HomeworkItem = {
  _id?: string;
  topic?: string;
  note?: string;
  actions?: string[];
  attachmentIds?: Array<{
    _id?: string;
    baseUrl?: string;
    key?: string;
    name?: string;
  }>;
};

const internalFetch = async (url: string, useAttachmentsApi: boolean = false): Promise<Response> => {
  // Get auth token from localStorage
  const token = localStorage.getItem('param_auth_token');
  if (!token) {
    throw new Error("Authentication required");
  }

  // Use the API configuration to get the correct URL
  const fullUrl = url.startsWith('http') ? url : (useAttachmentsApi ? getAttachmentsApiUrl(url) : getApiUrl(url));

  return safeFetch(fullUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

export const fetchLectures = async (batchId: string, subjectSlug: string, topicId: string, page: number = 1) => {
  const response = await internalFetch(
    `${API_BASE}?batchId=${batchId}&subjectId=${subjectSlug}&tag=${topicId}&contentType=videos&page=${page}`
  );
  if (!response.ok) throw new Error("Unable to load video lectures");
  const json: ContentResponse = await response.json();
  return json;
};

export const fetchNotes = async (batchId: string, subjectSlug: string, topicId: string, page: number = 1) => {
  const response = await internalFetch(
    `${API_BASE}?batchId=${batchId}&subjectId=${subjectSlug}&tag=${topicId}&contentType=notes&page=${page}`
  );
  if (!response.ok) throw new Error("Unable to load study notes");
  const json: ContentResponse = await response.json();
  return json;
};

export const fetchScheduleDetails = async (batchId: string, subjectSlug: string, scheduleId: string) => {
  if (!batchId || !subjectSlug || !scheduleId) return null;
  try {
    const response = await internalFetch(`/schedule-details?batchId=${batchId}&subjectId=${subjectSlug}&scheduleId=${scheduleId}`);
    if (!response.ok) return null;
    const json = await response.json();
    const data = json.data || null;
    
    // Extract DPP content if available
    if (data && data.dpp) {
      return {
        ...data,
        // Extract DPP homework items for easier processing
        dppHomeworks: data.dpp.homeworkIds || []
      };
    }
    
    return data;
  } catch {
    return null;
  }
};

export const fetchSlides = async (batchId: string, subjectId: string, scheduleId: string) => {
  if (!batchId || !subjectId || !scheduleId) return null;
  try {
    // Use the external PenPencil API directly for slides
    const token = localStorage.getItem('param_auth_token');
    if (!token) {
      throw new Error("Authentication required");
    }

    const slidesUrl = `https://api.penpencil.co/v1/batches/${batchId}/subject/${subjectId}/schedule/${scheduleId}/slides`;
    
    const response = await fetch(slidesUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': `Bearer ${token}`,
        'client-id': '5eb393ee95fab7468a79d189',
        'client-type': 'WEB',
        'client-version': '200',
        'content-type': 'application/json',
        'priority': 'u=1, i',
        'randomid': crypto.randomUUID(),
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
        'version': '0.0.1'
      },
      mode: 'cors',
      credentials: 'omit',
      referrer: 'https://www.pw.live/',
      referrerPolicy: 'strict-origin-when-cross-origin'
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    return json.data || null;
  } catch (error) {
    return null;
  }
};
