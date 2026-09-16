import { useEffect, useState } from "react";

import { getMobileOpportunities } from "@/src/domains/opportunities/api";
import type { MobilePublicOpportunity } from "@/src/domains/opportunities/types";
import type { AppLocale } from "@/src/i18n/locale";

export function useHomeOpportunities(locale: AppLocale) {
  const [items, setItems] = useState<MobilePublicOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    void getMobileOpportunities(locale)
      .then((result) => {
        if (!active) return;
        setItems(result.items.slice(0, 4));
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
