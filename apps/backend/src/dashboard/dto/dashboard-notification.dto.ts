export class NotificationItemDto {
  id: string;
  type: 'alert' | 'incident' | 'system';
  message: string;
  read: boolean;
  createdAt: Date;
}

export class DashboardNotificationsDto {
  unread: number;
  notifications: NotificationItemDto[];
}
