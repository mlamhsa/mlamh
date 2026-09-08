import { getLocales } from "expo-localization";

import { readStoredLocale } from "@/lib/locale-preference";

export type AppLocale = "ar" | "en";

export function getDeviceLocale(): AppLocale {
  const stored = readStoredLocale();
  if (stored) return stored;
  const languageCode = getLocales()[0]?.languageCode;
  return languageCode === "ar" ? "ar" : "en";
}

export function isRtlLocale(locale: AppLocale) {
  return locale === "ar";
}

export function toLatinDigits(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function formatLatinNumber(value: number, locale: AppLocale = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US-u-nu-latn").format(value);
}

export function formatGregorianDate(
  value: string | number | Date | null | undefined,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
) {
  if (value == null || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const localeTag = locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US-u-ca-gregory-nu-latn";
  return toLatinDigits(new Intl.DateTimeFormat(localeTag, options).format(date));
}

export const copy = {
  ar: {
    brand: "ملامح",
    headline: "موهبتك تستحق أن تُكتشف.",
    subheadline: "اكتشف الفرص، قدّم، وتابع طلباتك من مكان واحد.",
    discover: "استكشف الفرص",
    signIn: "تسجيل الدخول",
  },
  en: {
    brand: "MLAMH",
    headline: "Your talent deserves to be discovered.",
    subheadline: "Discover opportunities, apply, and track everything in one place.",
    discover: "Discover opportunities",
    signIn: "Sign in",
  },
} as const;
