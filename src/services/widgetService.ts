import { getAuthToken, getCommonHeaders } from '@/lib/auth';
import { getCohortIdFromToken } from './cohortService';
import "@/config/firebase";

const API_BASE = "https://api.penpencil.co/v3";

export type PopularBatch = {
  type: string;
  isRecommended: boolean;
  displayOrder: number;
  iconWeb: any;
  status: string;
  backgroundImageWeb: any;
  typeId: string;
  imageWeb: any;
  isNewVariant: boolean;
  data: any[];
  typeInfo: {
    _id: string;
    isCombo: boolean;
    countryGroup: string;
    type: string;
    status: string;
    exam: string[];
    displayOrder: number;
    name: string;
    startDate: string;
    endDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    slug: string;
    class: string;
    examYear: string;
    classEndDate: string;
    mode: string;
    relatedHinglishBatchId: any;
    relatedMultiLingualBatchId: any;
    subExam: string;
    targetSubject: string;
    isVernacular: boolean;
    isMultilingual: boolean;
    isHinglish: boolean;
    formId: any;
    card: any;
    config: any;
    isSPDEnabled: boolean;
    contentType: any[];
    scheduleType: string;
    videoType: string;
    comboItems: any[];
    previewImage?: {
      _id: string;
      name: string;
      baseUrl: string;
      key: string;
    };
    previewImageUrl: string;
    buyNowEnabled: boolean;
    fees?: {
      price?: number;
      total?: number;
      discount?: number;
      priceLabel?: string;
    };
    language: string;
    markedAsNew?: boolean;
    byName?: string;
    ctaText?: string;
    cohortId?: string;
    fomoIcons?: string[];
    link?: string;
  };
  previewImage?: {
    _id: string;
    name: string;
    baseUrl: string;
    key: string;
  };
  maxWalletPoints: number;
  isAvailableFromPoints: boolean;
  isBatchClubbing: boolean;
  isBatchPlusEnabled: boolean;
  masterBatchId: any;
  isSelfLearning: boolean;
  multilingualStrip: any;
  program: {
    class: string;
    exam: string[];
    language: string;
    _id: string;
  };
  isKhazanaEnabled: boolean;
  isPathshala: boolean;
  courseType: string;
  markedAsNew: boolean;
  byName: string;
  meta: any[];
  ctaText: string;
  cohortId: string;
  fomoIcons: string[];
  link: string;
};

export type WidgetResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    type: string;
    displayOrder: number;
    title: string;
    status: string;
    cohortId: string;
    createdBy: string;
    updatedBy: string;
    data: PopularBatch[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  }>;
};

export const fetchPopularBatches = async (): Promise<PopularBatch[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      // No auth token found, returning empty popular batches
      return [];
    }

    // Get cohort ID dynamically from token
    const cohortId = await getCohortIdFromToken();
    if (!cohortId) {
      // Cohort ID not found, returning empty popular batches
      return [];
    }

    const headers = {
      ...getCommonHeaders(),
    };

    const response = await fetch(`${API_BASE}/cohort/${cohortId}/widgets`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized access to widgets API, returning empty popular batches
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json() as WidgetResponse;

    if (!responseData?.success || !responseData?.data) {
      throw new Error('Failed to fetch widgets');
    }

    // Find the trending widget with popular courses
    const trendingWidget = responseData.data.find(
      widget => widget.type === 'TRENDING_WIDGET' && widget.title === 'Popular Courses'
    );

    if (!trendingWidget || !trendingWidget.data) {
      return [];
    }

    // Filter only batch items and sort by displayOrder
    return trendingWidget.data
      .filter(item => item.type === 'BATCH')
      .sort((a, b) => a.displayOrder - b.displayOrder);

  } catch (error) {
    // Error fetching popular batches
    return [];
  }
};
