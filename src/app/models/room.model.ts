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

export enum PollType {
  SS = 'SS', // Single Select
  MS = 'MS', // Multiple Select
}

export interface Room {
  id?: string;
  question: string;
  timezone: string | null;
  participants: string[]; // Array of display names
  createdBy: string; // User ID of the creator
  status?: RoomStatus; // Status of the polling (optional for backward compatibility)
  optionType: OptionType; // Type of options in this room
  pollType?: PollType; // Single or Multiple select (optional for backward compatibility)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateRoomData {
  question: string;
  timezone: string | null;
  options: string[];
  optionType: OptionType;
  pollType: PollType;
}
