export function formatLatinNumber(value: number | string, locale: "ar" | "en") {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    maximumFractionDigits: 2,
  }).format(numeric);
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
