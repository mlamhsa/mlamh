export type TalentProfileDataQualityInput = {
  height_cm?: unknown;
  weight_kg?: unknown;
  shoe_size?: unknown;
  chest_size?: unknown;
  waist_size?: unknown;
  hip_size?: unknown;
};

export type TalentProfileDataQualityIssue = {
  key: keyof TalentProfileDataQualityInput;
  ar: string;
  en: string;
  value: number;
};

const LABELS: Record<
  keyof TalentProfileDataQualityInput,
  { ar: string; en: string }
> = {
  height_cm: { ar: "الطول", en: "Height" },
  weight_kg: { ar: "الوزن", en: "Weight" },
  shoe_size: { ar: "مقاس الحذاء", en: "Shoe size" },
  chest_size: { ar: "مقاس الصدر", en: "Chest size" },
  waist_size: { ar: "مقاس الخصر", en: "Waist size" },
  hip_size: { ar: "مقاس الورك", en: "Hip size" },
};

function numericValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getTalentProfileDataQualityIssues(
  talent: TalentProfileDataQualityInput,
): TalentProfileDataQualityIssue[] {
  const issues: TalentProfileDataQualityIssue[] = [];

  for (const key of Object.keys(LABELS) as Array<keyof TalentProfileDataQualityInput>) {
    const value = numericValue(talent[key]);
    if (value === null) continue;

    // Waist is optional. Zero means "not provided" and should not be treated as a data-quality issue.
    if (key === "waist_size" && value === 0) continue;

    if (value > 0) continue;

    issues.push({
      key,
      ar: `${LABELS[key].ar}: القيمة ${value} غير صالحة`,
      en: `${LABELS[key].en}: value ${value} is invalid`,
      value,
    });
  }

  return issues;
}
