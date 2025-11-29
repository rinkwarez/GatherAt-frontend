import { Component, OnInit, OnDestroy } from '@angular/core';
import { LandingAnimationsService } from './services/landing-animations.service';
import { CreateRoomFormComponent } from './components/create-room-form/create-room-form.component';
import { JoinRoomFormComponent } from './components/join-room-form/join-room-form.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CreateRoomFormComponent, JoinRoomFormComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  constructor(private animationsService: LandingAnimationsService) {}

  ngOnInit(): void {
    // Trigger hero section animations on page load
    this.animationsService.animateHeroSection();
  }

  ngOnDestroy(): void {
    // Clean up GSAP animations
    this.animationsService.cleanup();
  }
}
