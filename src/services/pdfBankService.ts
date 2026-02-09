import { safeFetch } from '../lib/apiConfig';
import "@/config/firebase";

// API Types
export interface ExamCategory {
  name: string;
  level: number;
  displayOrder: number;
  type: string;
  icon: string;
  deeplink: string;
}

export interface Exam {
  exam: string;
  file: string;
  file_id: string;
  categories: ExamCategory[];
  banners: any[];
}

export interface StudyMaterialResponse {
  statusCode: number;
  data: Exam[];
  from: string;
  success: boolean;
}

export interface ChildNode {
  name: string;
  level: number;
  displayOrder: number;
  type: string;
  icon: string;
  deeplink: string;
  file?: string;
}

export interface ChildNodesResponse {
  statusCode: number;
  data: ChildNode[];
  from: string;
  success: boolean;
}

export interface NodeInfo {
  name: string;
  level: number;
  displayOrder: number;
  type: string;
  icon: string;
  deeplink: string;
}

export interface NodeInfoResponse {
  statusCode: number;
  data: NodeInfo;
  from: string;
  success: boolean;
}

// Base API configuration
const PDF_API_BASE = "https://api.penpencil.co/student-engagement-core/private/v1/study-material";

// Internal fetch function with authentication
const internalFetch = async (url: string, method: string = 'GET', body?: any): Promise<Response> => {
  // Get auth token from localStorage
  const token = localStorage.getItem('param_auth_token');
  if (!token) {
    throw new Error("Authentication required");
  }

  const headers: Record<string, string> = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'authorization': `Bearer ${token}`,
    'client-id': '5eb393ee95fab7468a79d189',
    'client-type': 'WEB',
    'content-type': 'application/json',
    'priority': 'u=1, i',
    'randomid': Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'x-sdk-version': '0.0.12'
  };

  const config: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'omit' // Fix CORS issues
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  return safeFetch(url, config);
};

// API Functions
export const fetchExamsWithCategories = async (): Promise<StudyMaterialResponse> => {
  const url = `${PDF_API_BASE}/exams-with-categories?page=1&limit=100`;
  const response = await internalFetch(url);
  
  if (!response.ok) {
    throw new Error("Unable to load exams and categories");
  }
  
  return await response.json();
};

export const fetchChildNodes = async (deeplink: string): Promise<ChildNodesResponse> => {
  const url = `${PDF_API_BASE}/get-child-nodes`;
  const response = await internalFetch(url, 'POST', { deeplink });
  
  if (!response.ok) {
    throw new Error("Unable to load child nodes");
  }
  
  return await response.json();
};

export const fetchNodeByDeeplink = async (deeplink: string): Promise<NodeInfoResponse> => {
  const url = `${PDF_API_BASE}/get-node-by-deeplink`;
  const response = await internalFetch(url, 'POST', { deeplink });
  
  if (!response.ok) {
    throw new Error("Unable to load node information");
  }
  
  return await response.json();
};

// Helper function to extract PDF URL from node
export const getPdfUrl = (node: ChildNode): string | null => {
  return node.file || null;
};

// Helper function to check if node has PDF
export const hasPdf = (node: ChildNode): boolean => {
  return !!node.file && node.file.endsWith('.pdf');
};
