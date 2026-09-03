import { getLocales } from "expo-localization";

export type AppLocale = "ar" | "en";

export function getDeviceLocale(): AppLocale {
  const languageCode = getLocales()[0]?.languageCode;
  return languageCode === "ar" ? "ar" : "en";
}

export function isRtlLocale(locale: AppLocale) {
  return locale === "ar";
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
