export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface SessionSlot {
  id?: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
}
