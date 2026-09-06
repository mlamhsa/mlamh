import Storage from "expo-sqlite/kv-store";

import type { AppLocale } from "@/lib/i18n";

const LOCALE_KEY = "mlamh.locale";

export function readStoredLocale(): AppLocale | null {
  try {
    const value = Storage.getItemSync(LOCALE_KEY);
    return value === "ar" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredLocale(locale: AppLocale) {
  try {
    Storage.setItemSync(LOCALE_KEY, locale);
    return true;
  } catch {
    return false;
  }
}

export function clearStoredLocale() {
  try {
    Storage.removeItemSync(LOCALE_KEY);
    return true;
  } catch {
    return false;
  }
}
