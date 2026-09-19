import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type MobileAccountType = "talent" | "publisher";

export async function getMobileAccountContext(userId: string) {
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,account_type,display_name,phone,phone_verified_at,approval_status,status,onboarding_status,onboarding_step")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, code: "ACCOUNT_LOOKUP_FAILED" as const };
  if (!profile) {
    return { ok: false as const, code: "ACCOUNT_NOT_FOUND" as const };
  }
  if (profile.account_type !== "talent" && profile.account_type !== "publisher") {
    return {
      ok: false as const,
      code: "ACCOUNT_TYPE_UNSUPPORTED" as const,
      accountType: profile.account_type ?? null,
    };
  }

  let entityId: number | null = null;
  let countryCode: string | null = null;
  let publisherType: string | null = null;
  let verificationStatus: string | null = null;
  let verified = false;
  let canCreate = false;
  let canCreateQuick = false;
  let canCreateCasting = false;

  if (profile.account_type === "talent") {
    const { data } = await supabase
      .from("talents")
      .select("id,base_country_code")
      .eq("user_id", userId)
      .maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
    countryCode = data?.base_country_code?.toUpperCase() ?? null;
  } else {
    const { data } = await supabase
      .from("publishers")
      .select("id,country_code,publisher_type,verified,verification_status,status")
      .eq("profile_id", profile.id)
      .maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
    countryCode = data?.country_code?.toUpperCase() ?? null;
    publisherType = data?.publisher_type ?? null;
    verificationStatus = data?.verification_status ?? null;
    verified = data?.verified === true;

    const approved = profile.approval_status === "approved";
    const unrestricted =
      !isRestrictedAccountStatus(profile.status) &&
      !isRestrictedAccountStatus(data?.status ?? null);
    canCreate = Boolean(entityId && approved && unrestricted);
    canCreateQuick = canCreate;
    canCreateCasting = canCreate && publisherType !== "individual";
  }

  if (entityId === null) {
    return {
      ok: false as const,
      code: profile.account_type === "publisher"
        ? "PUBLISHER_ONBOARDING_INCOMPLETE" as const
        : "TALENT_ONBOARDING_INCOMPLETE" as const,
    };
  }

  return {
    ok: true as const,
    account: {
      type: profile.account_type as MobileAccountType,
      displayName: profile.display_name ?? null,
      phone: profile.phone ?? null,
      phoneVerified: Boolean(profile.phone_verified_at),
      approvalStatus: profile.approval_status ?? null,
      status: profile.status ?? null,
      onboardingStatus: profile.onboarding_status ?? null,
      onboardingStep: profile.onboarding_step ?? null,
      entityId,
      countryCode,
      publisherType,
      verificationStatus,
      verified,
      capabilities: {
        canCreate,
        canCreateQuick,
        canCreateCasting,
      },
    },
  };
}