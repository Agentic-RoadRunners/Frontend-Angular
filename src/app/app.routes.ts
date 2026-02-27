import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login',     loadComponent: () => import('./auth/login/page/login-page').then(m => m.LoginPage) },
  { path: 'signup',    loadComponent: () => import('./auth/signup/page/signup-page').then(m => m.SignupPage) },
  { path: 'home',      loadComponent: () => import('./core/home/page/home-page').then(m => m.HomePage) },
  { path: 'maps',      canActivate: [authGuard], loadComponent: () => import('./core/maps/page/maps-page').then(m => m.MapsPage) },
  { path: 'incidents', canActivate: [authGuard], loadComponent: () => import('./core/incidents/page/incidents-page').then(m => m.IncidentsPage) },
  { path: 'analytics', canActivate: [authGuard], loadComponent: () => import('./core/analytics/page/analytics-page').then(m => m.AnalyticsPage) },
  { path: 'profile',   canActivate: [authGuard], loadComponent: () => import('./core/profile/page/profile-page').then(m => m.ProfilePage) },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
