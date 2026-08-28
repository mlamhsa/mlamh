export const EVENT_TARGETS = {
  ADMIN: "admin",
  TALENT: "talent",
  PUBLISHER: "publisher",
  AUTH_USER: "auth_user",
} as const;
  
  export type EventTarget =
    (typeof EVENT_TARGETS)[keyof typeof EVENT_TARGETS];