type CompletionTalent = {
  primary_role?: string | null;

  image_url?: string | null;

  city_slug?: string | null;
  city_en?: string | null;
  city_ar?: string | null;

  date_of_birth?: string | null;

  bio_en?: string | null;
  bio_ar?: string | null;

  languages?: string[] | null;
  dialects?: string[] | null;
  skills?: string[] | null;

  availability_status?: string | null;
  experience_years?: number | string | null;

  portfolio_url?: string | null;
  showreel_url?: string | null;
  video_intro?: string | null;
  gallery_images?: string[] | null;
  previous_work?: string | null;

  instagram?: string | null;
  tiktok?: string | null;
  snapchat?: string | null;

  acting_age_min?: number | string | null;
  acting_age_max?: number | string | null;

  modeling_types?: string[] | null;

  height_cm?: number | string | null;
  shoe_size?: number | string | null;

  hair_color?: string | null;
  eye_color?: string | null;

  chest_size?: number | string | null;
  waist_size?: number | string | null;
  hip_size?: number | string | null;
};

function hasValue(value: unknown) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function hasPortfolioMaterial(talent: CompletionTalent) {
  return (
    hasValue(talent.portfolio_url) ||
    hasValue(talent.showreel_url) ||
    hasValue(talent.video_intro) ||
    (Array.isArray(talent.gallery_images) && talent.gallery_images.length > 0)
  );
}

function hasProfessionalMedia(talent: CompletionTalent) {
  return (
    hasValue(talent.previous_work) ||
    hasValue(talent.showreel_url) ||
    hasValue(talent.video_intro)
  );
}

function hasSocialPresence(talent: CompletionTalent) {
  return (
    hasValue(talent.instagram) ||
    hasValue(talent.tiktok) ||
    hasValue(talent.snapchat)
  );
}

function calculateSharedCompletion(talent: CompletionTalent) {
  let score = 0;

  // Shared profile-strength dimensions. These are useful for every Talent type
  // and intentionally remain separate from approval readiness.
  if (hasValue(talent.primary_role)) score += 10;
  if (hasValue(talent.image_url)) score += 10;

  if (
    hasValue(talent.city_slug) ||
    hasValue(talent.city_en) ||
    hasValue(talent.city_ar)
  ) {
    score += 5;
  }

  if (hasValue(talent.date_of_birth)) score += 5;

  if (hasValue(talent.bio_en) || hasValue(talent.bio_ar)) {
    score += 10;
  }

  if (Array.isArray(talent.languages) && talent.languages.length > 0) {
    score += 10;
  }

  if (Array.isArray(talent.skills) && talent.skills.length > 0) {
    score += 10;
  }

  if (hasValue(talent.availability_status)) score += 5;
  if (hasPortfolioMaterial(talent)) score += 10;
  if (hasValue(talent.experience_years)) score += 5;

  return score; // max 80
}

function calculateActorCompletion(talent: CompletionTalent) {
  let score = 0;

  if (hasValue(talent.acting_age_min) && hasValue(talent.acting_age_max)) {
    score += 10;
  }

  if (hasValue(talent.height_cm)) score += 5;

  if (Array.isArray(talent.dialects) && talent.dialects.length > 0) {
    score += 5;
  }

  return score; // max 20
}

function calculateModelCompletion(talent: CompletionTalent) {
  let score = 0;

  if (Array.isArray(talent.modeling_types) && talent.modeling_types.length > 0) {
    score += 10;
  }

  if (hasValue(talent.height_cm)) score += 5;

  if (
    hasValue(talent.chest_size) &&
    hasValue(talent.waist_size) &&
    hasValue(talent.hip_size)
  ) {
    score += 5;
  }

  return score; // max 20
}

function calculateGenericTalentCompletion(talent: CompletionTalent) {
  let score = 0;

  // Non Actor/Model categories should be able to reach the same 100% profile
  // strength without being forced to provide irrelevant physical measurements.
  if (hasProfessionalMedia(talent)) score += 10;
  if (hasSocialPresence(talent)) score += 10;

  return score; // max 20
}

export function calculateProfileCompletion(talent: CompletionTalent) {
  const sharedScore = calculateSharedCompletion(talent);

  let roleScore: number;
  if (talent.primary_role === "actor") {
    roleScore = calculateActorCompletion(talent);
  } else if (talent.primary_role === "model") {
    roleScore = calculateModelCompletion(talent);
  } else {
    roleScore = calculateGenericTalentCompletion(talent);
  }

  return Math.min(sharedScore + roleScore, 100);
}
