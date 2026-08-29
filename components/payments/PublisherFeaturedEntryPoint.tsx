import Link from "next/link";

import { getPurchasableCatalogItem } from "@/lib/payments/catalog";

export async function PublisherFeaturedEntryPoint({ locale }: { locale: string }) {
  const catalogItem = await getPurchasableCatalogItem("featured_opportunity", "SA");
  if (!catalogItem) return null;

  const isArabic = locale !== "en";

  return (
    <Link
      href={`/${isArabic ? "ar" : "en"}/publisher-dashboard/featured`}
      className="fixed bottom-24 end-5 z-40 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-black/90 px-5 py-3 text-xs font-medium text-gold shadow-2xl backdrop-blur transition hover:bg-gold hover:text-black md:bottom-6 md:end-6"
    >
      <span aria-hidden>★</span>
      {isArabic ? "تمييز فرصة" : "Feature an opportunity"}
    </Link>
  );
}
