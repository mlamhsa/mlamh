import { createAdminClient } from "@/lib/supabase/admin";

export type MobileTalentProfileUpdateInput = {
  displayName?: unknown;
  bio?: unknown;
  skills?: unknown;
};

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (typeof value !== "string") return { ok: false as const };
  const normalized = value.trim();
  if (normalized.length > maxLength) return { ok: false as const };
  return { ok: true as const, value: normalized || null };
}

function normalizeSkills(value: unknown) {
  if (value === undefined) return { ok: true as const, value: undefined };
  if (!Array.isArray(value) || value.length > 12) return { ok: false as const };
  const skills = [...new Set(value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean))];
  if (skills.some((skill) => skill.length > 40)) return { ok: false as const };
  return { ok: true as const, value: skills };
}

export async function updateMobileTalentProfile({ userId, locale, input }: { userId: string; locale: "ar" | "en"; input: MobileTalentProfileUpdateInput }) {
  const displayName = normalizeOptionalText(input.displayName, 80);
  const bio = normalizeOptionalText(input.bio, 1200);
  const skills = normalizeSkills(input.skills);
  if (!displayName.ok || !bio.ok || !skills.ok) return { ok: false as const, code: "INVALID_INPUT" as const };

  const values: Record<string, unknown> = {};
  if (displayName.value !== undefined) values[locale === "ar" ? "display_name_ar" : "display_name_en"] = displayName.value;
  if (bio.value !== undefined) values[locale === "ar" ? "bio_ar" : "bio_en"] = bio.value;
  if (skills.value !== undefined) values.skills = skills.value;
  if (Object.keys(values).length === 0) return { ok: false as const, code: "INVALID_INPUT" as const };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("talents").update(values).eq("user_id", userId).select("id").maybeSingle();
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  if (!data) return { ok: false as const, code: "TALENT_NOT_FOUND" as const };
  return { ok: true as const, id: Number(data.id) };
}
