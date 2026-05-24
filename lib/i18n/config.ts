export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
