import { Injectable } from '@angular/core';
import { gsap } from 'gsap';

@Injectable({
  providedIn: 'root',
})
export class RoomAnimationsService {
  private animations: (gsap.core.Tween | gsap.core.Timeline)[] = [];

  constructor() {}

  /**
   * Animate options cards on first load with staggered fade/slide
   */
  animateOptionsEntrance(): void {
    const optionCards = document.querySelectorAll('[data-option-index]');

    if (optionCards.length === 0) return;

    // Set initial state
    gsap.set(optionCards, {
      opacity: 0,
      y: 30,
    });

    // Animate with stagger
    const tl = gsap.to(optionCards, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.1, // 100ms delay between each card
    });

    this.animations.push(tl);
  }

  /**
   * Animate vote button click - scale down effect
   */
  animateVoteClick(element: HTMLElement): void {
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.in',
      onComplete: () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.2,
          ease: 'back.out(2)',
        });
      },
    });
  }

  /**
   * Animate option card pulse when voted - pronounced feedback
   */
  animateOptionPulse(element: HTMLElement): void {
    const tl = gsap.timeline();

    // Pulse animation with scale and glow
    tl.to(element, {
      scale: 1.02,
      boxShadow: '0 12px 40px rgba(139, 127, 255, 0.4)',
      duration: 0.3,
      ease: 'power1.out',
    }).to(element, {
      scale: 1,
      boxShadow: '0 4px 16px rgba(139, 127, 255, 0.2)',
      duration: 0.5,
      ease: 'power2.out',
    });

    this.animations.push(tl);
  }

  /**
   * Animate progress bar width change with smooth easing
   */
  animateProgressBar(element: HTMLElement, newWidth: number): void {
    gsap.to(element, {
      width: `${newWidth}%`,
      duration: 0.8,
      ease: 'power3.out',
    });
  }

  /**
   * Animate winner highlight with celebratory effect
   */
  animateWinnerHighlight(element: HTMLElement): void {
    const tl = gsap.timeline();

    // Flash effect for winner
    tl.to(element, {
      scale: 1.01,
      boxShadow: '0 8px 32px rgba(255, 217, 61, 0.5)',
      duration: 0.4,
      ease: 'power2.out',
    }).to(element, {
      scale: 1,
      boxShadow: '0 4px 16px rgba(255, 217, 61, 0.3)',
      duration: 0.5,
      ease: 'power2.out',
    });

    this.animations.push(tl);
  }

  /**
   * Animate vote count number change with pop effect
   */
  animateVoteCountChange(element: HTMLElement): void {
    const tl = gsap.timeline();

    tl.to(element, {
      scale: 1.15,
      color: '#8b7fff',
      duration: 0.25,
      ease: 'power2.out',
    }).to(element, {
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
    });

    this.animations.push(tl);
  }

  /**
   * Animate when option loses winner status
   */
  animateWinnerRemoval(element: HTMLElement): void {
    gsap.to(element, {
      scale: 1,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      duration: 0.4,
      ease: 'power2.out',
    });
  }

  /**
   * Animate new option card entrance with slide/fade from top
   */
  animateNewOption(element: HTMLElement): void {
    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: -30,
        scale: 0.95,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out',
      }
    );
  }

  /**
   * Button hover animation
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
   * Button hover out animation
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
   * Animate options reordering with smooth transitions
   */
  animateOptionsReorder(): void {
    const optionCards = document.querySelectorAll('[data-option-id]');
    
    if (optionCards.length === 0) return;

    // Use GSAP's Flip plugin alternative - capture positions before and animate after
    const positions = new Map<Element, { top: number; left: number }>();
    
    // Capture current positions
    optionCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      positions.set(card, { top: rect.top, left: rect.left });
    });

    // After DOM updates (next frame), animate from old to new positions
    requestAnimationFrame(() => {
      optionCards.forEach(card => {
        const oldPos = positions.get(card);
        if (!oldPos) return;
        
        const newRect = card.getBoundingClientRect();
        const deltaY = oldPos.top - newRect.top;
        const deltaX = oldPos.left - newRect.left;

        // Only animate if position changed
        if (deltaY !== 0 || deltaX !== 0) {
          gsap.fromTo(
            card,
            {
              y: deltaY,
              x: deltaX,
            },
            {
              y: 0,
              x: 0,
              duration: 0.6,
              ease: 'power3.out',
            }
          );
        }
      });
    });
  }

  /**
   * Clean up all animations
   */
  cleanup(): void {
    this.animations.forEach((animation) => animation.kill());
    this.animations = [];
  }
}
