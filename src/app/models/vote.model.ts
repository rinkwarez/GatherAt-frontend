import { Timestamp } from 'firebase/firestore';

export interface Vote {
  optionIds: string[]; // Array of option IDs (supports both single and multiple select)
  displayName: string;
  votedAt: Timestamp;
}
