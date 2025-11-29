import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RoomService } from '../../../room/services/room.service';
import { LandingAnimationsService } from '../../services/landing-animations.service';
import { UserSessionService } from '../../../../core/services/user-session.service';

interface TimeOption {
  value: string;
  id: number;
}

@Component({
  selector: 'app-create-room-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-room-form.component.html',
  styleUrl: './create-room-form.component.css',
})
export class CreateRoomFormComponent {
  question = signal('');
  timezone = signal<string | null>(null);
  timeOptions = signal<TimeOption[]>([
    { value: '', id: 1 },
    { value: '', id: 2 },
  ]);
  isSubmitting = signal(false);
  errorMessage = signal('');

  private nextOptionId = 3;

  // Common timezone options
  timezones = [
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'UTC', value: 'UTC' },
    { label: 'London (GMT)', value: 'Europe/London' },
    { label: 'Paris (CET)', value: 'Europe/Paris' },
    { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Sydney (AEDT)', value: 'Australia/Sydney' },
  ];

  constructor(
    private roomService: RoomService,
    private router: Router,
    private animationsService: LandingAnimationsService,
    private userSessionService: UserSessionService
  ) {}

  /**
   * Add a new time option input
   */
  addOption(): void {
    this.timeOptions.update((options) => [...options, { value: '', id: this.nextOptionId++ }]);
  }

  /**
   * Remove a time option
   */
  removeOption(id: number): void {
    // Keep at least 1 option
    if (this.timeOptions().length <= 1) return;

    this.timeOptions.update((options) => options.filter((opt) => opt.id !== id));
  }

  /**
   * Update an option's value
   */
  updateOption(id: number, value: string): void {
    this.timeOptions.update((options) =>
      options.map((opt) => (opt.id === id ? { ...opt, value } : opt))
    );
  }

  /**
   * Validate form and create room
   */
  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    // Validate question
    if (!this.question().trim()) {
      this.errorMessage.set('Please enter a question');
      return;
    }

    // Get non-empty options
    const validOptions = this.timeOptions()
      .map((opt) => opt.value.trim())
      .filter((val) => val.length > 0);

    // Validate at least one option
    if (validOptions.length === 0) {
      this.errorMessage.set('Please add at least one time option');
      return;
    }

    try {
      this.isSubmitting.set(true);

      // Ensure user is logged in before creating room
      // If not logged in, we'll create a temporary user
      // They'll be prompted to set their name when entering the room
      let userId = this.userSessionService.getUserId();

      // If user doesn't exist in session yet, just get/generate the userId
      // They will be prompted for name when they enter the room
      if (!userId) {
        // This will generate a new userId and store it
        userId = this.userSessionService.getUserId();
      }

      // Create room with createdBy field
      const roomId = await this.roomService.createRoom(
        {
          question: this.question().trim(),
          timezone: this.timezone(),
          options: validOptions,
        },
        userId
      );

      // Navigate to room page
      await this.router.navigate(['/r', roomId]);
    } catch (error) {
      console.error('Error creating room:', error);
      this.errorMessage.set('Failed to create room. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  /**
   * Track by function for ngFor
   */
  trackByOptionId(index: number, option: TimeOption): number {
    return option.id;
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

  /**
   * Button click animation
   */
  onButtonClick(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
    this.animationsService.animateButtonClick(element);
  }
}
