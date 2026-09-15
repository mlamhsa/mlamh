import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { getDeviceLocale, isRTL, type AppLocale } from "@/src/i18n/locale";
import { readStoredLocale, writeStoredLocale } from "@/src/i18n/storage";

type LocaleContextValue = {
  locale: AppLocale;
  direction: "rtl" | "ltr";
  isRTL: boolean;
  hydrated: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(getDeviceLocale());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void readStoredLocale()
      .then((stored) => {
        if (active && stored) setLocaleState(stored);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const rtl = isRTL(locale);
    return {
      locale,
      direction: rtl ? "rtl" : "ltr",
      isRTL: rtl,
      hydrated,
      async setLocale(nextLocale) {
        setLocaleState(nextLocale);
        await writeStoredLocale(nextLocale);
      },
    };
  }, [hydrated, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider.");
  return context;
}
