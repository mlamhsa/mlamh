import { isActiveFeaturedOpportunity } from "@/lib/opportunities/featured";

type FeaturedOpportunityBadgeProps = {
  isRtl: boolean;
  featured?: boolean | null;
  featuredUntil?: string | null;
  isOpen?: boolean;
  className?: string;
};

export function FeaturedOpportunityBadge({
  isRtl,
  featured,
  featuredUntil,
  isOpen = true,
  className = "",
}: FeaturedOpportunityBadgeProps) {
  const isFeatured =
    isOpen &&
    isActiveFeaturedOpportunity({
      featured,
      featured_until: featuredUntil,
    });

  if (!isFeatured) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold/[0.12] px-3 py-1 text-[10px] font-medium text-gold backdrop-blur ${className}`}
    >
      <span aria-hidden="true">★</span>
      {isRtl ? "فرصة مميزة" : "Featured"}
    </span>
  );
}
