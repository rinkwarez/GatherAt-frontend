import { Injectable } from '@angular/core';
import { gsap } from 'gsap';

@Injectable({
  providedIn: 'root',
})
export class LandingAnimationsService {
  private animations: (gsap.core.Tween | gsap.core.Timeline)[] = [];

  constructor() {}

  /**
   * Animate hero section elements on page load
   * Fade in + slight upward movement with staggered timing
   */
  animateHeroSection(): void {
    // Set initial state - elements are invisible and slightly below
    gsap.set('[data-animate="hero-title"]', {
      opacity: 0,
      y: 30,
    });
    gsap.set('[data-animate="hero-tagline"]', {
      opacity: 0,
      y: 30,
    });
    gsap.set('[data-animate="hero-description"]', {
      opacity: 0,
      y: 30,
    });
    gsap.set('[data-animate="hero-card"]', {
      opacity: 0,
      y: 40,
    });
    gsap.set('[data-animate="hero-join"]', {
      opacity: 0,
      y: 40,
    });

    // Create timeline for staggered animation
    const tl = gsap.timeline({
      defaults: {
        duration: 0.6,
        ease: 'power3.out',
      },
    });

    // Animate elements in sequence
    tl.to('[data-animate="hero-title"]', {
      opacity: 1,
      y: 0,
    })
      .to(
        '[data-animate="hero-tagline"]',
        {
          opacity: 1,
          y: 0,
        },
        '-=0.4'
      ) // Start 0.4s before previous animation ends
      .to(
        '[data-animate="hero-description"]',
        {
          opacity: 1,
          y: 0,
        },
        '-=0.4'
      )
      .to(
        '[data-animate="hero-card"]',
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
        },
        '-=0.3'
      )
      .to(
        '[data-animate="hero-join"]',
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
        },
        '-=0.3'
      );

    this.animations.push(tl);
  }

  /**
   * Animate recent rooms section
   * Fade in and slide up after hero section loads
   */
  animateRecentRooms(): void {
    // Set initial state
    gsap.set('[data-animate="recent-rooms"]', {
      opacity: 0,
      y: 30,
    });

    // Animate in after a delay
    const tl = gsap.timeline({
      delay: 1.5, // Wait for hero section to finish
      defaults: {
        duration: 0.6,
        ease: 'power3.out',
      },
    });

    tl.to('[data-animate="recent-rooms"]', {
      opacity: 1,
      y: 0,
    });

    this.animations.push(tl);
  }

  /**
   * Button hover animation - lift slightly
   */
  animateButtonHover(element: HTMLElement): void {
    gsap.to(element, {
      y: -2,
      scale: 1.02,
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  /**
   * Button hover out - return to normal
   */
  animateButtonHoverOut(element: HTMLElement): void {
    gsap.to(element, {
      y: 0,
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    });
  }

  /**
   * Button click animation - scale down
   */
  animateButtonClick(element: HTMLElement): void {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
        });
      },
    });
  }

  /**
   * Card entrance animation
   */
  animateCardEntrance(element: HTMLElement): void {
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(1.2)',
      }
    );
  }

  /**
   * Clean up all animations
   */
  cleanup(): void {
    this.animations.forEach((animation) => animation.kill());
    this.animations = [];
  }
}
