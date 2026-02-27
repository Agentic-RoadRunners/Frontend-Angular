import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from './confirmation-dialog.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
})
export class ConfirmationDialog {
  readonly dialog = inject(ConfirmationDialogService);
  readonly state = this.dialog.state;

  readonly themeClass = computed(() => `theme-${this.state().theme}`);

  onConfirm(): void {
    this.dialog._respond(true);
  }

  onCancel(): void {
    this.dialog._respond(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cd-backdrop')) {
      this.onCancel();
    }
  }
}
