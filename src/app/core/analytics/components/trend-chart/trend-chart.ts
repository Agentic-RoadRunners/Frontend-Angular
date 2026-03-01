import { Component, input, computed } from '@angular/core';
import { TrendData } from '../../../../models/analytics.model';

@Component({
    selector: 'app-trend-chart',
    templateUrl: './trend-chart.html',
    styleUrl: './trend-chart.css',
})
export class TrendChart {
    readonly trends = input<TrendData[]>([]);

    maxCount = computed(() => {
        const data = this.trends();
        if (!data.length) return 1;
        return Math.max(...data.map((d) => d.count), 1);
    });

    barHeight(count: number): string {
        return `${(count / this.maxCount()) * 100}%`;
    }

    formatDate(dateStr: string): string {
        const d = new Date(dateStr);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    }

    totalIncidents = computed(() =>
        this.trends().reduce((sum, d) => sum + d.count, 0)
    );

    totalResolved = computed(() =>
        this.trends().reduce((sum, d) => sum + d.resolved, 0)
    );
}
