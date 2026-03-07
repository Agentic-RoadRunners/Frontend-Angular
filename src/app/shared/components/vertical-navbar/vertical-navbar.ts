import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';

export interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-vertical-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: 'vertical-navbar.html',
  styleUrl: 'vertical-navbar.css',
})
export class VerticalNavbar {
  collapsed = signal(false);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = computed<NavItem[]>(() => {
    const base: NavItem[] = [
      { icon: 'fas fa-home', label: 'Home', route: '/home' },
      { icon: 'fas fa-map', label: 'Map', route: '/maps' },
      { icon: 'fas fa-exclamation-triangle', label: 'Incidents', route: '/incidents' },
      { icon: 'fas fa-user', label: 'Profile', route: '/profile' },
      { icon: 'fas fa-project-diagram', label: 'Knowledge Graph', route: '/knowledge-graph' },
    ];

    const user = this.auth.currentUser();
    const roles: string[] = user?.roles ?? [];

    if (roles.includes('Municipality') || roles.includes('Admin')) {
      base.push({ icon: 'fas fa-chart-bar', label: 'Analytics', route: '/analytics' });
      base.push({ icon: 'fas fa-building', label: 'Municipality', route: '/municipality' });
    }

    if (roles.includes('Admin')) {
      base.push({ icon: 'fas fa-shield-alt', label: 'Admin', route: '/admin' });
    }

    return base;
  });

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  async logout(): Promise<void> {
    const result = await this.auth.logout();
    if (result) this.router.navigate(['/login']);
  }
}
