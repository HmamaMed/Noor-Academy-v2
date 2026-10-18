export interface Course {
  id: number;
  title: string;
  description: string | null;
  syllabus: string | null;
  imageUrl?: string | null;
}

export interface CourseRequest {
  title: string;
  description?: string;
  syllabus?: string;
}

export interface CourseImageSettings {
  uploadsEnabled: boolean;
  maxBytes: number;
  maxDimension: number;
}
