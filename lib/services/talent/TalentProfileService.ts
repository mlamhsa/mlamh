export type TalentProfile = Record<string, unknown>;

type ProfileSection = {
  weight: number;
  fields: string[];
};

export class TalentProfileService {
  /* =========================
     AGE
  ========================= */

  static calculateAge(dateOfBirth?: string | null): number | null {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return Math.max(age, 0);
  }

  /* =========================
     PROFILE COMPLETION
  ========================= */

  private static readonly sections: ProfileSection[] = [
    {
      weight: 25,
      fields: [
        "name_en",
        "image_url",
        "category_slug",
        "gender",
        "city_slug",
      ],
    },
    {
      weight: 25,
      fields: [
        "height_cm",
        "weight_kg",
        "eye_color",
        "hair_color",
        "hair_type",
        "skin_color",
        "clothing_size",
        "shoe_size",
      ],
    },
    {
      weight: 20,
      fields: [
        "experience_years",
        "ready_to_travel",
        "has_passport",
        "has_car",
        "work_outside_city",
        "work_outside_country",
      ],
    },
    {
      weight: 30,
      fields: [
        "video_intro",
        "showreel_url",
        "portfolio_url",
      ],
    },
  ];

  static calculateCompletion(profile?: TalentProfile): number {
    if (!profile) return 0;

    let completion = 0;

    for (const section of this.sections) {
      const completedFields = section.fields.filter((field) =>
        this.hasValue(profile[field])
      ).length;

      completion +=
        (completedFields / section.fields.length) * section.weight;
    }

    return Math.round(Math.min(completion, 100));
  }

  /* =========================
     HELPERS
  ========================= */

  private static hasValue(value: unknown): boolean {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "boolean") {
      return true;
    }

    if (typeof value === "number") {
      return true;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return value !== null && value !== undefined;
  }

  /* =========================
     OPTIONS
  ========================= */

  static localizeOptions(
    options: { value: string; label: string }[],
    isArabic: boolean,
    labelsMap?: Record<string, string>
  ) {
    if (!isArabic || !labelsMap) {
      return options;
    }

    return options.map((option) => ({
      ...option,
      label: labelsMap[option.label] ?? option.label,
    }));
  }
}