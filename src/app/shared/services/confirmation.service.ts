import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  isVisible = signal(false);
  options = signal<ConfirmationOptions>({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info',
  });

  private resolveFunction?: (value: boolean) => void;

  /**
   * Show confirmation modal and return a promise that resolves with the user's choice
   */
  confirm(options: ConfirmationOptions): Promise<boolean> {
    this.options.set({
      ...options,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      type: options.type || 'info',
    });
    this.isVisible.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolveFunction = resolve;
    });
  }

  /**
   * User confirmed the action
   */
  onConfirm(): void {
    this.isVisible.set(false);
    if (this.resolveFunction) {
      this.resolveFunction(true);
      this.resolveFunction = undefined;
    }
  }

  /**
   * User cancelled the action
   */
  onCancel(): void {
    this.isVisible.set(false);
    if (this.resolveFunction) {
      this.resolveFunction(false);
      this.resolveFunction = undefined;
    }
  }
}
