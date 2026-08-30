type FeaturedOpportunityBadgeProps = {
  isRtl: boolean;
  className?: string;
};

export function FeaturedOpportunityBadge({
  isRtl,
  className = "",
}: FeaturedOpportunityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-gold/35 bg-gold/[0.12] px-3 py-1 text-[10px] font-medium text-gold backdrop-blur ${className}`}
    >
      <span aria-hidden="true">★</span>
      {isRtl ? "فرصة مميزة" : "Featured"}
    </span>
  );
}
