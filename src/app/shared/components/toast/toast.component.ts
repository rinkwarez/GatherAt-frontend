import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../services/toast.service';
import gsap from 'gsap';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnInit, AfterViewInit {
  @Input() toast!: Toast;
  @Output() remove = new EventEmitter<number>();
  @ViewChild('toastElement', { static: false }) toastElement!: ElementRef;

  ngOnInit(): void {
    // Auto-remove after duration with fade-out animation
    setTimeout(() => {
      this.closeToast();
    }, this.toast.duration - 500); // Start animation 500ms before removal
  }

  ngAfterViewInit(): void {
    this.animateIn();
  }

  /**
   * Animate toast sliding in from right
   */
  private animateIn(): void {
    const element = this.toastElement.nativeElement;
    gsap.fromTo(
      element,
      {
        x: 400,
        opacity: 0,
      },
      {
        x: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.7)',
      }
    );
  }

  /**
   * Animate toast sliding out to right and fading
   */
  private animateOut(): void {
    const element = this.toastElement.nativeElement;
    gsap.to(element, {
      x: 400,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        this.remove.emit(this.toast.id);
      },
    });
  }

  /**
   * Close toast with animation
   */
  closeToast(): void {
    this.animateOut();
  }

  /**
   * Get icon for toast type
   */
  get icon(): string {
    switch (this.toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
}
