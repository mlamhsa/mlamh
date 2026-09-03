export type NotificationCategory =
  | "application"
  | "message"
  | "invitation"
  | "system";

export type NotificationTarget =
  | { type: "conversation"; id: string | number }
  | { type: "opportunity"; id: string | number }
  | { type: "publisher_opportunity"; id: string | number }
  | { type: "talent_applications" }
  | { type: "none" };

export type MobileNotification = {
  id: number | string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string | null;
  category: NotificationCategory;
  referenceId: string | number | null;
  eventType: string | null;
  target: NotificationTarget;
};

export type NotificationsResponse = {
  items: MobileNotification[];
  unreadCount: number;
};

export type MarkNotificationReadResult =
  | { ok: true; id: number | string }
  | { ok: false; code: "NOT_FOUND" | "UPDATE_FAILED" };
