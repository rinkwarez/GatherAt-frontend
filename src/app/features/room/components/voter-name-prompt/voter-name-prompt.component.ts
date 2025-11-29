import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserSessionService } from '../../../../core/services/user-session.service';
import gsap from 'gsap';

@Component({
  selector: 'app-voter-name-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voter-name-prompt.component.html',
  styleUrl: './voter-name-prompt.component.css',
})
export class VoterNamePromptComponent {
  @Output() nameSubmitted = new EventEmitter<string>();

  displayName = signal('');
  error = signal('');
  isSubmitting = signal(false);

  constructor(private userSessionService: UserSessionService) {}

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    const name = this.displayName().trim();

    // Validate
    if (!name) {
      this.error.set('Please enter a name');
      this.shakeModal();
      return;
    }

    if (name.length < 2) {
      this.error.set('Name must be at least 2 characters');
      this.shakeModal();
      return;
    }

    if (name.length > 20) {
      this.error.set('Name must be 20 characters or less');
      this.shakeModal();
      return;
    }

    // Store in session and create user in Firestore
    this.isSubmitting.set(true);
    try {
      await this.userSessionService.setDisplayName(name);

      // Emit event and close with animation
      this.closeWithAnimation(() => {
        this.nameSubmitted.emit(name);
      });
    } catch (error) {
      console.error('Error creating user:', error);
      this.error.set('Failed to create user. Please try again.');
      this.shakeModal();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Shake modal on error
   */
  private shakeModal(): void {
    const modal = document.querySelector('.prompt-modal');
    if (modal) {
      gsap.to(modal, {
        keyframes: [
          { x: -10, duration: 0.1 },
          { x: 10, duration: 0.1 },
          { x: -10, duration: 0.1 },
          { x: 10, duration: 0.1 },
          { x: 0, duration: 0.1 },
        ],
        ease: 'power2.out',
      });
    }
  }

  /**
   * Close modal with fade out animation
   */
  private closeWithAnimation(callback: () => void): void {
    const overlay = document.querySelector('.prompt-overlay');
    const modal = document.querySelector('.prompt-modal');

    if (overlay && modal) {
      gsap.to(modal, {
        scale: 0.9,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });

      gsap.to(overlay, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: callback,
      });
    } else {
      callback();
    }
  }

  /**
   * Animate modal entrance
   */
  ngAfterViewInit(): void {
    const overlay = document.querySelector('.prompt-overlay');
    const modal = document.querySelector('.prompt-modal');

    if (overlay && modal) {
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

      gsap.fromTo(
        modal,
        { scale: 0.8, opacity: 0, y: 20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'back.out(1.5)',
          delay: 0.1,
        }
      );
    }

    // Focus input after animation
    setTimeout(() => {
      const input = document.querySelector('.name-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 500);
  }
}
