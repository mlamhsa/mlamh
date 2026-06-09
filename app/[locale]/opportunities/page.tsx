import Link from "next/link";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

type OpportunitiesPageProps = {
  params: Promise<{
    locale?: string;
  }>;
};

export default async function OpportunitiesPage({
  params,
}: OpportunitiesPageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  const opportunities = await getPublishedOpportunities();

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className={isRtl ? "mb-8 flex justify-start" : "mb-8 flex justify-end"}>
          <Link
            href={`/${locale}/talent-dashboard`}
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm text-white transition hover:border-[#c8a45d] hover:text-[#c8a45d]"
          >
            {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
        </div>

        <h1 className="mb-12 text-center text-4xl font-light tracking-[0.3em]">
          {isRtl ? "الفرص المتاحة" : "Opportunities"}
        </h1>

        {opportunities.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 p-10 text-center text-zinc-400">
            {isRtl ? "لا توجد فرص متاحة حالياً" : "No opportunities available"}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((item: any) => {
              const opportunitySlugOrId = item.slug || String(item.id);
              const opportunityHref = `/${locale}/opportunities/${opportunitySlugOrId}`;

              return (
                <Link
                  key={item.id}
                  href={opportunityHref}
                  className="group rounded-3xl border border-zinc-800 p-6 transition hover:border-[#c8a45d]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full border border-[#c8a45d] px-3 py-1 text-xs text-[#c8a45d]">
                      {item.opportunity_type || "-"}
                    </span>

                    <span className="text-sm text-zinc-400">
                      {isRtl
                        ? item.city_ar || item.city_en || "-"
                        : item.city_en || item.city_ar || "-"}
                    </span>
                  </div>

                  <h2 className="mb-3 text-xl font-medium">
                    {item.title || "-"}
                  </h2>

                  <p className="line-clamp-3 text-sm text-zinc-400">
                    {item.description || "-"}
                  </p>

                  <div className="mt-6 text-sm text-[#c8a45d]">
                    {isRtl ? "عرض الفرصة ←" : "View Opportunity →"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}