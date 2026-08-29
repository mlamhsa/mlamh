import Link from "next/link";

import { getPurchasableCatalogItem } from "@/lib/payments/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function TalentFeaturedEntryPoint({
  locale,
  userId,
}: {
  locale: string;
  userId: string;
}) {
  const adminClient = createAdminClient();
  const { data: talent, error } = await adminClient
    .from("talents")
    .select("id, published, featured, featured_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !talent || talent.published !== true) return null;

  const featuredUntil = talent.featured_until
    ? Date.parse(String(talent.featured_until))
    : Number.NaN;
  const isActivelyFeatured =
    talent.featured === true &&
    (!talent.featured_until || featuredUntil > Date.now());

  if (isActivelyFeatured) return null;

  const catalogItem = await getPurchasableCatalogItem("featured_talent", "SA");
  if (!catalogItem) return null;

  const isArabic = locale !== "en";
  const href = `/${isArabic ? "ar" : "en"}/payment/featured/featured_talent?target_id=${encodeURIComponent(String(talent.id))}&market=SA`;

  return (
    <Link
      href={href}
      className="fixed bottom-24 end-5 z-40 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/90 px-5 py-3 text-xs font-medium text-gold shadow-2xl backdrop-blur transition hover:bg-gold hover:text-black md:bottom-6 md:end-6"
    >
      <span aria-hidden>★</span>
      {isArabic ? "تمييز ملفي" : "Feature my profile"}
    </Link>
  );
}
