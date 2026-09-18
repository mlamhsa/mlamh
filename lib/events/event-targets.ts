export const EVENT_TARGETS = {
  ADMIN: "admin",
  TALENT: "talent",
  PUBLISHER: "publisher",
  AUTH_USER: "auth_user",
  OPPORTUNITY: "opportunity",
  APPLICATION: "application",
  CLAIM_REQUEST: "claim_request",
  SUPPORT: "support",
  MESSAGE: "message",
  CASTING_PROJECT: "casting_project",
  PAYMENT: "payment",
  NOTIFICATION: "notification",
} as const;
  
  export type EventTarget =
    (typeof EVENT_TARGETS)[keyof typeof EVENT_TARGETS];