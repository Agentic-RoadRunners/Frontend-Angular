import { Component, OnInit, inject, signal } from '@angular/core';
import { AnalyticsService } from '../services/analytics.service';
import { OverviewStats, CategoryData, TrendData } from '../../../models/analytics.model';
import { OverviewCards } from '../components/overview-cards/overview-cards';
import { CategoryChart } from '../components/category-chart/category-chart';
import { TrendChart } from '../components/trend-chart/trend-chart';

@Component({
  selector: 'app-analytics-page',
  imports: [OverviewCards, CategoryChart, TrendChart],
  templateUrl: './analytics-page.html',
  styleUrl: './analytics-page.css',
})
export class AnalyticsPage implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly overview = signal<OverviewStats | null>(null);
  readonly categories = signal<CategoryData[]>([]);
  readonly trends = signal<TrendData[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.analyticsService.getOverviewStats().subscribe({
      next: (res) => {
        if (res.succeeded) this.overview.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });

    this.analyticsService.getCategoryStats().subscribe({
      next: (data) => this.categories.set(data),
    });

    this.analyticsService.getTrendData(30).subscribe({
      next: (data) => this.trends.set(data),
    });
  }
}
