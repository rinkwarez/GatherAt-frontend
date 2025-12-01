import { Component, Input, Output, EventEmitter, signal, effect, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
})
export class TimePickerComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() placeholder = 'Select time';
  @Output() timeChange = new EventEmitter<string>();

  hour = signal<string>('12');
  minute = signal<string>('00');
  period = signal<'AM' | 'PM'>('PM');

  hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Emit time changes
    effect(() => {
      const timeValue = this.getTimeValue();
      this.onChange(timeValue);
      this.timeChange.emit(timeValue);
    });
  }

  /**
   * Get time value in HH:mm format (24-hour)
   */
  private getTimeValue(): string {
    const hourNum = parseInt(this.hour());
    const minuteNum = parseInt(this.minute());
    const isPM = this.period() === 'PM';

    let hour24 = hourNum;
    if (isPM && hourNum !== 12) {
      hour24 = hourNum + 12;
    } else if (!isPM && hourNum === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}`;
  }

  /**
   * Parse time value from HH:mm format (24-hour) to 12-hour format
   */
  private parseTimeValue(value: string): void {
    if (!value) {
      this.hour.set('12');
      this.minute.set('00');
      this.period.set('PM');
      return;
    }

    const [hourStr, minuteStr] = value.split(':');
    const hour24 = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    let hour12 = hour24;
    let period: 'AM' | 'PM' = 'AM';

    if (hour24 === 0) {
      hour12 = 12;
      period = 'AM';
    } else if (hour24 === 12) {
      hour12 = 12;
      period = 'PM';
    } else if (hour24 > 12) {
      hour12 = hour24 - 12;
      period = 'PM';
    } else {
      hour12 = hour24;
      period = 'AM';
    }

    this.hour.set(hour12.toString().padStart(2, '0'));
    this.minute.set(minute.toString().padStart(2, '0'));
    this.period.set(period);
  }

  /**
   * Get formatted display time
   */
  get formattedTime(): string {
    return `${this.hour()}:${this.minute()} ${this.period()}`;
  }

  /**
   * ControlValueAccessor methods
   */
  writeValue(value: string): void {
    this.parseTimeValue(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Update hour
   */
  updateHour(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.hour.set(value);
    this.onTouched();
  }

  /**
   * Update minute
   */
  updateMinute(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.minute.set(value);
    this.onTouched();
  }

  /**
   * Toggle AM/PM
   */
  togglePeriod(): void {
    this.period.update((p) => (p === 'AM' ? 'PM' : 'AM'));
    this.onTouched();
  }
}
