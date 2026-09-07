import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { type AppLocale, getDeviceLocale } from "@/lib/i18n";
import { writeStoredLocale } from "@/lib/locale-preference";

type LocaleContextValue = {
  locale: AppLocale;
  changeLocale: (locale: AppLocale) => boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(() => getDeviceLocale());
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    changeLocale(next) {
      if (next === locale) return true;
      if (!writeStoredLocale(next)) return false;
      setLocale(next);
      return true;
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useAppLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useAppLocale must be used inside AppLocaleProvider");
  return value;
}
