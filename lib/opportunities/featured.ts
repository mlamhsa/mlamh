export type FeaturedOpportunityLike = {
  featured?: boolean | null;
  featured_until?: string | null;
  created_at?: string | null;
};

export function isActiveFeaturedOpportunity(
  opportunity: FeaturedOpportunityLike,
  now = Date.now(),
) {
  if (opportunity.featured !== true) return false;
  if (!opportunity.featured_until) return true;

  const featuredUntil = Date.parse(opportunity.featured_until);

  return !Number.isNaN(featuredUntil) && featuredUntil > now;
}

export function compareFeaturedThenNewest(
  a: FeaturedOpportunityLike,
  b: FeaturedOpportunityLike,
  now = Date.now(),
) {
  const aFeatured = isActiveFeaturedOpportunity(a, now);
  const bFeatured = isActiveFeaturedOpportunity(b, now);

  if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

  return (
    new Date(b.created_at ?? 0).getTime() -
    new Date(a.created_at ?? 0).getTime()
  );
}
