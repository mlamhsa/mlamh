export type TalentQualificationReason =
  | "missing_profile_approval"
  | "inactive_profile"
  | "invalid_talent_status"
  | "not_published"
  | "missing_image"
  | "missing_name"
  | "missing_role"
  | "missing_city";

export type TalentQualificationInput = {
  id?: number | string | null;
  status?: string | null;
  published?: boolean | null;
  image_url?: string | null;
  gallery_images?: string[] | string | null;
  name_ar?: string | null;
  name_en?: string | null;
  display_name_ar?: string | null;
  display_name_en?: string | null;
  primary_role?: string | null;
  category_slug?: string | null;
  category_ar?: string | null;
  category_en?: string | null;
  city_slug?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  profile_approval_status?: string | null;
  profile_status?: string | null;
};

export type TalentQualificationEvaluation = {
  qualified: boolean;
  state: "qualified" | "not_ready";
  reasons: TalentQualificationReason[];
  image: string | null;
  role: string | null;
};

const VALID_TALENT_STATUSES = new Set(["approved", "active"]);
const VALID_PRIMARY_ROLES = new Set(["actor", "model"]);
// MLAMH MVP qualification is intentionally limited to Actor + Model. The
// category fallback exists only for legacy rows that predate primary_role.
const VALID_CATEGORY_SLUGS = new Set(["actor", "model"]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidHttpUrl(value: unknown) {
  const candidate = text(value);
  if (!candidate) return false;

  try {
    const url = new URL(candidate);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function normalizeGalleryImages(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean);
  } catch {
    // Legacy rows may contain a single URL instead of JSON.
  }

  return [raw];
}

export function getValidTalentImage(
  talent: Pick<TalentQualificationInput, "image_url" | "gallery_images">,
): string | null {
  if (isValidHttpUrl(talent.image_url)) return text(talent.image_url);

  return (
    normalizeGalleryImages(talent.gallery_images).find(isValidHttpUrl) ?? null
  );
}

function getTalentRole(talent: TalentQualificationInput) {
  const primaryRole = text(talent.primary_role).toLowerCase();
  if (primaryRole) {
    return VALID_PRIMARY_ROLES.has(primaryRole) ? primaryRole : null;
  }

  const categorySlug = text(talent.category_slug).toLowerCase();
  if (VALID_CATEGORY_SLUGS.has(categorySlug)) return categorySlug;

  return null;
}

function hasApprovedProfile(talent: TalentQualificationInput) {
  const approval = text(talent.profile_approval_status).toLowerCase();

  if (approval) return approval === "approved";

  // Compatibility for legacy public talents created before profiles became the
  // account approval source of truth. New linked profiles still must be approved.
  return (
    talent.published === true &&
    VALID_TALENT_STATUSES.has(text(talent.status).toLowerCase())
  );
}

export function evaluateTalentQualification(
  talent: TalentQualificationInput,
): TalentQualificationEvaluation {
  const reasons: TalentQualificationReason[] = [];
  const status = text(talent.status).toLowerCase();
  const profileStatus = text(talent.profile_status).toLowerCase();
  const image = getValidTalentImage(talent);
  const role = getTalentRole(talent);

  if (!hasApprovedProfile(talent)) reasons.push("missing_profile_approval");
  if (profileStatus && profileStatus !== "active") reasons.push("inactive_profile");
  if (!VALID_TALENT_STATUSES.has(status)) reasons.push("invalid_talent_status");
  if (talent.published !== true) reasons.push("not_published");
  if (!image) reasons.push("missing_image");
  if (
    !text(talent.display_name_ar) &&
    !text(talent.display_name_en) &&
    !text(talent.name_ar) &&
    !text(talent.name_en)
  ) {
    reasons.push("missing_name");
  }
  if (!role) reasons.push("missing_role");
  if (!text(talent.city_slug) && !text(talent.city_ar) && !text(talent.city_en)) {
    reasons.push("missing_city");
  }

  const qualified = reasons.length === 0;
  return {
    qualified,
    state: qualified ? "qualified" : "not_ready",
    reasons,
    image,
    role,
  };
}

const REASON_LABELS: Record<
  TalentQualificationReason,
  { ar: string; en: string }
> = {
  missing_image: { ar: "أضف صورة", en: "Add a photo" },
  missing_city: { ar: "حدد مدينتك", en: "Choose your city" },
  missing_role: { ar: "حدد تخصصك", en: "Choose your specialty" },
  missing_name: { ar: "أكمل البيانات المطلوبة", en: "Complete required details" },
  missing_profile_approval: { ar: "أكمل البيانات المطلوبة", en: "Complete required details" },
  inactive_profile: { ar: "أكمل البيانات المطلوبة", en: "Complete required details" },
  invalid_talent_status: { ar: "أكمل البيانات المطلوبة", en: "Complete required details" },
  not_published: { ar: "أكمل البيانات المطلوبة", en: "Complete required details" },
};

export function getTalentQualificationReasons(
  input: TalentQualificationInput | TalentQualificationEvaluation,
  locale: "ar" | "en" = "ar",
): string[] {
  const evaluation = "reasons" in input ? input : evaluateTalentQualification(input);
  return Array.from(
    new Set(evaluation.reasons.map((reason) => REASON_LABELS[reason][locale])),
  );
}

export function isTalentPubliclyVisible(talent: TalentQualificationInput) {
  return evaluateTalentQualification(talent).qualified;
}
