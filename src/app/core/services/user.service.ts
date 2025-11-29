import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { User } from '../../models/user.model';
import { doc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly USERS_COLLECTION = 'users';

  constructor(private firestoreService: FirestoreService) {}

  /**
   * Create a new user in Firestore
   * Returns the Firestore-generated user ID
   */
  async createUser(displayName: string): Promise<string> {
    const db = this.firestoreService.getFirestore();
    const userRef = doc(this.firestoreService.getCollectionRef(this.USERS_COLLECTION));
    const userId = userRef.id;

    const userData: Omit<User, 'userId'> & { createdAt: any } = {
      displayName,
      createdAt: this.firestoreService.getTimestamp(),
    };

    await this.firestoreService.setDocument(userData, this.USERS_COLLECTION, userId);
    console.log('User created with ID:', userId);

    return userId;
  }

  /**
   * Delete a user from Firestore
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.firestoreService.deleteDocument(this.USERS_COLLECTION, userId);
      console.log('User deleted:', userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const user = await this.firestoreService.getDocument<User>(this.USERS_COLLECTION, userId);
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user's display name
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    try {
      await this.firestoreService.updateDocument({ displayName }, this.USERS_COLLECTION, userId);
      console.log('User display name updated:', userId);
    } catch (error) {
      console.error('Error updating user display name:', error);
      throw error;
    }
  }
}
