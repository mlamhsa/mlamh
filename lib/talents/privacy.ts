import { createAdminClient } from "@/lib/supabase/admin";

export type TalentVisibility = "public" | "verified_publishers" | "private";

export type TalentPrivacySettings = {
  profileVisibility: TalentVisibility;
  photoVisibility: TalentVisibility;
  allowSearchIndexing: boolean;
  allowMlamhShare: boolean;
  requirePrivateShareApproval: boolean;
};

const VISIBILITY_RANK: Record<TalentVisibility, number> = { public: 0, verified_publishers: 1, private: 2 };

function isVisibility(value: unknown): value is TalentVisibility {
  return value === "public" || value === "verified_publishers" || value === "private";
}

export function normalizeTalentPrivacyInput(input: unknown): TalentPrivacySettings | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  if (!isVisibility(value.profileVisibility) || !isVisibility(value.photoVisibility)) return null;
  if (typeof value.allowMlamhShare !== "boolean" || typeof value.requirePrivateShareApproval !== "boolean") return null;
  if (VISIBILITY_RANK[value.photoVisibility] < VISIBILITY_RANK[value.profileVisibility]) return null;

  return {
    profileVisibility: value.profileVisibility,
    photoVisibility: value.photoVisibility,
    allowSearchIndexing: value.profileVisibility === "public" && value.allowSearchIndexing === true,
    allowMlamhShare: value.allowMlamhShare,
    requirePrivateShareApproval: value.requirePrivateShareApproval,
  };
}

function mapPrivacy(row: {
  profile_visibility: TalentVisibility;
  photo_visibility: TalentVisibility;
  allow_search_indexing: boolean;
  allow_mlamh_share: boolean;
  require_private_share_approval: boolean;
}): TalentPrivacySettings {
  return {
    profileVisibility: row.profile_visibility,
    photoVisibility: row.photo_visibility,
    allowSearchIndexing: row.allow_search_indexing,
    allowMlamhShare: row.allow_mlamh_share,
    requirePrivateShareApproval: row.require_private_share_approval,
  };
}

export async function getTalentPrivacySettings(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("talents")
    .select("id,profile_visibility,photo_visibility,allow_search_indexing,allow_mlamh_share,require_private_share_approval")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false as const, code: "PRIVACY_LOOKUP_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };

  const { count, error: historyError } = await admin
    .from("talent_privacy_history")
    .select("id", { count: "exact", head: true })
    .eq("talent_id", data.id);
  if (historyError) return { ok: false as const, code: "PRIVACY_HISTORY_LOOKUP_FAILED" as const };

  return {
    ok: true as const,
    item: mapPrivacy(data as Parameters<typeof mapPrivacy>[0]),
    configured: (count ?? 0) > 0,
  };
}

export async function isTalentPrivacyConfigured(userId: string) {
  const result = await getTalentPrivacySettings(userId);
  return result.ok && result.configured === true;
}

export async function updateTalentPrivacySettings(userId: string, input: unknown, source = "user") {
  const normalized = normalizeTalentPrivacyInput(input);
  if (!normalized) return { ok: false as const, code: "INVALID_INPUT" as const };

  const admin = createAdminClient();
  const { data: talent, error: lookupError } = await admin.from("talents").select("id").eq("user_id", userId).maybeSingle();
  if (lookupError) return { ok: false as const, code: "PRIVACY_LOOKUP_FAILED" as const };
  if (!talent) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };

  const dbValues = {
    profile_visibility: normalized.profileVisibility,
    photo_visibility: normalized.photoVisibility,
    allow_search_indexing: normalized.allowSearchIndexing,
    allow_mlamh_share: normalized.allowMlamhShare,
    require_private_share_approval: normalized.requirePrivateShareApproval,
  };

  const { error: updateError } = await admin.from("talents").update(dbValues).eq("id", talent.id).eq("user_id", userId);
  if (updateError) return { ok: false as const, code: "PRIVACY_UPDATE_FAILED" as const };

  const { error: historyError } = await admin.from("talent_privacy_history").insert({ talent_id: talent.id, user_id: userId, ...dbValues, source });
  if (historyError) return { ok: false as const, code: "PRIVACY_HISTORY_FAILED" as const };

  return { ok: true as const, item: normalized, configured: true as const };
}
