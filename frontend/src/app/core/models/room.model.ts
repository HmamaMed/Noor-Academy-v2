export interface Room {
  id: number;
  name: string;
  maxCapacity: number;
}

export interface RoomRequest {
  name: string;
  maxCapacity: number;
}
