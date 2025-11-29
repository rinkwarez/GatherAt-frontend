import { Component, signal, inject, effect } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { UserSessionService } from './core/services/user-session.service';
import { RoomService } from './features/room/services/room.service';
import { VoteService } from './features/room/services/vote.service';
import { RoomStatus } from './models/room.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('gatherAt');
  protected readonly isLoggedIn = signal(false);

  constructor(
    private userSessionService: UserSessionService,
    private router: Router,
    private roomService: RoomService,
    private voteService: VoteService
  ) {
    // Check if user is logged in on init
    this.isLoggedIn.set(!!this.userSessionService.getDisplayName());

    // Subscribe to user session changes to update isLoggedIn reactively
    this.userSessionService.currentUser$.subscribe((user) => {
      this.isLoggedIn.set(!!user?.displayName);
    });
  }

  /**
   * Logout - remove vote, leave room, delete user from Firestore, and reload
   */
  async logout(): Promise<void> {
    if (confirm('This will clear your name and vote. Continue?')) {
      const displayName = this.userSessionService.getDisplayName();
      const userId = this.userSessionService.getUserId();

      // Check if user is currently in a room
      const currentUrl = this.router.url;
      const roomMatch = currentUrl.match(/\/r\/([^\/\?]+)/);

      if (roomMatch && displayName && userId) {
        const roomId = roomMatch[1];
        try {
          // Check room status first
          const room = await this.roomService.roomExists(roomId);
          if (room) {
            // Get room data to check status
            const roomData = await new Promise((resolve) => {
              const subscription = this.roomService.getRoom(roomId).subscribe((roomData) => {
                subscription.unsubscribe();
                resolve(roomData);
              });
            });

            // Only remove vote and leave if voting hasn't ended
            if (roomData && (roomData as any).status !== RoomStatus.Ended) {
              // Remove vote first
              await this.voteService.removeUserVote(roomId, userId);
              console.log('Removed vote before logout');

              // Then leave room
              await this.roomService.leaveRoom(roomId, displayName);
              console.log('Left room before logout');
            } else {
              console.log('Room voting has ended - skipping cleanup');
            }
          }
        } catch (error) {
          console.error('Error cleaning up on logout:', error);
        }
      }

      // Clear session (deletes user from Firestore and localStorage)
      await this.userSessionService.clearSession();
      window.location.reload();
    }
  }
}
