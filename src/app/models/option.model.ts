import { Timestamp } from 'firebase/firestore';

export interface Option {
  id?: string;
  label: string;
  voteCount: number;
  createdAt: Timestamp;
  order: number;
}

export interface OptionWithPercentage extends Option {
  percentage: number;
  isWinner: boolean;
}
