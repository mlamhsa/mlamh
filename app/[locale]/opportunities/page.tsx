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

function getRelativeDate(date: string, locale: "ar" | "en") {
  const now = new Date();
  const created = new Date(date);
  const diff = now.getTime() - created.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (locale === "ar") {
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`;
    if (hours < 24) return `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`;
    if (days < 30) return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;

    return new Intl.DateTimeFormat("ar-SA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(created);
  }

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} h ago`;
  if (days < 30) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(created);
}

function isNewOpportunity(date?: string | null) {
  if (!date) return false;

  const now = new Date();
  const created = new Date(date);
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  return diffHours <= 48;
}

function formatBudget(value: unknown, isRtl: boolean) {
  const budget = Number(value);

  if (!budget) {
    return isRtl ? "حسب الاتفاق" : "By agreement";
  }

  return `${new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US").format(budget)} ${
    isRtl ? "ريال" : "SAR"
  }`;
}

export default async function OpportunitiesPage({
  params,
  searchParams,
}: OpportunitiesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const locale = resolvedParams?.locale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  const opportunities = await getPublishedOpportunities();

  const search = resolvedSearchParams.search ?? "";
  const selectedCity = resolvedSearchParams.city ?? "";
  const selectedType = resolvedSearchParams.type ?? "";
  const selectedSort = resolvedSearchParams.sort || "newest";

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

  const filteredOpportunities = opportunities
    .filter((item: any) => {
      const title = String(item.title ?? "").toLowerCase();
      const description = String(item.description ?? "").toLowerCase();
      const city = isRtl
        ? item.city_ar || item.city_en
        : item.city_en || item.city_ar;

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

  const latestUpdate = filteredOpportunities[0]?.created_at
    ? getRelativeDate(filteredOpportunities[0].created_at, locale)
    : "-";

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className={isRtl ? "mb-8 flex justify-start" : "mb-8 flex justify-end"}>
          <Link
            href={`/${locale}`}
            className="rounded-full border border-zinc-800 px-5 py-3 text-sm text-white transition hover:border-[#c8a45d] hover:text-[#c8a45d]"
          >
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>

        <section className="mb-12 rounded-[2.5rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center md:px-10 md:py-16">
          <p className="mb-4 text-[10px] uppercase tracking-[0.45em] text-[#c8a45d]">
            {isRtl ? "فرص ملامح" : "MLAMH Opportunities"}
          </p>

          <h1 className="text-4xl font-light tracking-[0.18em] md:text-6xl">
            {isRtl ? "الفرص المتاحة" : "Opportunities"}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-sm leading-7 text-zinc-500 md:text-base">
            {isRtl
              ? "استكشف فرص الكاست والإعلانات وصناعة المحتوى المنشورة من الوكالات والشركات والعلامات التجارية."
              : "Explore casting, advertising and content creation opportunities published by agencies, companies and brands."}
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-2xl font-light text-white">{filteredOpportunities.length}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {isRtl ? "فرصة منشورة" : "Published opportunities"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-[#c8a45d]">{latestUpdate}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {isRtl ? "آخر تحديث" : "Latest update"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-sm text-[#c8a45d]">
                {selectedSort === "oldest"
                  ? isRtl
                    ? "الأقدم"
                    : "Oldest"
                  : selectedSort === "budget_high"
                    ? isRtl
                      ? "أعلى ميزانية"
                      : "Highest budget"
                    : selectedSort === "budget_low"
                      ? isRtl
                        ? "أقل ميزانية"
                        : "Lowest budget"
                      : isRtl
                        ? "الأحدث أولاً"
                        : "Newest first"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {isRtl ? "الترتيب الحالي" : "Current sort"}
              </p>
            </div>
          </div>
        </section>

        <form
          method="GET"
          className="mb-10 rounded-[2rem] border border-zinc-800 bg-black/40 p-6 md:p-8"
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
            <input
              name="search"
              defaultValue={search}
              type="text"
              placeholder={isRtl ? "ابحث باسم الفرصة..." : "Search opportunity..."}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none placeholder:text-zinc-600"
            />

            <select
              name="type"
              defaultValue={selectedType}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">{isRtl ? "كل أنواع الفرص" : "All Types"}</option>
              {types.map((type) => (
                <option key={String(type)} value={String(type)}>
                  {String(type).replaceAll("_", " ")}
                </option>
              ))}
            </select>

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
              defaultValue={selectedSort || "newest"}
              className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-sm text-white outline-none"
            >
              <option value="newest">{isRtl ? "الأحدث" : "Newest"}</option>
              <option value="oldest">{isRtl ? "الأقدم" : "Oldest"}</option>
              <option value="budget_high">{isRtl ? "أعلى ميزانية" : "Highest Budget"}</option>
              <option value="budget_low">{isRtl ? "أقل ميزانية" : "Lowest Budget"}</option>
            </select>

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
              {isRtl ? "مسح" : "Clear"}
            </Link>
          </div>
        </form>

        <div className="mb-6 flex flex-col gap-2 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>
            {isRtl
              ? `عرض ${filteredOpportunities.length} فرصة`
              : `Showing ${filteredOpportunities.length} opportunities`}
          </p>

          <p>
            {isRtl ? "تظهر أحدث الفرص أولاً" : "Newest opportunities appear first"}
          </p>
        </div>

        {filteredOpportunities.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 p-10 text-center text-zinc-400">
            {isRtl ? "لا توجد فرص مطابقة" : "No matching opportunities"}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((item: any) => {
              const slug = item.slug || String(item.id);
              const city = isRtl
                ? item.city_ar || item.city_en || "-"
                : item.city_en || item.city_ar || "-";
              const createdDate = item.created_at
                ? getRelativeDate(item.created_at, locale)
                : "-";
              const isNew = isNewOpportunity(item.created_at);
              const budget = formatBudget(item.budget, isRtl);
              const statusLabel =
                item.status === "open"
                  ? isRtl
                    ? "مفتوحة"
                    : "Open"
                  : item.status || "-";

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/opportunities/${slug}`}
                  className="group relative flex min-h-[380px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.018] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#c8a45d]/70 hover:shadow-[0_24px_70px_rgba(200,164,93,0.12)] md:p-7"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a45d]/70 to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="mb-6 flex items-center justify-between gap-4 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>📍</span>
                      {city}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>🕒</span>
                      {createdDate}
                    </span>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#c8a45d]/35 bg-[#c8a45d]/10 px-3 py-1 text-[11px] text-[#c8a45d]">
                      {item.opportunity_type || "-"}
                    </span>

                    {isNew && (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-300">
                        {isRtl ? "جديدة" : "New"}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-light leading-snug text-white transition group-hover:text-[#c8a45d]">
                    {item.title || "-"}
                  </h2>

                  {(item.company_name || item.publisher_name || item.company) && (
                    <p className="mt-3 text-sm text-zinc-400">
                      {item.company_name || item.publisher_name || item.company}
                    </p>
                  )}

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-zinc-500">
                    {item.description || "-"}
                  </p>

                  <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-zinc-500">
                        {isRtl ? "الحالة" : "Status"}
                      </p>
                      <p className="mt-2 text-[#c8a45d]">
                        <span className="text-emerald-400">●</span> {statusLabel}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs text-zinc-500">
                        {isRtl ? "الميزانية" : "Budget"}
                      </p>
                      <p className="mt-2 text-white">{budget}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-7">
                    <div className="flex items-center justify-center rounded-2xl border border-[#c8a45d]/40 py-3 text-sm text-[#c8a45d] transition group-hover:bg-[#c8a45d] group-hover:text-black">
                      {isRtl ? "عرض التفاصيل" : "View Details"}
                    </div>
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