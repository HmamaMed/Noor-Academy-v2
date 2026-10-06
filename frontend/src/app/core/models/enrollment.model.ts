import { SessionSlot } from './session.model';
import { GroupStatus } from './group.model';
export type EnrollmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Enrollment {
  id: number;
  groupId: number;
  groupName: string;
  courseTitle: string;
  studentId: number;
  studentName: string;
  status: EnrollmentStatus;
  appliedAt: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  groupStatus: GroupStatus;
  teacherName: string;
  roomName: string;
  startDate: string;
  endDate: string;
  sessions: SessionSlot[];
}
