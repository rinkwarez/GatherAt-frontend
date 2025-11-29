import { Timestamp } from 'firebase/firestore';

export interface Vote {
  optionId: string;
  displayName: string;
  votedAt: Timestamp;
}
