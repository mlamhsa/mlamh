export function normalizeInputDigits(value: string) {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";
  return value
    .replace(/[٠-٩]/g, (digit) => String(arabicIndic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndic.indexOf(digit)));
}

export function normalizeNumericInput(value: string) {
  return normalizeInputDigits(value)
    .replace(/٬/g, "")
    .replace(/٫/g, ".");
}

export function formatLatinNumber(value: number | string, locale: "ar" | "en") {
  const numeric = typeof value === "number" ? value : Number(normalizeNumericInput(value));
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function localizeApprovalStatus(value: string | null | undefined, locale: "ar" | "en") {
  const key = (value || "not_submitted").trim().toLowerCase();
  const map: Record<string, [string, string]> = {
    not_submitted: ["غير مرسل", "Not submitted"],
    ready_to_submit: ["جاهز للإرسال", "Ready to submit"],
    submitted: ["قيد المراجعة", "Under review"],
    pending: ["قيد المراجعة", "Under review"],
    under_review: ["قيد المراجعة", "Under review"],
    approved: ["معتمد", "Approved"],
    changes_requested: ["تعديلات مطلوبة", "Changes requested"],
    rejected: ["مرفوض", "Rejected"],
  };
  return map[key] ? map[key][locale === "ar" ? 0 : 1] : value || map.not_submitted[locale === "ar" ? 0 : 1];
}

export function localizeVerificationStatus(value: string | null | undefined, locale: "ar" | "en") {
  const key = (value || "unverified").trim().toLowerCase();
  const map: Record<string, [string, string]> = {
    unverified: ["غير موثق", "Unverified"],
    pending: ["قيد التحقق", "Pending verification"],
    verified: ["موثق", "Verified"],
    rejected: ["مرفوض", "Rejected"],
  };
  return map[key] ? map[key][locale === "ar" ? 0 : 1] : value || map.unverified[locale === "ar" ? 0 : 1];
}

export function localizeOpportunityStatus(value: string | null | undefined, locale: "ar" | "en") {
  const key = (value || "").trim().toLowerCase();
  const map: Record<string, [string, string]> = {
    draft: ["مسودة", "Draft"],
    pending_review: ["قيد المراجعة", "In review"],
    needs_changes: ["تحتاج تعديلات", "Needs changes"],
    rejected: ["مرفوضة", "Rejected"],
    published: ["منشورة", "Published"],
    open: ["منشورة", "Published"],
    closed: ["مغلقة", "Closed"],
    archived: ["مؤرشفة", "Archived"],
  };
  return map[key] ? map[key][locale === "ar" ? 0 : 1] : value || (locale === "ar" ? "غير محددة" : "Unknown");
}

export function formatGregorianDate(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "غير محدد" : "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn",
    { year: "numeric", month: "short", day: "numeric" },
  ).format(date);
}

export function localizeTalentType(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "غير محدد" : "Not specified";
  const key = value.trim().toLowerCase();
  const map: Record<string, [string, string]> = {
    actor: ["ممثل / ممثلة", "Actor"],
    model: ["مودل", "Model"],
  };
  return map[key] ? map[key][locale === "ar" ? 0 : 1] : value;
}

export function localizeGender(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "غير محدد" : "Not specified";
  const key = value.trim().toLowerCase();
  const map: Record<string, [string, string]> = {
    any: ["الكل", "Any"],
    male: ["ذكر", "Male"],
    female: ["أنثى", "Female"],
    other: ["أخرى", "Other"],
  };
  return map[key] ? map[key][locale === "ar" ? 0 : 1] : value;
}

export function localizeCurrency(value: string | null | undefined, locale: "ar" | "en") {
  const code = (value || "SAR").toUpperCase();
  if (locale === "ar" && code === "SAR") return "ر.س";
  return code;
}
