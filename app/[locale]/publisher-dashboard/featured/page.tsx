import Link from "next/link";

import { requirePublisher } from "@/lib/auth/require-publisher";
import { getPurchasableCatalogItem } from "@/lib/payments/catalog";
import { formatProviderAmount } from "@/lib/payments/money";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const metadata = {
  title: "Featured Opportunity — MLAMH",
  robots: { index: false, follow: false },
};

function isActiveFeatured(featured: boolean | null, featuredUntil: string | null) {
  if (featured !== true) return false;
  if (!featuredUntil) return true;
  const timestamp = Date.parse(featuredUntil);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export default async function PublisherFeaturedPage({ params }: PageProps) {
  const { locale } = await params;
  const isArabic = locale !== "en";
  const { publisher } = await requirePublisher(locale);
  const catalogItem = await getPurchasableCatalogItem("featured_opportunity", "SA");

  const adminClient = createAdminClient();
  const { data: opportunities, error } = await adminClient
    .from("opportunities")
    .select("id, title, status, published, featured, featured_until, created_at")
    .eq("publisher_id", publisher.id)
    .eq("published", true)
    .in("status", ["published", "open"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load publisher opportunities: ${error.message}`);
  }

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="space-y-8">
      <section className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-gold/[0.05] p-6 md:p-9">
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold">MLAMH VISIBILITY</p>
        <h1 className="mt-3 text-3xl font-light text-white md:text-5xl">
          {isArabic ? "تمييز فرصة" : "Feature an Opportunity"}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">
          {isArabic
            ? "اختر فرصة منشورة لرفع ظهورها داخل ملامح. يظهر السعر والمدة قبل الانتقال إلى الدفع."
            : "Choose a published opportunity to increase its visibility in MLAMH. The price and duration are shown before checkout."}
        </p>

        {catalogItem ? (
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-gold/25 bg-gold/10 px-4 py-2 text-gold">
              {isArabic ? "السعر" : "Price"}: {formatProviderAmount(catalogItem.amountMinor, catalogItem.currency)} {catalogItem.currency}
            </span>
            {catalogItem.durationDays ? (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/65">
                {isArabic ? "المدة" : "Duration"}: {catalogItem.durationDays} {isArabic ? "يومًا" : "days"}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {!catalogItem ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 text-sm leading-7 text-white/50">
          {isArabic
            ? "خدمة تمييز الفرص غير متاحة للشراء حاليًا."
            : "Featured Opportunity is not currently available for purchase."}
        </section>
      ) : (opportunities ?? []).length === 0 ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-7 text-sm leading-7 text-white/50">
          {isArabic
            ? "لا توجد لديك فرصة منشورة مؤهلة للتمييز حاليًا."
            : "You do not have a published opportunity eligible for featuring right now."}
        </section>
      ) : (
        <section className="grid gap-4">
          {(opportunities ?? []).map((opportunity) => {
            const active = isActiveFeatured(
              opportunity.featured,
              opportunity.featured_until,
            );

            return (
              <article
                key={opportunity.id}
                className="flex flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs text-white/35">#{opportunity.id}</p>
                  <h2 className="mt-2 text-xl font-light text-white">{opportunity.title}</h2>
                  <p className="mt-2 text-xs text-white/35">
                    {active
                      ? isArabic
                        ? "مميزة حاليًا"
                        : "Currently featured"
                      : isArabic
                        ? "منشورة ومؤهلة للتمييز"
                        : "Published and eligible for featuring"}
                  </p>
                </div>

                {active ? (
                  <span className="inline-flex rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">
                    {isArabic ? "مميزة" : "Featured"}
                  </span>
                ) : (
                  <Link
                    href={`/${isArabic ? "ar" : "en"}/payment/featured/featured_opportunity?target_id=${encodeURIComponent(String(opportunity.id))}&market=SA`}
                    className="inline-flex justify-center rounded-full bg-gold px-5 py-3 text-xs font-medium text-black transition hover:bg-[#e0bd73]"
                  >
                    {isArabic ? "اختيار هذه الفرصة" : "Choose this opportunity"}
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
