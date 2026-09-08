export type PushPlatform = "ios" | "android";

export type PushDeviceRegistration = {
  userId: string;
  platform: PushPlatform;
  expoPushToken: string;
  deviceId?: string | null;
  appVersion?: string | null;
  locale: "ar" | "en";
  enabled: boolean;
};

export type PushNotificationKind =
  | "application_accepted"
  | "application_rejected"
  | "application_shortlisted"
  | "message_received"
  | "opportunity_invitation"
  | "system";

export type PushNotificationPayload = {
  kind: PushNotificationKind;
  title: string;
  body: string;
  deepLink?: string | null;
  referenceId?: string | number | null;
};

export const PUSH_DELIVERY_POLICY = {
  serverOnlyProviderCredentials: true,
  tokenOwnedByAuthenticatedUser: true,
  invalidateUnregisteredTokens: true,
  neverIncludeSensitiveProfileData: true,
} as const;
