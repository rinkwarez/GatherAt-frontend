import { OptionType, PollType } from './room.model';

export interface RoomHistoryItem {
  id: string;
  question: string;
  createdAt: string; // ISO date string for localStorage serialization
  optionType: OptionType;
  pollType: PollType;
}
