import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type TalentAccessTier = "visitor" | "publisher_basic" | "publisher_approved" | "publisher_verified" | "publisher_trusted";

export type TalentAccessContext = {
  tier: TalentAccessTier;
  authenticated: boolean;
  publisherId: number | null;
  approved: boolean;
  verified: boolean;
  canBrowsePublic: true;
  canOpenVerifiedPublisherProfiles: boolean;
  canInviteToOpportunity: boolean;
  canSeeContactDetails: false;
  canBulkExport: false;
  maxDirectoryPageSize: number;
};

const VISITOR: TalentAccessContext = {
  tier: "visitor",
  authenticated: false,
  publisherId: null,
  approved: false,
  verified: false,
  canBrowsePublic: true,
  canOpenVerifiedPublisherProfiles: false,
  canInviteToOpportunity: false,
  canSeeContactDetails: false,
  canBulkExport: false,
  maxDirectoryPageSize: 12,
};

export function visitorTalentAccess(): TalentAccessContext { return { ...VISITOR }; }

export async function resolveTalentAccess(userId: string | null | undefined): Promise<TalentAccessContext> {
  if (!userId) return visitorTalentAccess();
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,account_type,approval_status,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profile || isRestrictedAccountStatus(profile.status)) return { ...VISITOR, authenticated: true };
  if (profile.account_type !== "publisher") return { ...VISITOR, authenticated: true };

  const { data: publisher } = await supabase
    .from("publishers")
    .select("id,verified,verification_status,status")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!publisher || isRestrictedAccountStatus(publisher.status)) return { ...VISITOR, authenticated: true };

  const approved = profile.approval_status === "approved";
  const verified = approved && Boolean(publisher.verified) && publisher.verification_status === "verified";
  const tier: TalentAccessTier = verified ? "publisher_verified" : approved ? "publisher_approved" : "publisher_basic";

  return {
    tier,
    authenticated: true,
    publisherId: Number(publisher.id),
    approved,
    verified,
    canBrowsePublic: true,
    canOpenVerifiedPublisherProfiles: verified,
    canInviteToOpportunity: approved,
    // Contact details never unlock merely because a publisher can browse/discover.
    // They remain inside the accepted selection / conversation workflow.
    canSeeContactDetails: false,
    canBulkExport: false,
    maxDirectoryPageSize: verified ? 24 : approved ? 20 : 12,
  };
}

export function publicTalentAccessPayload(access: TalentAccessContext) {
  return {
    tier: access.tier,
    approved: access.approved,
    verified: access.verified,
    canInviteToOpportunity: access.canInviteToOpportunity,
    contactDetailsProtected: true,
    bulkExportAllowed: false,
  };
}
