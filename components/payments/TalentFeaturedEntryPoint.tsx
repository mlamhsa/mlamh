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
    <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:pt-6">
      <div className="flex justify-end">
        <Link
          href={href}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-gold/35 bg-gold/[0.08] px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
        >
          <span aria-hidden>★</span>
          {isArabic ? "تمييز ملفي" : "Feature my profile"}
        </Link>
      </div>
    </div>
  );
}
