export type NotificationCategory =
  | "application"
  | "message"
  | "invitation"
  | "system";

export type MobileNotification = {
  id: number | string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string | null;
  category: NotificationCategory;
  referenceId: string | number | null;
  eventType: string | null;
};

export type NotificationsResponse = {
  items: MobileNotification[];
  unreadCount: number;
};

export type MarkNotificationReadResult =
  | { ok: true; id: number | string }
  | { ok: false; code: "NOT_FOUND" | "UPDATE_FAILED" };
