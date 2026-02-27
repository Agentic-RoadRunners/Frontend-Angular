import { Component, signal, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { VerticalNavbar } from './shared/components/vertical-navbar/vertical-navbar';
import { ConfirmationDialog } from './shared/components/confirmation-dialog/confirmation-dialog';
import { AuthService } from './auth/auth.service';

const NO_NAVBAR_ROUTES = ['/login', '/signup', ''];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, VerticalNavbar, ConfirmationDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('SafeRoad-frontend');

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly showNavbar = computed(() => {
    const url = this.currentUrl();
    if (NO_NAVBAR_ROUTES.includes(url)) return false;
    if (url === '/home') return this.auth.isAuthenticated();
    return true;
  });
}
