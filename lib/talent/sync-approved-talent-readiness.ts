import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";

export type ApprovedTalentReadinessSyncResult = {
  approved: boolean;
  isReady: boolean;
  published: boolean;
  missingRequirementKeys: string[];
};

/**
 * Keep approval and current operational readiness separate.
 *
 * An approved talent stays approved after self-service edits. If a required
 * profile field becomes incomplete, the profile is temporarily removed from
 * public discovery by setting published=false. Once the requirements are
 * complete again, a public profile is automatically republished.
 */
export async function syncApprovedTalentReadiness(
  userId: string,
): Promise<ApprovedTalentReadinessSyncResult | null> {
  const admin = createAdminClient();

  const [{ data: profile, error: profileError }, { data: talent, error: talentError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("approval_status, phone, data_accuracy_contact_consent")
        .eq("user_id", userId)
        .eq("account_type", "talent")
        .maybeSingle(),
      admin
        .from("talents")
        .select(`
          id,
          published,
          profile_visibility,
          name_ar,
          name_en,
          image_url,
          primary_role,
          category_slug,
          base_country_code,
          city_slug,
          gender,
          nationality,
          nationality_slug,
          date_of_birth
        `)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (profileError || talentError) {
    throw new Error(
      `[syncApprovedTalentReadiness] ${profileError?.message || talentError?.message || "Unable to load talent state."}`,
    );
  }

  if (!profile || !talent) return null;

  const readiness = getTalentProfileReadiness({
    ...talent,
    phone: profile.phone,
    data_accuracy_contact_consent:
      profile.data_accuracy_contact_consent === true,
  });
  const approved = profile.approval_status === "approved";
  const visibility = String(talent.profile_visibility ?? "")
    .trim()
    .toLowerCase();
  const shouldPublish = approved && readiness.isReady && visibility === "public";

  if (approved && Boolean(talent.published) !== shouldPublish) {
    const { error: updateError } = await admin
      .from("talents")
      .update({ published: shouldPublish })
      .eq("id", talent.id)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(
        `[syncApprovedTalentReadiness:update] ${updateError.message}`,
      );
    }
  }

  return {
    approved,
    isReady: readiness.isReady,
    published: shouldPublish,
    missingRequirementKeys: readiness.missingRequirements.map(
      (requirement) => requirement.key,
    ),
  };
}
