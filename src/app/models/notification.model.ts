export type NotificationType =
  | 'IncidentCreated'
  | 'IncidentVerified'
  | 'IncidentStatusChanged'
  | 'IncidentResolved'
  | 'CommentAdded'
  | 'WatchedAreaAlert'
  | 'BadgeEarned'
  | 'SystemAnnouncement';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedIncidentId?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  email: NotificationChannelPrefs;
  push: NotificationChannelPrefs;
  inApp: NotificationChannelPrefs;
}

export interface NotificationChannelPrefs {
  enabled: boolean;
  incidentCreated: boolean;
  incidentVerified: boolean;
  incidentStatusChanged: boolean;
  commentAdded: boolean;
  watchedAreaAlert: boolean;
  badgeEarned: boolean;
}
