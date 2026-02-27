import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomeMap } from '../components/home-map/home-map';
import { HomeService, HomeOverviewStats } from '../services/home-service';
import { AuthService } from '../../../auth/auth.service';

interface StatCard {
  target: number;
  suffix: string;
  displayed: number;
  label: string;
  icon: string;
  color: string;
}

const ANIMATION_DURATION_MS = 900;

// Hardcoded structure — labels/icons/colors never change, only numbers animate
const STAT_TEMPLATE: Omit<StatCard, 'target' | 'displayed'>[] = [
  { suffix: '', label: 'Incidents Reported', icon: 'fas fa-flag', color: '#ef4444' },
  { suffix: '', label: 'Municipalities', icon: 'fas fa-city', color: '#6366f1' },
  { suffix: '', label: 'Active Users', icon: 'fas fa-users', color: '#22c55e' },
  { suffix: '%', label: 'Resolution Rate', icon: 'fas fa-circle-check', color: '#f59e0b' },
];

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, HomeMap],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage implements OnInit, OnDestroy {
  private readonly homeService = inject(HomeService);
  readonly auth = inject(AuthService);
  private animationId: number | null = null;

  // Initialized immediately with 0s so cards render on first paint
  readonly stats = signal<StatCard[]>(
    STAT_TEMPLATE.map((t) => ({ ...t, target: 0, displayed: 0 })),
  );

  readonly features = [
    // static — not from API
    {
      icon: 'fas fa-location-dot',
      title: 'Report Instantly',
      desc: 'Spot a hazard? Report it in seconds with photos, location, and details. Your report reaches the community right away.',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
    },
    {
      icon: 'fas fa-map',
      title: 'Real-Time Tracking',
      desc: "An interactive live map shows all reported incidents. Know what's ahead before you even leave home.",
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.1)',
    },
    {
      icon: 'fas fa-users',
      title: 'Community Verified',
      desc: 'Every incident is voted on by the community. More eyes mean more accurate, trustworthy information for everyone.',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Analytics & Insights',
      desc: 'Discover incident patterns over time. Help local authorities prioritize fixes with data-driven insights.',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
  ];

  ngOnInit(): void {
    this.homeService.getOverviewStats().subscribe({
      next: (data) => this.startCountUp(this.buildTargets(data)),
      error: () => {
        /* numbers stay at 0 */
      },
    });
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private buildTargets(data: HomeOverviewStats): number[] {
    const accuracy =
      data.totalIncidents > 0 ? Math.round((data.resolvedCount / data.totalIncidents) * 100) : 0;
    return [data.totalIncidents, data.municipalityCount, data.totalUsers, accuracy];
  }

  private startCountUp(targets: number[]): void {
    // Set targets, keep displayed at 0 to animate from there
    this.stats.update((list) => list.map((s, i) => ({ ...s, target: targets[i], displayed: 0 })));

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.stats.update((list) =>
        list.map((s) => ({ ...s, displayed: Math.round(s.target * eased) })),
      );

      if (progress < 1) {
        this.animationId = requestAnimationFrame(tick);
      }
    };

    this.animationId = requestAnimationFrame(tick);
  }
}
