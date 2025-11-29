import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-room-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-header.component.html',
  styleUrl: './room-header.component.css',
})
export class RoomHeaderComponent {
  @Input() question: string = '';
  @Input() roomId: string = '';

  constructor(private router: Router) {}

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }
}
