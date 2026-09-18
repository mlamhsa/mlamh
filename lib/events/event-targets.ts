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
  SCENE_ARTICLE: "scene_article",
  CASTING_FILE: "casting_file",
  MANAGED_CASTING_INVITATION: "managed_casting_invitation",
  CASTING_ROLE: "casting_role",
  CASTING_SHORTLIST: "casting_shortlist",
} as const;
  
  export type EventTarget =
    (typeof EVENT_TARGETS)[keyof typeof EVENT_TARGETS];