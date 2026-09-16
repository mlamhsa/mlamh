import { useEffect, useState } from "react";

import { getMobileHome } from "@/src/domains/home/api";
import type { MobileHomeHero, MobileHomeValueProp } from "@/src/domains/home/types";
import type { AppLocale } from "@/src/i18n/locale";

type HomeContentState = {
  hero: MobileHomeHero | null;
  valueProps: MobileHomeValueProp[];
  loading: boolean;
  error: boolean;
};

export function useHomeContent(locale: AppLocale): HomeContentState {
  const [state, setState] = useState<HomeContentState>({
    hero: null,
    valueProps: [],
    loading: true,
    error: false,
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: false }));

    void getMobileHome(locale)
      .then((result) => {
        if (!active) return;
        if (!result.ok) {
          setState((current) => ({ ...current, loading: false, error: true }));
          return;
        }
        setState({
          hero: result.hero,
          valueProps: result.valueProps,
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (active) {
          setState((current) => ({ ...current, loading: false, error: true }));
        }
      });

    return () => {
      active = false;
    };
  }, [locale]);

  return state;
}
