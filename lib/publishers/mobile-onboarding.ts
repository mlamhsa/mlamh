import { createAdminClient } from "@/lib/supabase/admin";

const ORGANIZATION_TYPES = new Set([
  "production_company",
  "advertising_agency",
  "casting_agency",
  "talent_agency",
  "brand",
  "content_company",
  "other",
]);

export async function completeMobilePublisherOnboarding(
  userId: string,
  email: string | null | undefined,
  userMetadata: Record<string, unknown> | null | undefined,
  input: Record<string, unknown>,
) {
  const mode = typeof input.publisherMode === "string" ? input.publisherMode.trim() : "";
  const requestedType = typeof input.publisherType === "string" ? input.publisherType.trim() : "";
  if (mode !== "individual" && mode !== "organization") return { ok: false as const, code: "INVALID_PUBLISHER_MODE" as const };
  const publisherType = mode === "individual" ? "individual" : requestedType;
  if (mode === "organization" && !ORGANIZATION_TYPES.has(publisherType)) return { ok: false as const, code: "INVALID_PUBLISHER_TYPE" as const };

  const admin = createAdminClient();
  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id,account_type,display_name,phone,approval_status")
    .eq("user_id", userId)
    .maybeSingle();
  if (profileLookupError) return { ok: false as const, code: "PROFILE_LOOKUP_FAILED" as const };
  if (existingProfile?.account_type && existingProfile.account_type !== "publisher") return { ok: false as const, code: "ACCOUNT_TYPE_CONFLICT" as const };

  const contactName = String(
    userMetadata?.contact_name ?? userMetadata?.full_name ?? existingProfile?.display_name ?? email ?? "Publisher",
  ).trim() || "Publisher";
  const metadataPhone = String(userMetadata?.phone ?? existingProfile?.phone ?? "").trim() || null;

  let profileId = existingProfile?.id ?? null;
  if (!profileId) {
    const { data: profile, error } = await admin.from("profiles").insert({
      user_id: userId,
      account_type: "publisher",
      display_name: contactName,
      phone: metadataPhone,
      status: "active",
      onboarding_status: "profile_in_progress",
      onboarding_step: "publisher_profile",
      approval_status: "not_submitted",
    }).select("id").single();
    if (error || !profile) return { ok: false as const, code: "PROFILE_CREATE_FAILED" as const };
    profileId = profile.id;
  }

  const { data: existingPublisher, error: publisherLookupError } = await admin
    .from("publishers")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (publisherLookupError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };

  let publisherId: number;
  const publisherValues = {
    publisher_type: publisherType,
    contact_name: contactName,
    verified: false,
    verification_status: "unverified",
    verification_method: null,
    verification_email: null,
    verification_document_url: null,
    verification_submitted_at: null,
    verification_reviewed_at: null,
  };
  if (existingPublisher) {
    const { data, error } = await admin.from("publishers").update(publisherValues).eq("id", existingPublisher.id).eq("profile_id", profileId).select("id").single();
    if (error || !data) return { ok: false as const, code: "PUBLISHER_UPDATE_FAILED" as const };
    publisherId = Number(data.id);
  } else {
    const { data, error } = await admin.from("publishers").insert({ profile_id: profileId, ...publisherValues }).select("id").single();
    if (error || !data) return { ok: false as const, code: "PUBLISHER_CREATE_FAILED" as const };
    publisherId = Number(data.id);
  }

  const { error: onboardingError } = await admin.from("profiles").update({
    account_type: "publisher",
    display_name: existingProfile?.display_name || contactName,
    phone: existingProfile?.phone || metadataPhone,
    onboarding_status: "completed",
    onboarding_step: "dashboard",
    approval_status: existingProfile?.approval_status ?? "not_submitted",
    updated_at: new Date().toISOString(),
  }).eq("id", profileId).eq("user_id", userId);
  if (onboardingError) return { ok: false as const, code: "ONBOARDING_UPDATE_FAILED" as const };

  return { ok: true as const, publisherId, publisherType };
}
