import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  private readonly USER_ID_KEY = 'gatherat_user_id';
  private readonly DISPLAY_NAME_KEY = 'gatherat_display_name';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private userService: UserService) {
    const user = this.loadUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Get the current user ID, generate if doesn't exist
   */
  getUserId(): string {
    let userId = localStorage.getItem(this.USER_ID_KEY);

    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }

    return userId;
  }

  /**
   * Get the display name from storage
   */
  getDisplayName(): string | null {
    return localStorage.getItem(this.DISPLAY_NAME_KEY);
  }

  /**
   * Set the display name, create user in Firestore, and update current user
   */
  async setDisplayName(displayName: string): Promise<void> {
    try {
      // Create user in Firestore and get the generated ID
      const userId = await this.userService.createUser(displayName);

      // Store in localStorage
      localStorage.setItem(this.USER_ID_KEY, userId);
      localStorage.setItem(this.DISPLAY_NAME_KEY, displayName);

      // Update subject
      this.currentUserSubject.next({ userId, displayName });

      console.log('User created and stored:', { userId, displayName });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Check if user is new (no display name set)
   */
  isNewUser(): boolean {
    return !this.getDisplayName();
  }

  /**
   * Get current user (userId + displayName)
   */
  getCurrentUser(): User | null {
    const userId = this.getUserId();
    const displayName = this.getDisplayName();

    if (!displayName) {
      return null;
    }

    return { userId, displayName };
  }

  /**
   * Clear user session and delete from Firestore
   */
  async clearSession(): Promise<void> {
    const userId = this.getUserId();

    if (userId) {
      try {
        await this.userService.deleteUser(userId);
        console.log('User deleted from Firestore:', userId);
      } catch (error) {
        console.error('Error deleting user from Firestore:', error);
      }
    }

    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.DISPLAY_NAME_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Generate a unique user ID (UUID v4)
   */
  private generateUserId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): User | null {
    const userId = localStorage.getItem(this.USER_ID_KEY);
    const displayName = localStorage.getItem(this.DISPLAY_NAME_KEY);

    if (userId && displayName) {
      return { userId, displayName };
    }

    return null;
  }
}
