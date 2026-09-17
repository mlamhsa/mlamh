import { mobileApiRequest } from "@/src/api/client";
import type { NotificationsResponse } from "@/src/domains/notifications/types";

export function getMobileNotifications() {
  return mobileApiRequest<NotificationsResponse>("/api/notifications");
}

export function markMobileNotificationRead(id: string | number) {
  return mobileApiRequest<{ ok: true; id: string | number }>(`/api/notifications/${id}/read`, { method: "POST" });
}
