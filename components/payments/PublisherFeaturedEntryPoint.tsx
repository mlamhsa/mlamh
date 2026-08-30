import Link from "next/link";

import { getPurchasableCatalogItem } from "@/lib/payments/catalog";

export async function PublisherFeaturedEntryPoint({ locale }: { locale: string }) {
  const catalogItem = await getPurchasableCatalogItem("featured_opportunity", "SA");
  if (!catalogItem) return null;

  const isArabic = locale !== "en";

  return (
    <div className="mb-6 flex justify-end">
      <Link
        href={`/${isArabic ? "ar" : "en"}/publisher-dashboard/featured`}
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-gold/35 bg-gold/[0.08] px-5 py-3 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
      >
        <span aria-hidden>★</span>
        {isArabic ? "تمييز فرصة" : "Feature an opportunity"}
      </Link>
    </div>
  );
}
