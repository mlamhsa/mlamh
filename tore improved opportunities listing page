// app/[locale]/opportunities/page.tsx

import Link from "next/link";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";

type OpportunitiesPageProps = {
  params: Promise<{ locale?: string }>;
  searchParams: Promise<{
    search?: string;
    city?: string;
    type?: string;
sort?: string;
  }>;
};

export default async function OpportunitiesPage({
  params,
  searchParams,
}: OpportunitiesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const locale = resolvedParams?.locale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  // جلب جميع الفرص المنشورة
  const opportunities = await getPublishedOpportunities();

  const search = resolvedSearchParams.search ?? "";
  const selectedCity = resolvedSearchParams.city ?? "";
  const selectedType = resolvedSearchParams.type ?? "";
  const selectedSort = resolvedSearchParams.sort ?? "newest";

  // استخراج المدن والأنواع المتاحة من الفرص
  const cities = Array.from(
    new Set(
      opportunities
        .map((item: any) =>
          isRtl ? item.city_ar || item.city_en : item.city_en || item.city_ar
        )
        .filter(Boolean)
    )
  );

  const types = Array.from(
    new Set(opportunities.map((item: any) => item.opportunity_type).filter(Boolean))
  );

  // تطبيق الفلترة
  const filteredOpportunities = opportunities
  .filter((item: any) => {
    const title = String(item.title ?? "").toLowerCase();
    const description = String(item.description ?? "").toLowerCase();
    const city = isRtl ? item.city_ar || item.city_en : item.city_en || item.city_ar;

    const matchesSearch =
      !search ||
      title.includes(search.toLowerCase()) ||
      description.includes(search.toLowerCase());

    const matchesCity = !selectedCity || city === selectedCity;
    const matchesType = !selectedType || item.opportunity_type === selectedType;

    return matchesSearch && matchesCity && matchesType;
  })
  .sort((a: any, b: any) => {
    if (selectedSort === "oldest") {
      return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
    }

    if (selectedSort === "budget_high") {
      return Number(b.budget ?? 0) - Number(a.budget ?? 0);
    }

    if (selectedSort === "budget_low") {
      return Number(a.budget ?? 0) - Number(b.budget ?? 0);
    }

    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        {/* زر العودة */}
        <div className={isRtl ? "mb-8 flex justify-start" : "mb-8 flex justify-end"}>
          <Link
            href={`/${locale}/talent-dashboard`}
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm text-white transition hover:border-[#c8a45d] hover:text-[#c8a45d]"
          >
            {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
        </div>

        {/* عنوان الصفحة */}
        <h1 className="mb-12 text-center text-4xl font-light tracking-[0.3em]">
          {isRtl ? "الفرص المتاحة" : "Opportunities"}
        </h1>
        <p className="mx-auto mb-12 max-w-3xl text-center text-zinc-500">
  {isRtl
    ? "استكشف فرص الكاست والإعلانات وصناعة المحتوى المنشورة من الوكالات والشركات والعلامات التجارية."
    : "Explore casting, advertising and content creation opportunities published by agencies, companies and brands."}
</p>

        {/* فلترة الفرص */}
        <form
          method="GET"
          className="mb-12 rounded-[2rem] border border-zinc-800 bg-black/40 p-6 md:p-8"
        >
          <div className="mb-6">
            <p className="mb-3 text-xs tracking-[0.35em] text-[#c8a45d]">
              {isRtl ? "بحث الفرص" : "Search Opportunities"}
            </p>
            <h2 className="text-2xl font-light">
              {isRtl ? "اعثر على الفرصة المناسبة" : "Find the right opportunity"}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
            {/* بحث نصي */}
            <input
              name="search"
              defaultValue={search}
              type="text"
              placeholder={isRtl ? "ابحث باسم الفرصة..." : "Search opportunity..."}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none placeholder:text-zinc-600"
            />

            {/* نوع الفرصة */}
            <select
              name="type"
              defaultValue={selectedType}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">
                {isRtl ? "كل أنواع الفرص" : "All Opportunity Types"}
              </option>
              {types.map((type) => (
                <option key={String(type)} value={String(type)}>
                  {String(type).replaceAll("_", " ")}
                </option>
              ))}
            </select>

            {/* المدينة */}
            <select
              name="city"
              defaultValue={selectedCity}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">{isRtl ? "كل المدن" : "All Cities"}</option>
              {cities.map((city) => (
                <option key={String(city)} value={String(city)}>
                  {String(city)}
                </option>
              ))}
            </select>

            <select
  name="sort"
  defaultValue={selectedSort}
  className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none"
>
  <option value="newest">{isRtl ? "الأحدث أولاً" : "Newest first"}</option>
  <option value="oldest">{isRtl ? "الأقدم أولاً" : "Oldest first"}</option>
  <option value="budget_high">{isRtl ? "الميزانية الأعلى" : "Highest budget"}</option>
  <option value="budget_low">{isRtl ? "الميزانية الأقل" : "Lowest budget"}</option>
</select>
            {/* زر البحث */}
            <button
              type="submit"
              className="rounded-2xl border border-[#c8a45d] px-8 py-4 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
            >
              {isRtl ? "بحث" : "Search"}
            </button>
            <Link
  href={`/${locale}/opportunities`}
  className="flex items-center justify-center rounded-2xl border border-zinc-700 px-8 py-4 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
>
  {isRtl ? "مسح الفلاتر" : "Clear Filters"}
</Link>
          </div>
        </form>

        <div className="mb-6 text-sm text-zinc-500">
  {isRtl
    ? `عرض ${filteredOpportunities.length} فرصة متاحة`
    : `Showing ${filteredOpportunities.length} opportunities`}
</div>
        {/* عرض الفرص */}
        {filteredOpportunities.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 p-10 text-center text-zinc-400">
            {isRtl ? "لا توجد فرص مطابقة" : "No matching opportunities"}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((item: any) => {
              const opportunitySlugOrId = item.slug || String(item.id);
              const opportunityHref = `/${locale}/opportunities/${opportunitySlugOrId}`;

              return (
                <Link
  key={item.id}
  href={opportunityHref}
  className="group flex min-h-[280px] flex-col rounded-3xl border border-zinc-800 bg-black/50 p-6 transition hover:-translate-y-1 hover:border-[#c8a45d]"
>
  <div className="mb-5 flex items-start justify-between gap-4">
    <span className="rounded-full border border-[#c8a45d] px-3 py-1 text-xs text-[#c8a45d]">
      {item.opportunity_type || "-"}
    </span>

    <span className="text-sm text-zinc-500">
      {isRtl
        ? item.city_ar || item.city_en || "-"
        : item.city_en || item.city_ar || "-"}
    </span>
  </div>

  <h2 className="mb-4 text-2xl font-light leading-snug">
    {item.title || "-"}
  </h2>

  <p className="line-clamp-3 text-sm leading-7 text-zinc-500">
    {item.description || "-"}
  </p>

  <div className="mt-6 grid gap-3 border-t border-zinc-900 pt-5 text-sm text-zinc-500">
    <div className="flex items-center justify-between gap-4">
      <span>{isRtl ? "الحالة" : "Status"}</span>
      <span className="text-[#c8a45d]">
        {item.status === "open" ? (isRtl ? "مفتوحة" : "Open") : item.status || "-"}
      </span>
    </div>

    <div className="flex items-center justify-between gap-4">
      <span>{isRtl ? "الميزانية" : "Budget"}</span>
      <span className="text-white/70">
        {item.budget
          ? `${item.budget} ${isRtl ? "ريال" : "SAR"}`
          : isRtl
            ? "حسب الاتفاق"
            : "By agreement"}
      </span>
    </div>
  </div>

  <div className="mt-auto pt-6 text-sm text-[#c8a45d]">
    {isRtl ? "عرض تفاصيل الفرصة ←" : "View Opportunity →"}
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