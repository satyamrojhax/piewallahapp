import { getAuthToken, getCommonHeaders } from "@/lib/auth";

const FAQ_API_BASE = "https://api.penpencil.co";

export interface FAQ {
  _id: string;
  title: string;
  description: string;
  organizationId: string;
  status: string;
  displayOrder: number;
  categoryId: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface FAQResponse {
  statusCode: number;
  data: FAQ[];
  success: boolean;
  paginate: {
    totalCount: number;
    limit: number;
  };
}

// Fetch FAQs for a specific category
export const fetchFAQs = async (categoryId: string = "68ad9b038a0ac4125954148a"): Promise<FAQResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${FAQ_API_BASE}/v1/faq-category/${categoryId}/list`,
      {
        headers: {
          ...getCommonHeaders(),
          "authorization": `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch FAQs");
    }

    return response.json();
  } catch (error) {
    // Error fetching FAQs
    throw error;
  }
};
