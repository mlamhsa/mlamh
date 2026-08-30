import { compareFeaturedThenNewest } from "@/lib/opportunities/featured";

export function sortOpportunitiesForPublicDisplay<
  T extends {
    featured?: boolean | null;
    featured_until?: string | null;
    created_at?: string | null;
  },
>(items: T[]) {
  return [...items].sort((a, b) => compareFeaturedThenNewest(a, b));
}
