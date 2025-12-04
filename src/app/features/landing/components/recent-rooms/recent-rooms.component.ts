import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoomHistoryService } from '../../../../shared/services/room-history.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { LandingAnimationsService } from '../../services/landing-animations.service';
import { RoomHistoryItem } from '../../../../models/room-history.model';
import { OptionType, PollType } from '../../../../models/room.model';

@Component({
  selector: 'app-recent-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-rooms.component.html',
  styleUrl: './recent-rooms.component.css',
})
export class RecentRoomsComponent implements OnInit, AfterViewInit {
  rooms = signal<RoomHistoryItem[]>([]);

  // Expose enums to template
  readonly OptionType = OptionType;
  readonly PollType = PollType;

  constructor(
    private roomHistoryService: RoomHistoryService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private animationsService: LandingAnimationsService
  ) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  ngAfterViewInit(): void {
    // Animate recent rooms after a delay to appear after hero section
    this.animationsService.animateRecentRooms();
  }

  /**
   * Load rooms from localStorage
   */
  loadRooms(): void {
    const rooms = this.roomHistoryService.getRooms();
    this.rooms.set(rooms);
  }

  /**
   * Open a room
   */
  openRoom(roomId: string): void {
    this.router.navigate(['/r', roomId]);
  }

  /**
   * Delete a room from history with confirmation
   */
  async deleteRoom(room: RoomHistoryItem, event: Event): Promise<void> {
    // Prevent triggering the parent click event
    event.stopPropagation();

    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Room',
      message: `Remove "${room.question}" from your history?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      this.roomHistoryService.deleteRoom(room.id);
      this.loadRooms();
    }
  }

  /**
   * Get formatted date
   */
  getFormattedDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  /**
   * Get poll type label
   */
  getPollTypeLabel(pollType: PollType): string {
    return pollType === PollType.SS ? 'Single' : 'Multiple';
  }

  /**
   * Get poll type icon
   */
  getPollTypeIcon(pollType: PollType): string {
    return pollType === PollType.SS ? '⭕' : '☑️';
  }

  /**
   * Get option type icon
   */
  getOptionTypeIcon(optionType: OptionType): string {
    switch (optionType) {
      case OptionType.Text:
        return '📝';
      case OptionType.Time:
        return '🕐';
      case OptionType.TimeRange:
        return '⏱️';
      default:
        return '📝';
    }
  }
}
