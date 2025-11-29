import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  constructor(private router: Router) {}

  /**
   * Navigate to home page
   */
  goHome(): void {
    this.router.navigate(['/']);
  }

  /**
   * Logout - clear localStorage and go home
   */
  logout(): void {
    if (confirm('This will clear your name and vote. Continue?')) {
      localStorage.clear();
      this.router.navigate(['/']);
      window.location.reload();
    }
  }
}
