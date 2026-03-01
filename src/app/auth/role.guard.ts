import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export function roleGuard(...allowedRoles: string[]): CanActivateFn {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        const user = auth.currentUser();
        if (!user) {
            return router.createUrlTree(['/login']);
        }

        const hasRole = user.roles.some((role) => allowedRoles.includes(role));
        if (hasRole) return true;

        return router.createUrlTree(['/home']);
    };
}
