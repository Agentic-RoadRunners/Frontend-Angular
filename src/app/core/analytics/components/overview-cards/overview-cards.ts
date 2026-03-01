import { Component, input } from '@angular/core';

@Component({
    selector: 'app-overview-cards',
    templateUrl: './overview-cards.html',
    styleUrl: './overview-cards.css',
})
export class OverviewCards {
    readonly totalIncidents = input(0);
    readonly totalUsers = input(0);
    readonly resolvedCount = input(0);
    readonly municipalityCount = input(0);
}
