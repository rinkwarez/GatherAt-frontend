import { Timestamp } from 'firebase/firestore';

export interface User {
  userId?: string;
  displayName: string;
  createdAt?: Timestamp;
}
