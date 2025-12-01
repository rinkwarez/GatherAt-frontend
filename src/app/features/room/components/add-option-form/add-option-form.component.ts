import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OptionService } from '../../services/option.service';
import { OptionType } from '../../../../models/room.model';
import { TimePickerComponent } from '../../../../shared/components/time-picker/time-picker.component';

@Component({
  selector: 'app-add-option-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TimePickerComponent],
  templateUrl: './add-option-form.component.html',
  styleUrl: './add-option-form.component.css',
})
export class AddOptionFormComponent {
  @Input({ required: true }) roomId!: string;
  @Input({ required: true }) optionType!: OptionType;

  optionLabel = signal('');
  timeRangeStart = signal('');
  timeRangeEnd = signal('');
  isSubmitting = signal(false);
  error = signal('');

  // Expose enum to template
  readonly OptionType = OptionType;

  constructor(private optionService: OptionService) {}

  /**
   * Check if form can be submitted
   */
  canSubmit(): boolean {
    if (this.optionType === OptionType.TimeRange) {
      return this.timeRangeStart().trim().length > 0 && this.timeRangeEnd().trim().length > 0;
    }
    return this.optionLabel().trim().length > 0;
  }

  /**
   * Add a new option to the room
   */
  async onSubmit(): Promise<void> {
    let label = '';

    // Build label based on option type
    if (this.optionType === OptionType.TimeRange) {
      const start = this.timeRangeStart().trim();
      const end = this.timeRangeEnd().trim();

      if (!start || !end) {
        this.error.set('Please select both start and end times');
        return;
      }

      label = `${start}|${end}`;
    } else {
      label = this.optionLabel().trim();
    }

    // Validate
    if (!label) {
      this.error.set('Please enter an option');
      return;
    }

    if (this.optionType === OptionType.Text && label.length < 2) {
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

      // Clear the inputs on success
      this.optionLabel.set('');
      this.timeRangeStart.set('');
      this.timeRangeEnd.set('');
      console.log('Option added successfully');
    } catch (error) {
      console.error('Error adding option:', error);
      this.error.set('Failed to add option. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
