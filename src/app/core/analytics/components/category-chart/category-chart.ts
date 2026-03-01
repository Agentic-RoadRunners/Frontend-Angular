import { Component, input } from '@angular/core';
import { CategoryData } from '../../../../models/analytics.model';

@Component({
    selector: 'app-category-chart',
    templateUrl: './category-chart.html',
    styleUrl: './category-chart.css',
})
export class CategoryChart {
    readonly categories = input<CategoryData[]>([]);

    maxCount(): number {
        const cats = this.categories();
        if (!cats.length) return 1;
        return Math.max(...cats.map((c) => c.count), 1);
    }

    barWidth(count: number): string {
        return `${(count / this.maxCount()) * 100}%`;
    }
}
