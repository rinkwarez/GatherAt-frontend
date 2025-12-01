import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionWithPercentage } from '../../../../models/option.model';
import { RoomAnimationsService } from '../../services/room-animations.service';
import { OptionType } from '../../../../models/room.model';
import gsap from 'gsap';

@Component({
  selector: 'app-option-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './option-card.component.html',
  styleUrl: './option-card.component.css',
})
export class OptionCardComponent implements OnChanges {
  @Input() option!: OptionWithPercentage;
  @Input() index: number = 0;
  @Input() userVote: string | null = null; // The optionId the user voted for
  @Input() isVoting: boolean = false;
  @Input() optionType: OptionType = OptionType.Text;
  @Output() vote = new EventEmitter<string>();

  private previousVoteCount: number = 0;
  private previousIsWinner: boolean = false;
  private previousPercentage: number = 0;

  constructor(private elementRef: ElementRef, private animationsService: RoomAnimationsService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Skip on first initialization
    if (!changes['option'] || changes['option'].firstChange) {
      this.previousVoteCount = this.option?.voteCount || 0;
      this.previousIsWinner = this.option?.isWinner || false;
      this.previousPercentage = this.option?.percentage || 0;
      return;
    }

    const card = this.elementRef.nativeElement.querySelector('.option-card');
    const voteCountElement = this.elementRef.nativeElement.querySelector('.count');
    const progressBar = this.elementRef.nativeElement.querySelector('.progress-bar');

    if (!card || !this.option) return;

    // Animate vote count changes
    if (this.option.voteCount !== this.previousVoteCount && voteCountElement) {
      this.animationsService.animateVoteCountChange(voteCountElement);
    }

    // Animate progress bar changes
    if (this.option.percentage !== this.previousPercentage && progressBar) {
      this.animationsService.animateProgressBar(progressBar, this.option.percentage);
    }

    // Animate winner status changes
    if (this.option.isWinner && !this.previousIsWinner) {
      // Became winner
      this.animationsService.animateWinnerHighlight(card);
    } else if (!this.option.isWinner && this.previousIsWinner) {
      // Lost winner status
      this.animationsService.animateWinnerRemoval(card);
    }

    // Update previous values
    this.previousVoteCount = this.option.voteCount;
    this.previousIsWinner = this.option.isWinner;
    this.previousPercentage = this.option.percentage;
  }

  /**
   * Check if this option is the user's current vote
   */
  get isUserVote(): boolean {
    return this.userVote === this.option.id;
  }

  /**
   * Format label based on option type
   */
  get formattedLabel(): string {
    if (this.optionType === OptionType.Text) {
      return this.option.label;
    } else if (this.optionType === OptionType.Time) {
      return this.formatDateTime(this.option.label);
    } else if (this.optionType === OptionType.TimeRange) {
      return this.formatTimeRange(this.option.label);
    }
    return this.option.label;
  }

  /**
   * Format time string to readable format
   * Example: "18:00" -> "6:00 PM"
   */
  private formatDateTime(timeStr: string): string {
    try {
      // Parse time string (HH:mm format)
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);

      // Format: "6:00 PM"
      const time = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return time;
    } catch {
      return timeStr;
    }
  }

  /**
   * Format time range ("start|end") to readable format
   * Example: "18:00|20:00" -> "6:00 PM - 8:00 PM"
   */
  private formatTimeRange(rangeStr: string): string {
    try {
      const [startStr, endStr] = rangeStr.split('|');
      if (!startStr || !endStr) return rangeStr;

      // Parse start time
      const [startHours, startMinutes] = startStr.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(startHours, startMinutes);

      // Parse end time
      const [endHours, endMinutes] = endStr.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(endHours, endMinutes);

      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return `${startTime} - ${endTime}`;
    } catch {
      return rangeStr;
    }
  }

  /**
   * Handle hover effect with GSAP
   */
  onMouseEnter(): void {
    const card = this.elementRef.nativeElement.querySelector('.option-card');
    gsap.to(card, {
      y: -4,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  /**
   * Handle hover out effect with GSAP
   */
  onMouseLeave(): void {
    const card = this.elementRef.nativeElement.querySelector('.option-card');

    if (this.option.isWinner) {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 4px 16px rgba(255, 217, 61, 0.3), 0 2px 8px rgba(0, 0, 0, 0.08)',
        duration: 0.2,
        ease: 'power2.out',
      });
    } else {
      gsap.to(card, {
        y: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  }

  /**
   * Handle click - emit vote event
   */
  onClick(): void {
    if (this.isVoting) return; // Prevent multiple clicks during voting

    const card = this.elementRef.nativeElement.querySelector('.option-card');

    // Play pulse animation on vote
    if (card) {
      this.animationsService.animateOptionPulse(card);
    }

    // Emit vote event
    if (this.option.id) {
      this.vote.emit(this.option.id);
    }
  }
}
