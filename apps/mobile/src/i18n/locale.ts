import * as Localization from "expo-localization";

export type AppLocale = "ar" | "en";

export function getDeviceLocale(): AppLocale {
  const languageCode = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return languageCode === "en" ? "en" : "ar";
}

export function isRTL(locale: AppLocale) {
  return locale === "ar";
}

export function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function formatDate(
  value: string | Date,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", options).format(date);
}

export function formatMoney(
  value: number,
  currency: string,
  locale: AppLocale,
) {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
