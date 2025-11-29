import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OptionService } from '../../services/option.service';

@Component({
  selector: 'app-add-option-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-option-form.component.html',
  styleUrl: './add-option-form.component.css',
})
export class AddOptionFormComponent {
  @Input({ required: true }) roomId!: string;

  optionLabel = signal('');
  isSubmitting = signal(false);
  error = signal('');

  constructor(private optionService: OptionService) {}

  /**
   * Add a new option to the room
   */
  async onSubmit(): Promise<void> {
    const label = this.optionLabel().trim();

    // Validate
    if (!label) {
      this.error.set('Please enter an option');
      return;
    }

    if (label.length < 2) {
      this.error.set('Option must be at least 2 characters');
      return;
    }

    if (label.length > 100) {
      this.error.set('Option must be 100 characters or less');
      return;
    }

    try {
      this.isSubmitting.set(true);
      this.error.set('');

      // Add the option
      await this.optionService.addOption(this.roomId, label);

      // Clear the input on success
      this.optionLabel.set('');
      console.log('Option added successfully');
    } catch (error) {
      console.error('Error adding option:', error);
      this.error.set('Failed to add option. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
