import { useEffect, useState } from "react";

import { getMobileTalents } from "@/src/domains/talent/api";
import type { MobilePublicTalent } from "@/src/domains/talent/types";
import type { AppLocale } from "@/src/i18n/locale";

export function useHomeTalents(locale: AppLocale) {
  const [items, setItems] = useState<MobilePublicTalent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void getMobileTalents(locale, 6)
      .then((result) => {
        if (!active) return;
        setItems(result.ok ? result.items.filter((item) => Boolean(item.imageUrl)) : []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  return { items, loading };
}
