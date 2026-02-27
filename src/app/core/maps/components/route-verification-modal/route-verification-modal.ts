import { Component, input, output, signal, computed, inject } from '@angular/core';
import { VerificationService } from '../../../../shared/services/verification.service';
import { getCategoryStyleByName } from '../../../../shared/constants';
import { RouteIncidentDto } from '../../../../models/journey.model';

@Component({
  selector: 'app-route-verification-modal',
  imports: [],
  templateUrl: './route-verification-modal.html',
  styleUrl: './route-verification-modal.css',
})
export class RouteVerificationModal {
  readonly incidents = input.required<RouteIncidentDto[]>();
  readonly completed = output<void>();

  private readonly verificationService = inject(VerificationService);

  verifyIndex = signal(0);
  loading = signal(false);

  readonly currentIncident = computed<RouteIncidentDto | null>(() => {
    const list = this.incidents();
    const idx = this.verifyIndex();
    return idx < list.length ? list[idx] : null;
  });

  readonly progressPercent = computed(
    () => (this.verifyIndex() / Math.max(this.incidents().length, 1)) * 100,
  );

  getStyle(categoryName: string) {
    return getCategoryStyleByName(categoryName);
  }

  verify(): void {
    const inc = this.currentIncident();
    if (!inc || this.loading()) return;
    this.loading.set(true);
    this.verificationService.verify(inc.id).subscribe({
      next: () => { this.loading.set(false); this._next(); },
      error: () => { this.loading.set(false); this._next(); },
    });
  }

  dispute(): void {
    const inc = this.currentIncident();
    if (!inc || this.loading()) return;
    this.loading.set(true);
    this.verificationService.dispute(inc.id).subscribe({
      next: () => { this.loading.set(false); this._next(); },
      error: () => { this.loading.set(false); this._next(); },
    });
  }

  skip(): void {
    this._next();
  }

  private _next(): void {
    const next = this.verifyIndex() + 1;
    if (next < this.incidents().length) {
      this.verifyIndex.set(next);
    } else {
      this.completed.emit();
    }
  }
}
