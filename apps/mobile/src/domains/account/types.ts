export type MobileAccountRole = "talent" | "publisher";

export type PublisherCapabilities = {
  canCreateQuick: boolean;
  canCreateCasting: boolean;
  canInvite: boolean;
  canViewProtectedTalentContent: boolean;
};

export type MobileAccountContext = {
  type: MobileAccountRole;
  displayName: string | null;
  phone: string | null;
  phoneVerified: boolean;
  approvalStatus: string | null;
  status: string | null;
  onboardingStatus: string | null;
  onboardingStep: string | null;
  entityId: number | null;
  countryCode: string | null;
  publisherType?: string | null;
  verificationStatus?: string | null;
  verified?: boolean;
  capabilities?: PublisherCapabilities;
};

export type MobileAccountResponse =
  | { ok: true; account: MobileAccountContext }
  | { ok: false; code: string };
