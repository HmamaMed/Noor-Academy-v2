export interface Course {
  id: number;
  title: string;
  description: string | null;
  syllabus: string | null;
}

export interface CourseRequest {
  title: string;
  description?: string;
  syllabus?: string;
}
