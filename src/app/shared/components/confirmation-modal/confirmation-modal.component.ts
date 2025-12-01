import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css',
})
export class ConfirmationModalComponent {
  confirmationService = inject(ConfirmationService);

  /**
   * Handle confirm button click
   */
  onConfirm(): void {
    this.confirmationService.onConfirm();
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.confirmationService.onCancel();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(): void {
    this.confirmationService.onCancel();
  }
}
