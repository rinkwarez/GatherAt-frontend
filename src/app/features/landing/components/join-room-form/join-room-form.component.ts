import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../room/services/room.service';
import { LandingAnimationsService } from '../../services/landing-animations.service';
import gsap from 'gsap';

@Component({
  selector: 'app-join-room-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-room-form.component.html',
  styleUrl: './join-room-form.component.css',
})
export class JoinRoomFormComponent {
  roomInput = signal('');
  isJoining = signal(false);
  errorMessage = signal('');

  constructor(
    private roomService: RoomService,
    private router: Router,
    private animationsService: LandingAnimationsService
  ) {}

  /**
   * Extract room ID from full URL or return the input as-is
   * Supports: http://localhost:4200/r/abc123, https://gatherat.app/r/abc123, or just abc123
   */
  private extractRoomId(input: string): string {
    const trimmed = input.trim();

    // Check if it's a URL
    if (trimmed.includes('/r/')) {
      const parts = trimmed.split('/r/');
      return parts[1]?.split('/')[0]?.split('?')[0] || '';
    }

    // Otherwise, treat it as a room ID
    return trimmed;
  }

  /**
   * Validate and join room
   */
  async onJoin(): Promise<void> {
    this.errorMessage.set('');

    const input = this.roomInput().trim();

    if (!input) {
      this.showError('Please enter a room ID or link');
      return;
    }

    const roomId = this.extractRoomId(input);

    if (!roomId) {
      this.showError('Invalid room link');
      return;
    }

    try {
      this.isJoining.set(true);

      // Check if room exists
      const exists = await this.roomService.roomExists(roomId);

      if (!exists) {
        this.showError('Room not found. Please check the ID or link.');
        this.isJoining.set(false);
        return;
      }

      // Navigate to room
      await this.router.navigate(['/r', roomId]);
    } catch (error) {
      console.error('Error joining room:', error);
      this.showError('Failed to join room. Please try again.');
      this.isJoining.set(false);
    }
  }

  /**
   * Show error with animation
   */
  private showError(message: string): void {
    this.errorMessage.set(message);

    // Animate error message
    const errorEl = document.querySelector('.error-message');
    if (errorEl) {
      gsap.fromTo(
        errorEl,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }

  /**
   * Button hover animation
   */
  onButtonHover(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    this.animationsService.animateButtonHover(element);
  }

  /**
   * Button hover out animation
   */
  onButtonHoverOut(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    this.animationsService.animateButtonHoverOut(element);
  }
}
