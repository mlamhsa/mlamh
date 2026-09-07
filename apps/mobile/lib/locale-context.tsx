import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { type AppLocale, getDeviceLocale } from "@/lib/i18n";
import { readStoredLocale, writeStoredLocale } from "@/lib/locale-preference";

type LocaleContextValue = {
  locale: AppLocale;
  hasChosenLocale: boolean;
  changeLocale: (locale: AppLocale) => boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function resolveInitialLocale() {
  return readStoredLocale() ?? getDeviceLocale();
}

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(resolveInitialLocale);
  const [hasChosenLocale, setHasChosenLocale] = useState(() => Boolean(readStoredLocale()));
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    hasChosenLocale,
    changeLocale(next) {
      if (!writeStoredLocale(next)) return false;
      setLocale(next);
      setHasChosenLocale(true);
      return true;
    },
  }), [locale, hasChosenLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useAppLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useAppLocale must be used inside AppLocaleProvider");
  return value;
}
