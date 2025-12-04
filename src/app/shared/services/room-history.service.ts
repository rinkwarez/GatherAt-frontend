import { Injectable } from '@angular/core';
import { RoomHistoryItem } from '../../models/room-history.model';

@Injectable({
  providedIn: 'root',
})
export class RoomHistoryService {
  private readonly STORAGE_KEY = 'gatherAt_roomHistory';
  private readonly MAX_ROOMS = 10; // Keep only the 10 most recent rooms

  /**
   * Add a room to history
   */
  addRoom(room: RoomHistoryItem): void {
    const rooms = this.getRooms();

    // Remove if already exists (to update timestamp)
    const filtered = rooms.filter((r) => r.id !== room.id);

    // Add to beginning of array
    filtered.unshift(room);

    // Keep only MAX_ROOMS
    const limited = filtered.slice(0, this.MAX_ROOMS);

    this.saveRooms(limited);
  }

  /**
   * Get all rooms from history, sorted by most recent first
   */
  getRooms(): RoomHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const rooms = JSON.parse(stored) as RoomHistoryItem[];

      // Sort by createdAt descending (most recent first)
      return rooms.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error reading room history:', error);
      return [];
    }
  }

  /**
   * Delete a room from history
   */
  deleteRoom(roomId: string): void {
    const rooms = this.getRooms();
    const filtered = rooms.filter((r) => r.id !== roomId);
    this.saveRooms(filtered);
  }

  /**
   * Clear all room history
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing room history:', error);
    }
  }

  /**
   * Save rooms to localStorage
   */
  private saveRooms(rooms: RoomHistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rooms));
    } catch (error) {
      console.error('Error saving room history:', error);
    }
  }
}
