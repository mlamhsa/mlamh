export type RealtimeTopic =
  | { type: "conversation"; conversationId: number | string }
  | { type: "notifications"; userId: string };

export const REALTIME_BOUNDARY = {
  conversationsReadViaServerApi: true,
  messageHistoryReadViaServerApi: true,
  messageWritesViaServerApi: true,
  realtimeMessageInsertEventsAllowedAfterMembershipCheck: true,
  notificationsRealtimeOptional: true,
} as const;

export type RealtimeMessageEvent = {
  type: "message_inserted";
  conversationId: number | string;
  messageId: number | string;
  senderUserId: string;
  createdAt: string;
};

export type RealtimeNotificationEvent = {
  type: "notification_created";
  notificationId: number | string;
  createdAt: string;
};
