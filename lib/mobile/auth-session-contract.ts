export const MOBILE_AUTH_SESSION = {
  storage: "secure-device-storage",
  autoRefresh: true,
  persistSession: true,
  detectSessionInUrl: false,
  foreground: "start-auto-refresh",
  background: "stop-auto-refresh",
} as const;

export type MobileAuthState =
  | "bootstrapping"
  | "authenticated"
  | "unauthenticated"
  | "refreshing"
  | "expired";

export type MobileAuthSessionContract = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  userId: string;
};
