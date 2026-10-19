import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import { PublicTestimonial, TestimonialService } from '../../../core/services/testimonial.service';
import { Icon } from '../../../shared/design/icon';

@Component({
  selector: 'app-testimonials',
  imports: [RouterLink, Icon],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.css',
})
export class Testimonials implements OnInit {
  private readonly service = inject(TestimonialService);
  private readonly auth = inject(AuthService);
  protected readonly user = toSignal(this.auth.currentUser$, {
    initialValue: this.auth.currentUser,
  });
  protected readonly testimonials = signal<PublicTestimonial[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  ngOnInit() {
    this.load();
  }
  protected load() {
    this.loading.set(true);
    this.error.set(false);
    this.service.published().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  protected initials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => Array.from(part)[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
