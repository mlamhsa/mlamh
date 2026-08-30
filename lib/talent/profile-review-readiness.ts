export type TalentProfileReadinessData = {
  name_ar?: unknown;
  name_en?: unknown;

  phone?: unknown;

  image_url?: unknown;

  primary_role?: unknown;

  city_slug?: unknown;

  gender?: unknown;

  nationality?: unknown;
  nationality_slug?: unknown;

  date_of_birth?: unknown;

  bio_ar?: unknown;
  bio_en?: unknown;

  height_cm?: unknown;

  // Actor
  acting_age_min?: unknown;
  acting_age_max?: unknown;

  // Model
  modeling_types?: unknown;
};

export type ProfileReadinessRequirement = {
  key: string;
  ar: string;
  en: string;
  completed: boolean;
};

function hasValue(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
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

function getSharedRequirements(
  talent: TalentProfileReadinessData,
): ProfileReadinessRequirement[] {
  return [
    {
      key: "name",
      ar: "الاسم",
      en: "Name",
      completed:
        hasValue(talent.name_ar) ||
        hasValue(talent.name_en),
    },
    {
      key: "phone",
      ar: "رقم الجوال",
      en: "Phone number",
      completed: hasValue(talent.phone),
    },
    {
      key: "profile_image",
      ar: "الصورة الشخصية",
      en: "Profile photo",
      completed: hasValue(
        talent.image_url,
      ),
    },
    {
      key: "primary_role",
      ar: "نوع الموهبة",
      en: "Talent type",
      completed:
        talent.primary_role === "actor" ||
        talent.primary_role === "model",
    },
    {
      key: "city",
      ar: "المدينة",
      en: "City",
      completed: hasValue(
        talent.city_slug,
      ),
    },
    {
      key: "gender",
      ar: "الجنس",
      en: "Gender",
      completed: hasValue(
        talent.gender,
      ),
    },
    {
      key: "nationality",
      ar: "الجنسية",
      en: "Nationality",
      completed:
        hasValue(
          talent.nationality_slug,
        ) ||
        hasValue(
          talent.nationality,
        ),
    },
    {
      key: "date_of_birth",
      ar: "تاريخ الميلاد",
      en: "Date of birth",
      completed: hasValue(
        talent.date_of_birth,
      ),
    },
    {
      key: "bio",
      ar: "النبذة التعريفية",
      en: "Profile bio",
      completed:
        hasValue(talent.bio_ar) ||
        hasValue(talent.bio_en),
    },
    {
      key: "height",
      ar: "الطول",
      en: "Height",
      completed: hasValue(
        talent.height_cm,
      ),
    },
  ];
}

function getActorRequirements(
  talent: TalentProfileReadinessData,
): ProfileReadinessRequirement[] {
  return [
    {
      key: "acting_age_range",
      ar: "العمر التمثيلي",
      en: "Acting age range",
      completed:
        hasValue(
          talent.acting_age_min,
        ) &&
        hasValue(
          talent.acting_age_max,
        ),
    },
  ];
}

function getModelRequirements(
  talent: TalentProfileReadinessData,
): ProfileReadinessRequirement[] {
  return [
    {
      key: "modeling_types",
      ar: "نوع أعمال المودل",
      en: "Modeling types",
      completed: hasValue(
        talent.modeling_types,
      ),
    },
  ];
}

export function getTalentProfileReadiness(
  talent: TalentProfileReadinessData,
) {
  /*
   * متطلبات إرسال ملف الموهبة للمراجعة
   * في الـMVP.
   *
   * بقية بيانات الملف تبقى مهمة لنسبة
   * الاكتمال وجودة الملف، لكنها لا تمنع
   * إرسال الملف للمراجعة.
   */
  const requiredKeys = new Set([
    "name",
    "profile_image",
    "primary_role",
    "city",
    "gender",
    "date_of_birth",
    "nationality",
  ]);

  const requirements =
    getSharedRequirements(
      talent,
    ).filter(
      (requirement) =>
        requiredKeys.has(
          requirement.key,
        ),
    );

  const missingRequirements =
    requirements.filter(
      (requirement) =>
        !requirement.completed,
    );

  return {
    isReady:
      missingRequirements.length === 0,

    requirements,

    missingRequirements,

    completedRequirements:
      requirements.length -
      missingRequirements.length,

    totalRequirements:
      requirements.length,
  };
}

/**
 * توافق مؤقت مع مسار مراجعة الملف القديم.
 * يزال بعد نقل جميع الواجهات إلى مفهوم الجاهزية.
 */
export function getTalentProfileReviewReadiness(
  talent: TalentProfileReadinessData,
) {
  const readiness =
    getTalentProfileReadiness(talent);

  return {
    ...readiness,
    canSubmitForReview:
      readiness.isReady,
  };
}
