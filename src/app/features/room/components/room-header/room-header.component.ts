import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-room-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-header.component.html',
  styleUrl: './room-header.component.css',
})
export class RoomHeaderComponent {
  @Input() question: string = '';
  @Input() roomId: string = '';

  private router = inject(Router);
  private toastService = inject(ToastService);

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Copy room ID to clipboard
   */
  async copyRoomId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.roomId);
      this.toastService.success('Room ID copied! 📋');
    } catch (error) {
      console.error('Failed to copy room ID:', error);
      this.toastService.error('Failed to copy room ID');
    }
  }

  /**
   * Copy full room link to clipboard
   */
  async copyRoomLink(): Promise<void> {
    try {
      const roomLink = `${window.location.origin}/r/${this.roomId}`;
      await navigator.clipboard.writeText(roomLink);
      this.toastService.success('Link copied! Send it to your friends 🎉');
    } catch (error) {
      console.error('Failed to copy room link:', error);
      this.toastService.error('Failed to copy link');
    }
  }
}
