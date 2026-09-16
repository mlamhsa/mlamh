import Storage from "expo-sqlite/kv-store";

import type { AppLocale } from "@/src/i18n/locale";

const LOCALE_STORAGE_KEY = "mlamh.locale.v3";

export async function readStoredLocale(): Promise<AppLocale | null> {
  try {
    const value = await Storage.getItem(LOCALE_STORAGE_KEY);
    return value === "ar" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

export async function writeStoredLocale(locale: AppLocale) {
  await Storage.setItem(LOCALE_STORAGE_KEY, locale);
}

export async function clearStoredLocale() {
  await Storage.removeItem(LOCALE_STORAGE_KEY);
}
