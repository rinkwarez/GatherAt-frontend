import { Timestamp } from 'firebase/firestore';

export enum RoomStatus {
  Paused = 'Paused',
  InProgress = 'InProgress',
  Ended = 'Ended',
}

export enum OptionType {
  Text = 'Text',
  Time = 'Time',
  TimeRange = 'TimeRange',
}

export interface Room {
  id?: string;
  question: string;
  timezone: string | null;
  participants: string[]; // Array of display names
  createdBy: string; // User ID of the creator
  status?: RoomStatus; // Status of the polling (optional for backward compatibility)
  optionType: OptionType; // Type of options in this room
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateRoomData {
  question: string;
  timezone: string | null;
  options: string[];
  optionType: OptionType;
}
