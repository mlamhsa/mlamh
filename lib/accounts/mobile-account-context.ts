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
  if (!profile || (profile.account_type !== "talent" && profile.account_type !== "publisher")) {
    return { ok: false as const, code: "ACCOUNT_NOT_FOUND" as const };
  }

  let entityId: number | null = null;
  let countryCode: string | null = null;
  let displayName = profile.display_name?.trim() || null;
  let avatarUrl: string | null = null;

  if (profile.account_type === "talent") {
    const { data } = await supabase
      .from("talents")
      .select("id,base_country_code,name_ar,name_en,image_url")
      .eq("user_id", userId)
      .maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
    countryCode = data?.base_country_code?.toUpperCase() ?? null;
    displayName = data?.name_ar?.trim() || data?.name_en?.trim() || displayName;
    avatarUrl = data?.image_url?.trim() || null;
  } else {
    const { data } = await supabase
      .from("publishers")
      .select("id,country_code,company_name,contact_name,profile_image_url")
      .eq("profile_id", profile.id)
      .maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
    countryCode = data?.country_code?.toUpperCase() ?? null;
    displayName = data?.company_name?.trim() || data?.contact_name?.trim() || displayName;
    avatarUrl = data?.profile_image_url?.trim() || null;
  }

  return {
    ok: true as const,
    account: {
      type: profile.account_type as MobileAccountType,
      displayName,
      avatarUrl,
      phone: profile.phone ?? null,
      phoneVerified: Boolean(profile.phone_verified_at),
      approvalStatus: profile.approval_status ?? null,
      status: profile.status ?? null,
      onboardingStatus: profile.onboarding_status ?? null,
      onboardingStep: profile.onboarding_step ?? null,
      entityId,
      countryCode,
    },
  };
}
