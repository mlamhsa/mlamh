import { createAdminClient } from "@/lib/supabase/admin";

export type MobileAccountType = "talent" | "publisher";

export async function getMobileAccountContext(userId: string) {
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,account_type,display_name,approval_status,status,onboarding_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, code: "ACCOUNT_LOOKUP_FAILED" as const };
  if (!profile || (profile.account_type !== "talent" && profile.account_type !== "publisher")) {
    return { ok: false as const, code: "ACCOUNT_NOT_FOUND" as const };
  }

  let entityId: number | null = null;
  if (profile.account_type === "talent") {
    const { data } = await supabase.from("talents").select("id").eq("user_id", userId).maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
  } else {
    const { data } = await supabase.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    entityId = data?.id ? Number(data.id) : null;
  }

  return {
    ok: true as const,
    account: {
      type: profile.account_type as MobileAccountType,
      displayName: profile.display_name ?? null,
      approvalStatus: profile.approval_status ?? null,
      status: profile.status ?? null,
      onboardingStatus: profile.onboarding_status ?? null,
      entityId,
    },
  };
}
