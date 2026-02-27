import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics-page',
  template: `
    <div class="placeholder-page">
      <i class="fas fa-chart-bar page-icon"></i>
      <h1>Analytics</h1>
      <p>Analytics dashboard coming soon.</p>
    </div>
  `,
  styles: [`
    .placeholder-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: #94a3b8;
    }
    .page-icon { font-size: 3rem; color: #a78bfa; }
    h1 { color: #f1f5f9; margin: 0; }
    p  { margin: 0; }
  `],
})
export class AnalyticsPage {}
