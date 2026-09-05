import { createAdminClient } from "@/lib/supabase/admin";

const TALENT_TYPES = {
  actor: { ar: "ممثل", en: "Actor" },
  model: { ar: "مودل", en: "Model" },
} as const;

type TalentType = keyof typeof TALENT_TYPES;

function createTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "");
  return `${base || "talent"}-${userId.slice(0, 8)}`;
}

export async function completeMobileTalentOnboarding(
  userId: string,
  email: string | null | undefined,
  userMetadata: Record<string, unknown> | null | undefined,
  rawTalentType: unknown,
) {
  const talentType = typeof rawTalentType === "string" ? rawTalentType.trim().toLowerCase() : "";
  if (talentType !== "actor" && talentType !== "model") {
    return { ok: false as const, code: "INVALID_TALENT_TYPE" as const };
  }

  const selected = TALENT_TYPES[talentType as TalentType];
  const admin = createAdminClient();
  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("id,account_type,display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileLookupError) return { ok: false as const, code: "PROFILE_LOOKUP_FAILED" as const };
  if (existingProfile?.account_type && existingProfile.account_type !== "talent") {
    return { ok: false as const, code: "ACCOUNT_TYPE_CONFLICT" as const };
  }

  const metadataName = String(
    userMetadata?.display_name ?? userMetadata?.full_name ?? "",
  ).trim();
  const displayName = String(existingProfile?.display_name || metadataName || email || "Talent").trim() || "Talent";

  let profileId = existingProfile?.id ?? null;
  if (!profileId) {
    const { data: createdProfile, error: profileInsertError } = await admin
      .from("profiles")
      .insert({
        user_id: userId,
        account_type: "talent",
        display_name: displayName,
        status: "active",
        onboarding_status: "profile_in_progress",
        onboarding_step: "talent_profile",
      })
      .select("id")
      .single();
    if (profileInsertError || !createdProfile) {
      return { ok: false as const, code: "PROFILE_CREATE_FAILED" as const };
    }
    profileId = createdProfile.id;
  }

  const { error: talentUserError } = await admin.from("talent_users").upsert(
    { id: userId, email: email ?? null, role: "talent" },
    { onConflict: "id" },
  );
  if (talentUserError) return { ok: false as const, code: "TALENT_USER_FAILED" as const };

  const { data: existingTalent, error: talentLookupError } = await admin
    .from("talents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (talentLookupError) return { ok: false as const, code: "TALENT_LOOKUP_FAILED" as const };

  let talentId: number;
  if (existingTalent) {
    const { data: updatedTalent, error: updateError } = await admin
      .from("talents")
      .update({
        category_slug: talentType,
        category_en: selected.en,
        category_ar: selected.ar,
        primary_role: talentType,
      })
      .eq("id", existingTalent.id)
      .eq("user_id", userId)
      .select("id")
      .single();
    if (updateError || !updatedTalent) return { ok: false as const, code: "TALENT_UPDATE_FAILED" as const };
    talentId = Number(updatedTalent.id);
  } else {
    const avatarUrl = String(userMetadata?.avatar_url ?? userMetadata?.picture ?? "").trim() || null;
    const { data: createdTalent, error: insertError } = await admin
      .from("talents")
      .insert({
        user_id: userId,
        name_en: displayName,
        name_ar: displayName,
        display_name_en: displayName,
        display_name_ar: displayName,
        category_slug: talentType,
        category_en: selected.en,
        category_ar: selected.ar,
        primary_role: talentType,
        image_url: avatarUrl,
        slug: createTalentSlug(displayName, userId),
        status: "draft",
        published: false,
        verified: false,
        featured: false,
        profile_completion: 0,
      })
      .select("id")
      .single();
    if (insertError || !createdTalent) return { ok: false as const, code: "TALENT_CREATE_FAILED" as const };
    talentId = Number(createdTalent.id);
  }

  const { error: onboardingError } = await admin
    .from("profiles")
    .update({
      account_type: "talent",
      onboarding_status: "completed",
      onboarding_step: "dashboard",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("user_id", userId);
  if (onboardingError) return { ok: false as const, code: "ONBOARDING_UPDATE_FAILED" as const };

  return { ok: true as const, talentId, talentType };
}
