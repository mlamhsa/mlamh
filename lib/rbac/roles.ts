export const ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    CONTENT_MANAGER: "content_manager",
    MODERATOR: "moderator",
    VIEWER: "viewer",
  } as const;
  
  export type RoleKey =
    (typeof ROLES)[keyof typeof ROLES];