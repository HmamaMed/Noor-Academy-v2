export interface Course {
  id: number;
  title: string;
  description: string | null;
  syllabus: string | null;
  imageUrl?: string | null;
  price?: number | null;
  totalSessions?: number | null;
}

export interface CourseRequest {
  title: string;
  description?: string;
  syllabus?: string;
  price?: number | null;
  totalSessions?: number | null;
}

export interface CourseImageSettings {
  uploadsEnabled: boolean;
  maxBytes: number;
  maxDimension: number;
}
