import { fetchLectures, fetchNotes, fetchScheduleDetails } from "./contentService";
import "@/config/firebase";

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
  paginate?: {
    limit: number;
    totalCount: number;
    videosCount?: number;
  };
}

export type Lecture = {
  _id: string;
  image?: string;
  topic?: {
    _id?: string;
    name?: string;
  };
  duration?: number;
  createdAt?: string;
  title?: string;
  name?: string;
  fileName?: string;
  displayName?: string;
  findKey?: string;
};

export type Note = {
  _id: string;
  topic?: string | {
    _id?: string;
    name?: string;
  };
  baseUrl?: string;
  key?: string;
  date?: string;
  title?: string;
  name?: string;
  fileName?: string;
  displayName?: string;
  homeworkIds?: Array<{
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
  }>;
};

export type DPPContent = {
  _id: string;
  topic?: string | {
    _id?: string;
    name?: string;
  };
  date?: string;
  title?: string;
  name?: string;
  fileName?: string;
  displayName?: string;
  homeworkIds?: Array<{
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
  }>;
  baseUrl?: string;
  key?: string;
};

export const fetchLecturesChunked = async (
  batchId: string, 
  subjectSlug: string, 
  topicId: string, 
  page: number = 1, 
  limit: number = 12
): Promise<{
  lectures: Lecture[];
  total: number;
  hasMore: boolean;
  page: number;
}> => {
  try {
    const response = await fetchLectures(batchId, subjectSlug, topicId, page);
    const lectures = response.data as Lecture[];
    
    // Handle both pagination and paginate properties using type assertion
    const responseAny = response as any;
    const pagination = responseAny.pagination || responseAny.paginate;
    const total = pagination?.totalCount || pagination?.totalItems || lectures.length;
    const itemsPerPage = pagination?.limit || limit;
    const totalPages = Math.ceil(total / itemsPerPage);
    const hasMore = page < totalPages;

    return {
      lectures,
      total,
      hasMore,
      page,
    };
  } catch (error) {
    // Error fetching lectures chunk
    return {
      lectures: [],
      total: 0,
      hasMore: false,
      page,
    };
  }
};

export const fetchNotesChunked = async (
  batchId: string, 
  subjectSlug: string, 
  topicId: string, 
  page: number = 1, 
  limit: number = 12
): Promise<{
  notes: Note[];
  total: number;
  hasMore: boolean;
  page: number;
}> => {
  try {
    const response = await fetchNotes(batchId, subjectSlug, topicId, page);
    
    // Extract individual homework items from each data object
    const allData = response.data as any[];
    const extractedNotes: Note[] = [];
    allData.forEach((item: any, itemIndex: number) => {
      if (item.homeworkIds && Array.isArray(item.homeworkIds)) {
        // Create individual note items from homeworkIds
        item.homeworkIds.forEach((homework: any, index: number) => {
          // Extract baseUrl and key from attachmentIds
          let baseUrl = "";
          let key = "";

          if (homework.attachmentIds && homework.attachmentIds.length > 0) {
            const att = homework.attachmentIds[0];
            baseUrl = att?.baseUrl || "";
            // Key might be in 'key' field
            key = att?.key || "";
          }

          const noteItem = {
            _id: `${item._id}-note-${index}`, // Create unique ID for each homework
            topic: homework.topic,
            date: item.date,
            title: homework.topic,
            name: homework.topic,
            fileName: homework.note,
            displayName: homework.topic,
            homeworkIds: [homework], // Keep the individual homework
            baseUrl: baseUrl,
            key: key
          };
          extractedNotes.push(noteItem);
        });
      } else {
        // If no homeworkIds, add the item as is
        extractedNotes.push(item as Note);
      }
    });

    // Handle both pagination and paginate properties using type assertion
    const responseAny = response as any;
    const pagination = responseAny.pagination || responseAny.paginate;
    const total = pagination?.totalCount || pagination?.totalItems || extractedNotes.length;
    const itemsPerPage = pagination?.limit || limit;
    const totalPages = Math.ceil(total / itemsPerPage);
    const hasMore = page < totalPages;

    return {
      notes: extractedNotes,
      total,
      hasMore,
      page,
    };
  } catch (error) {
    // Error fetching notes chunk
    return {
      notes: [],
      total: 0,
      hasMore: false,
      page,
    };
  }
};
