import { Group } from './group.model';
export type MaterialType = 'LESSON' | 'EXERCISE' | 'CORRECTION' | 'OTHER';
export interface Material {
  id: number;
  groupId: number;
  title: string;
  description: string | null;
  type: MaterialType;
  externalUrl: string | null;
  hasFile: boolean;
  fileName: string | null;
  fileSize: number | null;
  authorName: string;
  createdAt: string;
}
export interface Workspace {
  group: Group;
  canManage: boolean;
  uploadsEnabled: boolean;
  materials: Material[];
}
export interface MaterialRequest {
  title: string;
  description: string;
  type: MaterialType;
  externalUrl: string;
}
