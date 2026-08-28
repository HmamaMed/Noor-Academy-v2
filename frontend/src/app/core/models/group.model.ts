import { SessionSlot } from './session.model';

export type GroupStatus = 'DRAFT' | 'ACTIVE' | 'FULL' | 'COMPLETED' | 'CANCELLED';

export interface Group {
  id: number;
  courseId: number;
  courseTitle: string;
  teacherId: number;
  teacherName: string;
  roomId: number;
  roomName: string;
  roomCapacity: number;
  groupName: string;
  startDate: string;
  endDate: string;
  status: GroupStatus;
  sessions: SessionSlot[];
  confirmedSeats: number;
  remainingSeats: number;
}

export interface GroupRequest {
  courseId: number;
  teacherId: number;
  roomId: number;
  groupName: string;
  startDate: string;
  endDate: string;
  sessions: SessionSlot[];
}
