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

  portfolio_url?: string | null;
  showreel_url?: string | null;
  gallery_images?: string[] | null;

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

  previous_work?: string | null;
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

function hasPortfolioMaterial(
  talent: CompletionTalent
) {
  return (
    hasValue(talent.portfolio_url) ||
    hasValue(talent.showreel_url) ||
    (
      Array.isArray(talent.gallery_images) &&
      talent.gallery_images.length > 0
    )
  );
}

function calculateSharedCompletion(
  talent: CompletionTalent
) {
  let score = 0;

  // التخصص الأساسي
  if (hasValue(talent.primary_role)) {
    score += 10;
  }

  // الصورة الشخصية
  if (hasValue(talent.image_url)) {
    score += 10;
  }

  // المدينة
  if (
    hasValue(talent.city_slug) ||
    hasValue(talent.city_en) ||
    hasValue(talent.city_ar)
  ) {
    score += 10;
  }

  // تاريخ الميلاد
  if (hasValue(talent.date_of_birth)) {
    score += 5;
  }

  // النبذة
  if (
    hasValue(talent.bio_en) ||
    hasValue(talent.bio_ar)
  ) {
    score += 10;
  }

  // اللغات
  if (
    Array.isArray(talent.languages) &&
    talent.languages.length > 0
  ) {
    score += 10;
  }

  // حالة التوفر
  if (hasValue(talent.availability_status)) {
    score += 10;
  }

  // Portfolio / Gallery / Showreel
  if (hasPortfolioMaterial(talent)) {
    score += 5;
  }

  return score;
}

function calculateActorCompletion(
  talent: CompletionTalent
) {
  let score = 0;

  // العمر التمثيلي يجب أن يحتوي الطرفين
  if (
    hasValue(talent.acting_age_min) &&
    hasValue(talent.acting_age_max)
  ) {
    score += 10;
  }

  // الطول
  if (hasValue(talent.height_cm)) {
    score += 5;
  }

  // اللهجات
  if (
    Array.isArray(talent.dialects) &&
    talent.dialects.length > 0
  ) {
    score += 5;
  }

  // المهارات
  if (
    Array.isArray(talent.skills) &&
    talent.skills.length > 0
  ) {
    score += 5;
  }

  // خبرة فعلية أو Showreel
  if (
    hasValue(talent.previous_work) ||
    hasValue(talent.showreel_url)
  ) {
    score += 5;
  }

  return score;
}

function calculateModelCompletion(
  talent: CompletionTalent
) {
  let score = 0;

  // نوع أعمال المودل
  if (
    Array.isArray(talent.modeling_types) &&
    talent.modeling_types.length > 0
  ) {
    score += 10;
  }

  // الطول
  if (hasValue(talent.height_cm)) {
    score += 5;
  }

  // مقاس الحذاء
  if (hasValue(talent.shoe_size)) {
    score += 5;
  }

  // الشعر والعين
  if (
    hasValue(talent.hair_color) &&
    hasValue(talent.eye_color)
  ) {
    score += 5;
  }

  // القياسات الأساسية
  if (
    hasValue(talent.chest_size) &&
    hasValue(talent.waist_size) &&
    hasValue(talent.hip_size)
  ) {
    score += 5;
  }

  return score;
}

export function calculateProfileCompletion(
  talent: CompletionTalent
) {
  const sharedScore =
    calculateSharedCompletion(talent);

  let roleScore = 0;

  if (talent.primary_role === "actor") {
    roleScore =
      calculateActorCompletion(talent);
  }

  if (talent.primary_role === "model") {
    roleScore =
      calculateModelCompletion(talent);
  }

  return Math.min(
    sharedScore + roleScore,
    100
  );
}