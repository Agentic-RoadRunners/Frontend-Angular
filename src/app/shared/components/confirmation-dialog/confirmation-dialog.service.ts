import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type ConfirmationDialogType = 'confirm' | 'alert';
export type ConfirmationDialogTheme = 'info' | 'success' | 'warning' | 'danger';

export interface ConfirmationDialogConfig {
  /** Dialog type: 'confirm' shows Confirm + Cancel, 'alert' shows only OK */
  type?: ConfirmationDialogType;
  /** Display theme that controls icon/button colours */
  theme?: ConfirmationDialogTheme;
  /** FontAwesome icon class, e.g. 'fa-shield-alt'. Defaults based on theme. */
  icon?: string;
  /** Title text shown in the dialog header */
  title: string;
  /** Body message / description */
  message: string;
  /** Label for the primary button (default: 'Confirm' / 'OK') */
  confirmText?: string;
  /** Label for the cancel button (default: 'Cancel') */
  cancelText?: string;
}

/** Internal state exposed to the dialog component */
export interface DialogState extends Required<ConfirmationDialogConfig> {
  open: boolean;
}

const THEME_DEFAULTS: Record<ConfirmationDialogTheme, string> = {
  info: 'fa-info-circle',
  success: 'fa-check-circle',
  warning: 'fa-exclamation-triangle',
  danger: 'fa-exclamation-circle',
};

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  /** Reactive state consumed by the component */
  readonly state = signal<DialogState>({
    open: false,
    type: 'confirm',
    theme: 'info',
    icon: '',
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
  });

  private result$ = new Subject<boolean>();

  /**
   * Open the dialog and return a Promise that resolves to
   * `true` (confirmed / OK) or `false` (cancelled).
   */
  open(config: ConfirmationDialogConfig): Promise<boolean> {
    const theme = config.theme ?? 'info';
    this.state.set({
      open: true,
      type: config.type ?? 'confirm',
      theme,
      icon: config.icon ?? THEME_DEFAULTS[theme],
      title: config.title,
      message: config.message,
      confirmText: config.confirmText ?? (config.type === 'alert' ? 'OK' : 'Confirm'),
      cancelText: config.cancelText ?? 'Cancel',
    });
    return new Promise<boolean>((resolve) => {
      const sub = this.result$.subscribe((val) => {
        sub.unsubscribe();
        resolve(val);
      });
    });
  }

  /** Called by the dialog component */
  _respond(value: boolean): void {
    this.state.update((s) => ({ ...s, open: false }));
    this.result$.next(value);
  }
}
