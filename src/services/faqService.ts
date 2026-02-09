import { getAuthToken, getCommonHeaders } from "@/lib/auth";
import { safeFetch } from "@/lib/apiConfig";
import "@/config/firebase";

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

// Fetch FAQs for a specific batch
export const fetchFAQs = async (batchId: string): Promise<FAQResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    if (!batchId) {
      throw new Error("Batch ID is required");
    }

    // Fetch batch details to get FAQ category
    const batchResponse = await safeFetch(
      `https://api.penpencil.co/v3/batches/${batchId}/details?type=EXPLORE_LEAD`
    );
    
    if (!batchResponse.ok) {
      throw new Error("Failed to fetch batch details for FAQ category");
    }
    
    const batchData = await batchResponse.json();
    
    // Extract FAQ category ID from batch data
    const categoryId = batchData.data?.faqCat;
    
    if (!categoryId) {
      throw new Error("No FAQ category found for this batch");
    }

    const response = await safeFetch(
      `${FAQ_API_BASE}/v1/faq-category/${categoryId}/list`
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
