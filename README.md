# SafeRoad Frontend

An Angular-based web application for reporting, tracking, and managing traffic incidents. Built with Angular 20, Leaflet maps, and a role-based architecture supporting Users, Municipality staff, and Admins.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Application Routes](#application-routes)
- [Pages & Components](#pages--components)
  - [Login & Signup](#login--signup)
  - [Home](#home)
  - [Maps](#maps)
  - [Incidents](#incidents)
  - [Analytics](#analytics)
  - [Profile](#profile)
  - [Municipality](#municipality)
  - [Admin](#admin)
- [Shared Components](#shared-components)
- [Services & API Map](#services--api-map)
- [Models](#models)
- [Incident Categories](#incident-categories)
- [Authentication & Authorization](#authentication--authorization)
- [Styling](#styling)
- [Architecture Overview](#architecture-overview)

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Angular** | ^20.3.0 | Core framework |
| **TypeScript** | ~5.9.2 | Language |
| **RxJS** | ~7.8.0 | Reactive programming |
| **Leaflet** | ^1.9.4 | Interactive maps |
| **leaflet.heat** | ^0.2.0 | Heatmap layer for Leaflet |
| **FontAwesome** | ^6.5.1 | Icons |
| **Zone.js** | ~0.15.0 | Angular change detection |

---

## Project Structure

```
SafeRoad-frontend/
├── angular.json              # Angular CLI configuration
├── package.json              # Dependencies & scripts
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript base config
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.spec.json        # Test-specific TS config
├── public/                   # Static assets served directly
└── src/
    ├── index.html            # Root HTML
    ├── main.ts               # Bootstrap entry point
    ├── styles.css            # Global styles
    ├── assets/
    │   └── images/
    │       └── auth-bg.jpg   # Login/Signup background
    ├── environments/
    │   ├── environment.ts            # Production config
    │   └── environment.development.ts # Development config
    ├── types/
    │   └── leaflet-heat.d.ts # Type declarations for leaflet.heat
    └── app/
        ├── app.ts            # Root component
        ├── app.html          # Root template
        ├── app.css           # Root styles
        ├── app.routes.ts     # Route definitions
        ├── app.config.ts     # App configuration (providers)
        ├── auth/             # Auth module (login, signup, guards, interceptor)
        ├── core/             # Feature pages (home, maps, incidents, analytics, profile, municipality, admin)
        ├── models/           # TypeScript interfaces & types
        └── shared/           # Shared components, services, constants
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Angular CLI** (`npm install -g @angular/cli`)
- Running backend at `https://localhost:9001` (see [SafeRoad Backend](../SafeRoad-backend/README.md))

### Installation

```bash
cd SafeRoad-frontend
npm install
```

### Development Server

```bash
ng serve
```

The application starts at **http://localhost:4200**. It proxies API calls to `https://localhost:9001/api`.

### Build

```bash
ng build
```

Production output is written to `dist/SafeRoad-frontend/`.

### Tests

```bash
ng test        # Unit tests
```

---

## Environment Configuration

Both `environment.ts` and `environment.development.ts` share the same structure:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:9001/api',
  signalrUrl: 'https://localhost:9001',
  logLevel: 'verbose',
  mapbox: {
    defaultCenter: { lat: 41.0082, lng: 28.9784 },
    defaultZoom: 12,
  },
  upload: {
    maxFileSizeMb: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
```

| Key | Description |
|---|---|
| `apiUrl` | Base URL for all backend API calls |
| `signalrUrl` | SignalR hub URL (reserved for real-time features) |
| `mapbox.defaultCenter` | Default map center coordinates |
| `mapbox.defaultZoom` | Default map zoom level |
| `upload.maxFileSizeMb` | Maximum upload file size |
| `upload.allowedTypes` | Allowed image MIME types |

---

## Application Routes

All feature routes use **lazy loading** via `loadComponent`.

| Path | Component | Guard | Description |
|---|---|---|---|
| `/login` | LoginPage | — | User login |
| `/signup` | SignupPage | — | User registration |
| `/home` | HomePage | — | Landing page with stats & map |
| `/maps` | MapsPage | `authGuard` | Interactive incident map |
| `/incidents` | IncidentsPage | `authGuard` | Incident list with filtering |
| `/analytics` | AnalyticsPage | `authGuard` | Dashboard with charts |
| `/profile` | ProfilePage | `authGuard` | User profile management |
| `/municipality` | MunicipalityPage | `roleGuard([3, 4])` | Municipality incident management |
| `/admin` | AdminPage | `roleGuard([3])` | Admin panel (users & incidents) |
| `` (default) | redirect → `/home` | — | — |
| `**` (wildcard) | redirect → `/home` | — | — |

**Role IDs**: User = 1, Moderator = 2, Admin = 3, Municipality = 4

---

## Pages & Components

### Login & Signup

**Location:** `src/app/auth/`

| Component | Description |
|---|---|
| **LoginPage** | Full-screen page with background image. Contains `LoginForm`. Redirects to `/home` on success. |
| **LoginForm** | Email + password reactive form with validation. Calls `AuthService.login()`. |
| **SignupPage** | Full-screen registration page. Contains `SignupForm`. Redirects to `/login` on success. |
| **SignupForm** | Full name, email, password, confirm password. Password match validation. Calls `AuthService.signup()`. |

### Home

**Location:** `src/app/core/home/`

| Component | Description |
|---|---|
| **HomePage** | Landing page with animated stat cards (total incidents, active reports, resolved, users), feature highlights section, and an embedded map. |
| **HomeMap** | Read-only Leaflet map displaying recent incidents as category-colored circle markers with popups. Uses ArcGIS tile layer. |
| **HomeService** | Fetches overview stats from `/api/analytics/overview`. |

### Maps

**Location:** `src/app/core/maps/`

The most complex page — orchestrates incident reporting, inspection, route planning, heatmap visualization, and watched area management.

| Component | Lines | Description |
|---|---|---|
| **MapsPage** | ~160 | Parent orchestrator. Manages state for all child components, handles form submissions, route operations. |
| **MapView** | ~585 | Core Leaflet map. Category-colored markers, marker clustering, heatmap toggle (`L.heatLayer`), route polylines, click-to-report, coordinate selection for watched areas. |
| **IncidentForm** | ~140 | Slide-in panel for creating incidents. Category dropdown, title, description, photo URLs. Shows selected coordinates. |
| **InspectIncidentModal** | ~300 | Full incident detail modal. Comments (add/delete), verifications (verify/dispute/remove), status display, photo gallery, close button. |
| **IncidentCommentsPanel** | — | Comments section within the inspection modal. |
| **RoutePlanner** | ~165 | Start/end point input with swap, route display via OSRM. Shows distance and duration. Start journey / end journey actions. |
| **RouteVerificationModal** | ~120 | Post-journey modal listing incidents encountered along the route with verify/dispute options. |
| **WatchedAreasPanel** | ~150 | Side panel for managing watched areas. Add new (click map for center), set radius, list existing, delete. |

**Key Map Features:**
- Incidents rendered as category-colored circle markers with FontAwesome icons
- Heatmap layer toggle using leaflet.heat
- OSRM-based route planning (external API: `router.project-osrm.org`)
- Click-to-report: click the map to select coordinates for a new incident
- Watched area visualization as circles on the map

### Incidents

**Location:** `src/app/core/incidents/`

| Component | Description |
|---|---|
| **IncidentsPage** | Lists all incidents with search, category filter, status filter, sort options (newest/oldest/most verified), and pagination. Uses Angular signals for reactive filtering. |
| **IncidentFilter** | Filter bar with search input, category dropdown, status dropdown, sort dropdown, and reset button. Emits filter changes to parent. |
| **IncidentCard** | Card displaying incident title, category (with icon & color), status badge, location, date, verification count, and comment count. Navigates to map on click. |

### Analytics

**Location:** `src/app/core/analytics/`

| Component | Description |
|---|---|
| **AnalyticsPage** | Dashboard loading overview stats, category breakdown, and 30-day trend data. Orchestrates child chart components. |
| **OverviewCards** | Displays key metrics: total incidents, total users, resolved count, municipality count. |
| **CategoryChart** | Horizontal bar chart (CSS-based) showing incident distribution by category. Bar widths computed as percentage of the maximum value. |
| **TrendChart** | Vertical bar chart (CSS-based) showing daily incident trends over 30 days. Displays total incidents and resolved counts. Dates formatted as DD/MM. |
| **AnalyticsService** | API calls: `getOverviewStats()`, `getCategoryStats()`, `getTrendData(days)`. |

### Profile

**Location:** `src/app/core/profile/`

| Component | Description |
|---|---|
| **ProfilePage** | Loads user profile and stats on init. Handles profile save and password change. Success/error toast notifications (4s auto-dismiss). |
| **ProfileHeader** | Displays avatar (initials fallback), full name, email, roles, member since date. Trust score with color coding: ≥80 green, ≥50 amber, <50 red. |
| **ProfileStats** | Shows user statistics: total incidents, comments, verifications, trust score, member since. |
| **ProfileEditForm** | Reactive form for editing full name (required, min 2 chars) and avatar URL. |
| **ChangePasswordForm** | Reactive form for current password, new password (min 6 chars), confirm password with mismatch validation. |
| **WatchedAreasList** | Lists user's watched areas with "View on Map" and delete actions. |
| **ProfileService** | API calls: `getMyProfile()`, `updateProfile()`, `changePassword()`, `getMyStats()`. |

### Municipality

**Location:** `src/app/core/municipality/`

Accessible to **Municipality** (role 4) and **Admin** (role 3) users.

| Component | Description |
|---|---|
| **MunicipalityPage** | Lists incidents assigned to the user's municipality. Status filter pills, status change dropdown per incident, pagination. Toast notifications on status update. |
| **MunicipalityService** | API calls: `getIncidentsByMunicipality(id)`, `updateIncidentStatus(incidentId, newStatus)`. |

### Admin

**Location:** `src/app/core/admin/`

Accessible to **Admin** (role 3) users only.

| Component | Description |
|---|---|
| **AdminPage** | Two-tab interface: **Users** and **Incidents**. Users tab: search, role filter, pagination, ban/unban, inline edit (full name). Incidents tab: pagination, inline edit (title, description, category, status), delete with confirmation. |
| **AdminService** | API calls: `getUsers()`, `banUser()`, `unbanUser()`, `updateUser()`, `getIncidents()`, `updateIncident()`, `deleteIncident()`. |

---

## Shared Components

**Location:** `src/app/shared/components/`

| Component | Description |
|---|---|
| **VerticalNavbar** | Collapsible sidebar navigation. Shows menu items based on the user's role. Base items: Home, Maps, Incidents, Analytics, Profile. Additional items for Municipality and Admin roles. Logout triggers a confirmation dialog. |
| **ConfirmationDialog** | Global modal dialog rendered once in the root component. Supports themes: `info`, `success`, `warning`, `danger`. Types: `confirm` (two buttons) and `alert` (one button). Promise-based API via `ConfirmationDialogService`. |

---

## Services & API Map

### Shared Services (`src/app/shared/services/`)

| Service | Method | HTTP | Endpoint |
|---|---|---|---|
| **IncidentsService** | `getCategories()` | GET | `/api/incident-categories` |
| | `createIncident(req)` | POST | `/api/incidents` |
| | `getIncidents(page, pageSize)` | GET | `/api/incidents` |
| | `getIncidentById(id)` | GET | `/api/incidents/{id}` |
| **CommentService** | `getComments(incidentId)` | GET | `/api/incidents/{id}/comments` |
| | `createComment(incidentId, content)` | POST | `/api/incidents/{id}/comments` |
| | `deleteComment(incidentId, commentId)` | DELETE | `/api/incidents/{id}/comments/{commentId}` |
| **VerificationService** | `verify(incidentId)` | POST | `/api/incidents/{id}/verify` |
| | `dispute(incidentId)` | POST | `/api/incidents/{id}/dispute` |
| | `removeVote(incidentId)` | DELETE | `/api/incidents/{id}/verify` |
| | `getVerifications(incidentId)` | GET | `/api/incidents/{id}/verifications` |
| **JourneyService** | `startJourney(req)` | POST | `/api/journeys/start` |
| | `endJourney()` | POST | `/api/journeys/end` |
| | `getActiveJourney()` | GET | `/api/journeys/active` |
| | `fetchOsrmRoute(...)` | GET | External OSRM API |
| **WatchedAreaService** | `getWatchedAreas()` | GET | `/api/watched-areas` |
| | `createWatchedArea(req)` | POST | `/api/watched-areas` |
| | `updateWatchedArea(id, req)` | PUT | `/api/watched-areas/{id}` |
| | `deleteWatchedArea(id)` | DELETE | `/api/watched-areas/{id}` |

### Feature-Specific Services

| Service | Method | HTTP | Endpoint |
|---|---|---|---|
| **AuthService** | `login(cmd)` | POST | `/api/auth/login` |
| | `signup(cmd)` | POST | `/api/auth/register` |
| **HomeService** | `getOverviewStats()` | GET | `/api/analytics/overview` |
| **AnalyticsService** | `getOverviewStats()` | GET | `/api/analytics/overview` |
| | `getCategoryStats()` | GET | `/api/analytics/categories` |
| | `getTrendData(days)` | GET | `/api/analytics/trends?days={days}` |
| **ProfileService** | `getMyProfile()` | GET | `/api/users/me` |
| | `updateProfile(req)` | PUT | `/api/users/me` |
| | `changePassword(req)` | PUT | `/api/users/me/password` |
| | `getMyStats()` | GET | `/api/users/me/stats` |
| **MunicipalityService** | `getIncidentsByMunicipality(id)` | GET | `/api/incidents/by-municipality/{id}` |
| | `updateIncidentStatus(id, status)` | PATCH | `/api/incidents/{id}/status` |
| **AdminService** | `getUsers(...)` | GET | `/api/admin/users` |
| | `banUser(id)` | PATCH | `/api/admin/users/{id}/ban` |
| | `unbanUser(id)` | PATCH | `/api/admin/users/{id}/unban` |
| | `updateUser(id, req)` | PUT | `/api/admin/users/{id}` |
| | `getIncidents(...)` | GET | `/api/admin/incidents` |
| | `updateIncident(id, req)` | PUT | `/api/admin/incidents/{id}` |
| | `deleteIncident(id)` | DELETE | `/api/admin/incidents/{id}` |

---

## Models

**Location:** `src/app/models/`

| File | Key Interfaces |
|---|---|
| `user.model.ts` | `UserProfileResponse`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ChangePasswordRequest`, `UpdateProfileRequest` |
| `incident.model.ts` | `IncidentResponse`, `IncidentDetailResponse`, `CreateIncidentRequest`, `IncidentCategory`, `IncidentStatus` |
| `comment.model.ts` | `CommentResponse`, `CreateCommentRequest` |
| `journey.model.ts` | `StartJourneyRequest`, `StartJourneyResponse`, `EndJourneyResponse`, `UserJourneyResponse` |
| `verification.model.ts` | `VerificationResponse`, `VerificationSummaryResponse` |
| `watched-area.model.ts` | `WatchedAreaResponse`, `CreateWatchedAreaRequest`, `UpdateWatchedAreaRequest` |
| `analytics.model.ts` | `OverviewStats`, `CategoryData`, `TrendData`, `HeatmapPoint` |
| `pagination.model.ts` | `ApiResponse<T>`, `PagedResult<T>`, `PaginationParams`, `IncidentFilterParams` |
| `admin.model.ts` | `AdminUserResponse`, `UpdateUserByAdminRequest`, `AdminIncidentUpdateRequest` |
| `notification.model.ts` | `Notification`, `NotificationPreferences` |

---

## Incident Categories

11 predefined categories defined in `src/app/shared/constants.ts`:

| ID | Label | Icon | Color |
|---|---|---|---|
| 1 | Traffic Accident | `car-burst` | Red |
| 2 | Pothole | `road` | Orange |
| 3 | Road Damage | `road-barrier` | Yellow |
| 4 | Flooding | `water` | Blue |
| 5 | Broken Sign | `sign-hanging` | Purple |
| 6 | Fallen Tree | `tree` | Green |
| 7 | Street Light Out | `lightbulb` | Yellow |
| 8 | Construction | `helmet-safety` | Amber |
| 9 | Traffic Jam | `car` | Slate |
| 10 | Ice / Snow | `snowflake` | Light Blue |
| 11 | Animal on Road | `paw` | Violet |

---

## Authentication & Authorization

### Flow

1. User logs in via `/login` → `AuthService.login()` sends credentials to `/api/auth/login`
2. Backend returns JWT token + user info → stored in `localStorage`
3. `AuthService` exposes reactive signals: `currentUser()`, `isAuthenticated()`, `userRoles()`
4. **Auth Interceptor** (`HttpInterceptorFn`) attaches `Authorization: Bearer <token>` header to all requests targeting `environment.apiUrl`
5. **Auth Guard** (`authGuard`) checks `isAuthenticated()` — redirects to `/login` if false
6. **Role Guard** (`roleGuard(allowedRoles)`) factory function checks user roles — redirects to `/home` if unauthorized

### Roles

| Role | ID | Access |
|---|---|---|
| User | 1 | Home, Maps, Incidents, Analytics, Profile |
| Moderator | 2 | Same as User |
| Admin | 3 | All pages including Admin & Municipality |
| Municipality | 4 | All User pages + Municipality page |

---

## Styling

- **Global styles** in `src/styles.css`: CSS reset, system font stack, dark theme background (`#0f172a`)
- **Component-scoped CSS**: Each component has its own `.css` file using Angular's view encapsulation
- **Icons**: FontAwesome Free 6.x loaded globally via `angular.json`
- **Map tiles**: ArcGIS World Imagery for home map, standard tiles for the maps page
- **Charts**: CSS-based bar charts (no external charting library)
- **Color palette**: Slate tones for backgrounds with category-specific accent colors

---

## Architecture Overview

```
App (root)
├── VerticalNavbar (shared, role-aware sidebar)
├── ConfirmationDialog (shared, global modal)
└── <router-outlet>
    ├── LoginPage → LoginForm
    ├── SignupPage → SignupForm
    ├── HomePage → HomeMap
    ├── MapsPage (authGuard)
    │   ├── MapView (Leaflet + heatmap + markers + routes)
    │   ├── IncidentForm
    │   ├── InspectIncidentModal → IncidentCommentsPanel
    │   ├── RoutePlanner
    │   ├── RouteVerificationModal
    │   └── WatchedAreasPanel
    ├── IncidentsPage (authGuard)
    │   ├── IncidentFilter
    │   └── IncidentCard
    ├── AnalyticsPage (authGuard)
    │   ├── OverviewCards
    │   ├── CategoryChart
    │   └── TrendChart
    ├── ProfilePage (authGuard)
    │   ├── ProfileHeader
    │   ├── ProfileStats
    │   ├── ProfileEditForm
    │   ├── ChangePasswordForm
    │   └── WatchedAreasList
    ├── MunicipalityPage (roleGuard — Municipality/Admin)
    └── AdminPage (roleGuard — Admin only)
```

### Key Technical Patterns

- **Angular 20.x with Signals** — reactive state management without NgRx or other state libraries
- **Standalone Components** — Angular's modern approach, no NgModules
- **Lazy-loaded Routes** — all pages loaded on demand via `loadComponent`
- **Functional Guards & Interceptors** — `CanActivateFn` and `HttpInterceptorFn`
- **JWT Authentication** — token persisted in `localStorage`, attached via interceptor
- **Leaflet Maps** — interactive maps with heatmap layer, route polylines, category-colored markers
- **OSRM Routing** — external open-source API for route calculation
- **CSS-based Charts** — no Chart.js or D3 dependency
- **Promise-based Dialogs** — `ConfirmationDialogService` for async user confirmations

---

## Useful Commands

```bash
# Start development server
ng serve

# Build for production
ng build

# Run unit tests
ng test

# Lint (if configured)
ng lint

# Generate a new component
ng generate component core/feature-name/components/component-name

# Generate a new service
ng generate service shared/services/service-name
```

---

## Related

- [SafeRoad Backend README](../SafeRoad-backend/README.md) — .NET 8 backend API documentation
