// app/[locale]/opportunities/page.tsx

import Link from "next/link";

import { getCurrentAccountType } from "@/lib/auth/get-current-account-type";
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

function OpportunityIcon({
  name,
  className = "h-4 w-4",
}: {
  name:
    | "arrow"
    | "briefcase"
    | "calendar"
    | "city"
    | "filter"
    | "search"
    | "wallet"
    | "clock"
    | "sparkles";
  className?: string;
}) {
  if (name === "briefcase") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="7" width="16" height="12" rx="2.5" />
        <path d="M9 7V5h6v2M4 11h16" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
        <path d="M8 4v3M16 4v3M4 9.5h16" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "city") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    );
  }

  if (name === "filter") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 4 4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="6" width="16" height="13" rx="2.5" />
        <path d="M15 10h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "sparkles") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={className}
        aria-hidden="true"
      >
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
        <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14M14 7l5 5-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getRelativeDate(date: string, locale: "ar" | "en") {
  const now = new Date();
  const created = new Date(date);
  const diff = now.getTime() - created.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (locale === "ar") {
    if (minutes < 1) return "الآن";
    if (minutes < 60) {
      return `منذ ${minutes} ${minutes === 1 ? "دقيقة" : "دقائق"}`;
    }
    if (hours < 24) {
      return `منذ ${hours} ${hours === 1 ? "ساعة" : "ساعات"}`;
    }
    if (days < 30) {
      return `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;
    }

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
  const diffHours =
    (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  return diffHours <= 48;
}

function formatBudget(value: unknown, isRtl: boolean) {
  const budget = Number(value);

  if (!budget) {
    return isRtl ? "حسب الاتفاق" : "By agreement";
  }

  return `${new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US").format(
    budget,
  )} ${isRtl ? "ريال" : "SAR"}`;
}

function getOpportunityTypeLabel(value: unknown, isRtl: boolean) {
  const type = String(value ?? "");

  const labels: Record<string, { ar: string; en: string }> = {
    actor: { ar: "ممثل", en: "Actor" },
    actress: { ar: "ممثلة", en: "Actress" },
    model: { ar: "عارض أزياء", en: "Model" },
    presenter: { ar: "مقدم", en: "Presenter" },
    voice_actor: { ar: "ممثل صوتي", en: "Voice Actor" },
    singer: { ar: "مغنٍ", en: "Singer" },
    dancer: { ar: "راقص", en: "Dancer" },
    athlete: { ar: "رياضي", en: "Athlete" },
    extra: { ar: "كومبارس", en: "Extra" },
    influencer: { ar: "صانع محتوى", en: "Influencer" },
    content_creator: { ar: "صانع محتوى", en: "Content Creator" },
    makeup_artist: { ar: "خبير تجميل", en: "Makeup Artist" },
    photographer: { ar: "مصور", en: "Photographer" },
  };

  if (labels[type]) {
    return isRtl ? labels[type].ar : labels[type].en;
  }

  return type
    ? type.replaceAll("_", " ")
    : isRtl
      ? "فرصة"
      : "Opportunity";
}

function getSortLabel(value: string, isRtl: boolean) {
  if (value === "oldest") {
    return isRtl ? "الأقدم" : "Oldest";
  }

  if (value === "budget_high") {
    return isRtl ? "أعلى ميزانية" : "Highest budget";
  }

  if (value === "budget_low") {
    return isRtl ? "أقل ميزانية" : "Lowest budget";
  }

  return isRtl ? "الأحدث أولًا" : "Newest first";
}

export default async function OpportunitiesPage({
  params,
  searchParams,
}: OpportunitiesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const locale = resolvedParams?.locale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";

  const [opportunities, accountType] = await Promise.all([
    getPublishedOpportunities(),
    getCurrentAccountType(),
  ]);

  const search = resolvedSearchParams.search ?? "";
  const selectedCity = resolvedSearchParams.city ?? "";
  const selectedType = resolvedSearchParams.type ?? "";
  const selectedSort = resolvedSearchParams.sort || "newest";

  const cities = Array.from(
    new Set(
      opportunities
        .map((item: any) =>
          isRtl
            ? item.city_ar || item.city_en
            : item.city_en || item.city_ar,
        )
        .filter(Boolean),
    ),
  );

  const types = Array.from(
    new Set(
      opportunities
        .map((item: any) => item.opportunity_type)
        .filter(Boolean),
    ),
  );

  const filteredOpportunities = opportunities
    .filter((item: any) => {
      const title = String(item.title ?? "").toLowerCase();
      const description = String(item.description ?? "").toLowerCase();
      const company = String(
        item.company_name || item.publisher_name || item.company || "",
      ).toLowerCase();

      const city = isRtl
        ? item.city_ar || item.city_en
        : item.city_en || item.city_ar;

      const normalizedSearch = search.toLowerCase();

      const matchesSearch =
        !search ||
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        company.includes(normalizedSearch);

      const matchesCity = !selectedCity || city === selectedCity;
      const matchesType =
        !selectedType || item.opportunity_type === selectedType;

      return matchesSearch && matchesCity && matchesType;
    })
    .sort((a: any, b: any) => {
      if (selectedSort === "oldest") {
        return (
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime()
        );
      }

      if (selectedSort === "budget_high") {
        return Number(b.budget ?? 0) - Number(a.budget ?? 0);
      }

      if (selectedSort === "budget_low") {
        return Number(a.budget ?? 0) - Number(b.budget ?? 0);
      }

      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      );
    });

  const latestUpdate = opportunities[0]?.created_at
    ? getRelativeDate(opportunities[0].created_at, locale)
    : "—";

  const newCount = opportunities.filter((item: any) =>
    isNewOpportunity(item.created_at),
  ).length;

  const hasFilters = Boolean(
    search.trim() ||
      selectedCity.trim() ||
      selectedType.trim() ||
      selectedSort !== "newest",
  );

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-background text-white"
    >
      {/* Mobile app interface */}
      <div className="lg:hidden">
        <section className="px-4 pb-6 pt-5">
          <header className="rounded-[1.75rem] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.15),transparent_45%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                  <OpportunityIcon name="briefcase" />
                  <span>
                    {isRtl ? "فرص ملامح" : "MLAMH opportunities"}
                  </span>
                </div>

                <h1 className="mt-4 text-3xl font-semibold leading-tight">
                  {isRtl ? "اكتشف فرصتك القادمة" : "Find your next opportunity"}
                </h1>

                <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
                  {isRtl
                    ? "استعرض فرص الكاست والإعلانات وصناعة المحتوى من الشركات والوكالات."
                    : "Browse casting, advertising and content opportunities from companies and agencies."}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08] text-gold">
                <OpportunityIcon
                  name="sparkles"
                  className="h-5 w-5"
                />
              </div>
            </div>

            {accountType === "talent" ? (
              <Link
                href={`/${locale}/talent-dashboard/applications`}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition active:scale-[0.99]"
              >
                <OpportunityIcon name="briefcase" />
                {isRtl ? "عرض طلباتي" : "My applications"}
              </Link>
            ) : accountType === null ? (
              <Link
                href={`/${locale}/join`}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition active:scale-[0.99]"
              >
                <OpportunityIcon name="sparkles" />
                {isRtl ? "انضم كموهبة" : "Join as talent"}
              </Link>
            ) : null}
          </header>
        </section>

        <section className="overflow-hidden pb-6">
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MobileStatCard
              label={isRtl ? "كل الفرص" : "All"}
              value={opportunities.length}
              icon="briefcase"
              highlighted
            />

            <MobileStatCard
              label={isRtl ? "جديدة" : "New"}
              value={newCount}
              icon="sparkles"
            />

            <MobileStatCard
              label={isRtl ? "المدن" : "Cities"}
              value={cities.length}
              icon="city"
            />

            <MobileStatCard
              label={isRtl ? "التصنيفات" : "Categories"}
              value={types.length}
              icon="filter"
            />
          </div>
        </section>

        <section className="px-4 pb-7">
          <div className="rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gold">
                  {isRtl ? "البحث والتصفية" : "Search and filters"}
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  {isRtl
                    ? "اعثر على الفرصة المناسبة"
                    : "Find the right opportunity"}
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/45">
                <OpportunityIcon name="filter" />
              </div>
            </div>

            <form method="GET" className="grid gap-3">
              <label className="relative">
                <OpportunityIcon
                  name="search"
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-gold ${
                    isRtl ? "right-4" : "left-4"
                  }`}
                />

                <input
                  name="search"
                  defaultValue={search}
                  type="text"
                  placeholder={
                    isRtl
                      ? "ابحث باسم الفرصة أو الشركة..."
                      : "Search opportunity or company..."
                  }
                  className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-gold/40 ${
                    isRtl ? "pl-4 pr-11" : "pl-11 pr-4"
                  }`}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <select
                  name="type"
                  defaultValue={selectedType}
                  className="min-h-13 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-gold/40"
                >
                  <option value="">
                    {isRtl ? "كل الأنواع" : "All types"}
                  </option>

                  {types.map((type) => (
                    <option key={String(type)} value={String(type)}>
                      {getOpportunityTypeLabel(type, isRtl)}
                    </option>
                  ))}
                </select>

                <select
                  name="city"
                  defaultValue={selectedCity}
                  className="min-h-13 min-w-0 rounded-2xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-gold/40"
                >
                  <option value="">
                    {isRtl ? "كل المدن" : "All cities"}
                  </option>

                  {cities.map((city) => (
                    <option key={String(city)} value={String(city)}>
                      {String(city)}
                    </option>
                  ))}
                </select>
              </div>

              <select
                name="sort"
                defaultValue={selectedSort}
                className="min-h-13 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-gold/40"
              >
                <option value="newest">
                  {isRtl ? "الأحدث أولًا" : "Newest first"}
                </option>
                <option value="oldest">
                  {isRtl ? "الأقدم أولًا" : "Oldest first"}
                </option>
                <option value="budget_high">
                  {isRtl ? "أعلى ميزانية" : "Highest budget"}
                </option>
                <option value="budget_low">
                  {isRtl ? "أقل ميزانية" : "Lowest budget"}
                </option>
              </select>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <button
                  type="submit"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition active:scale-[0.99]"
                >
                  <OpportunityIcon name="search" />
                  {isRtl ? "عرض النتائج" : "Show results"}
                </button>

                <Link
                  href={`/${locale}/opportunities`}
                  aria-label={isRtl ? "مسح الفلاتر" : "Clear filters"}
                  className="inline-flex min-h-13 min-w-13 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm text-white/55 transition active:bg-white/[0.06]"
                >
                  {isRtl ? "مسح" : "Clear"}
                </Link>
              </div>
            </form>
          </div>
        </section>

        <section className="px-4 pb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-gold">
                {hasFilters
                  ? isRtl
                    ? "نتائج البحث"
                    : "Search results"
                  : isRtl
                    ? "أحدث الفرص"
                    : "Latest opportunities"}
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {isRtl
                  ? `${filteredOpportunities.length} فرصة متاحة`
                  : `${filteredOpportunities.length} opportunities`}
              </h2>
            </div>

            <span className="shrink-0 text-xs text-white/35">
              {getSortLabel(selectedSort, isRtl)}
            </span>
          </div>

          {filteredOpportunities.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.025] px-5 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.06] text-gold">
                <OpportunityIcon
                  name="search"
                  className="h-6 w-6"
                />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                {isRtl
                  ? "لا توجد فرص مطابقة"
                  : "No matching opportunities"}
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/45">
                {isRtl
                  ? "جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر."
                  : "Try changing your search terms or clearing some filters."}
              </p>

              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gold px-6 text-sm text-black"
              >
                {isRtl ? "إزالة الفلاتر" : "Clear filters"}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredOpportunities.map((item: any) => {
                const slug = item.slug || String(item.id);

                const city = isRtl
                  ? item.city_ar || item.city_en || "—"
                  : item.city_en || item.city_ar || "—";

                const createdDate = item.created_at
                  ? getRelativeDate(item.created_at, locale)
                  : "—";

                const isNew = isNewOpportunity(item.created_at);
                const budget = formatBudget(item.budget, isRtl);

                const typeLabel = getOpportunityTypeLabel(
                  item.opportunity_type,
                  isRtl,
                );

                const companyName =
                  item.company_name ||
                  item.publisher_name ||
                  item.company ||
                  null;

                const imageUrl =
                  item.cover_image || item.image_url || null;

                return (
                  <Link
                    key={item.id}
                    href={`/${locale}/opportunities/${slug}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-white/[0.03] transition active:scale-[0.99]"
                  >
                    {imageUrl ? (
                      <div
                        className="relative h-44 bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${imageUrl}")`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/20" />

                        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                          <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] text-white/75 backdrop-blur">
                            {typeLabel}
                          </span>

                          {isNew ? (
                            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.12] px-3 py-1 text-[10px] text-emerald-200 backdrop-blur">
                              {isRtl ? "جديدة" : "New"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="p-5">
                      {!imageUrl ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-[10px] text-gold">
                            {typeLabel}
                          </span>

                          {isNew ? (
                            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-3 py-1 text-[10px] text-emerald-200">
                              {isRtl ? "جديدة" : "New"}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/35">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <OpportunityIcon name="city" />
                          <span className="truncate">{city}</span>
                        </span>

                        <span className="inline-flex shrink-0 items-center gap-2">
                          <OpportunityIcon name="clock" />
                          {createdDate}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-semibold leading-snug text-white">
                        {item.title ||
                          (isRtl
                            ? "فرصة بدون عنوان"
                            : "Untitled opportunity")}
                      </h3>

                      {companyName ? (
                        <p className="mt-2 text-sm text-gold/75">
                          {companyName}
                        </p>
                      ) : null}

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/40">
                        {item.description ||
                          (isRtl
                            ? "لا يوجد وصف متاح لهذه الفرصة."
                            : "No description is available for this opportunity.")}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-4">
                        <span>
                          <span className="block text-[10px] text-white/30">
                            {isRtl ? "الميزانية" : "Budget"}
                          </span>

                          <span className="mt-1 block text-sm text-white">
                            {budget}
                          </span>
                        </span>

                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/30 text-gold">
                          <span className={isRtl ? "rotate-180" : ""}>
                            <OpportunityIcon name="arrow" />
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Existing desktop interface */}
      <div className="hidden px-6 pb-24 pt-32 lg:block">
        <div className="mx-auto max-w-7xl">
          <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-10">
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

            <div className="relative flex items-end justify-between gap-7">
              <div>
                {accountType ? (
                  <Link
                    href={
                      accountType === "talent"
                        ? `/${locale}/talent-dashboard`
                        : accountType === "publisher"
                          ? `/${locale}/publisher-dashboard`
                          : "/admin"
                    }
                    className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
                  >
                    <span className={isRtl ? "rotate-180" : ""}>
                      <OpportunityIcon name="arrow" />
                    </span>

                    {isRtl
                      ? "العودة إلى لوحة التحكم"
                      : "Back to Dashboard"}
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
                  >
                    <span className={isRtl ? "rotate-180" : ""}>
                      <OpportunityIcon name="arrow" />
                    </span>

                    {isRtl ? "العودة إلى الرئيسية" : "Back to Home"}
                  </Link>
                )}

                <p className="arabic-safe mt-8 text-[10px] uppercase tracking-[0.36em] text-gold">
                  {isRtl ? "فرص ملامح" : "MLAMH Opportunities"}
                </p>

                <h1 className="mt-3 text-6xl font-light leading-tight">
                  {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/50">
                  {isRtl
                    ? "اكتشف فرص الكاست والإعلانات وصناعة المحتوى المنشورة من الوكالات والشركات والعلامات التجارية."
                    : "Discover casting, advertising, and content creation opportunities from agencies, companies, and brands."}
                </p>
              </div>

              {accountType === "talent" ? (
                <Link
                  href={`/${locale}/talent-dashboard/applications`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3.5 text-sm text-black transition hover:bg-gold-soft"
                >
                  <OpportunityIcon name="briefcase" />
                  {isRtl ? "عرض طلباتي" : "My Applications"}
                </Link>
              ) : accountType === null ? (
                <Link
                  href={`/${locale}/join`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold px-6 py-3.5 text-sm text-black transition hover:bg-gold-soft"
                >
                  <OpportunityIcon name="sparkles" />
                  {isRtl ? "انضم كموهبة" : "Join as Talent"}
                </Link>
              ) : null}
            </div>
          </header>

          <section className="mt-6 grid grid-cols-4 gap-3">
            <StatCard
              label={isRtl ? "الفرص المنشورة" : "Published"}
              value={opportunities.length}
              icon="briefcase"
              highlighted
            />

            <StatCard
              label={isRtl ? "فرص جديدة" : "New"}
              value={newCount}
              icon="sparkles"
            />

            <StatCard
              label={isRtl ? "المدن" : "Cities"}
              value={cities.length}
              icon="city"
            />

            <StatCard
              label={isRtl ? "التصنيفات" : "Categories"}
              value={types.length}
              icon="filter"
            />
          </section>

          <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-end justify-between border-b border-white/10 pb-5">
              <div>
                <p className="arabic-safe text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isRtl ? "بحث الفرص" : "Opportunity Search"}
                </p>

                <h2 className="mt-2 text-3xl font-light">
                  {isRtl
                    ? "اعثر على الفرصة المناسبة"
                    : "Find the Right Opportunity"}
                </h2>
              </div>

              <div className="text-xs text-white/35">
                {isRtl
                  ? `آخر تحديث ${latestUpdate}`
                  : `Latest update ${latestUpdate}`}
              </div>
            </div>

            <form
              method="GET"
              className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto_auto]"
            >
              <label className="relative">
                <OpportunityIcon
                  name="search"
                  className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 ${
                    isRtl ? "right-4" : "left-4"
                  }`}
                />

                <input
                  name="search"
                  defaultValue={search}
                  type="text"
                  placeholder={
                    isRtl
                      ? "ابحث باسم الفرصة أو الشركة..."
                      : "Search by opportunity or company..."
                  }
                  className={`w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-gold/40 ${
                    isRtl ? "pl-4 pr-11" : "pl-11 pr-4"
                  }`}
                />
              </label>

              <select
                name="type"
                defaultValue={selectedType}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition focus:border-gold/40"
              >
                <option value="">
                  {isRtl ? "كل أنواع الفرص" : "All Types"}
                </option>

                {types.map((type) => (
                  <option key={String(type)} value={String(type)}>
                    {getOpportunityTypeLabel(type, isRtl)}
                  </option>
                ))}
              </select>

              <select
                name="city"
                defaultValue={selectedCity}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition focus:border-gold/40"
              >
                <option value="">
                  {isRtl ? "كل المدن" : "All Cities"}
                </option>

                {cities.map((city) => (
                  <option key={String(city)} value={String(city)}>
                    {String(city)}
                  </option>
                ))}
              </select>

              <select
                name="sort"
                defaultValue={selectedSort}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white outline-none transition focus:border-gold/40"
              >
                <option value="newest">
                  {isRtl ? "الأحدث" : "Newest"}
                </option>
                <option value="oldest">
                  {isRtl ? "الأقدم" : "Oldest"}
                </option>
                <option value="budget_high">
                  {isRtl ? "أعلى ميزانية" : "Highest Budget"}
                </option>
                <option value="budget_low">
                  {isRtl ? "أقل ميزانية" : "Lowest Budget"}
                </option>
              </select>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold px-6 text-sm text-black transition hover:bg-gold-soft"
              >
                <OpportunityIcon name="search" />
                {isRtl ? "بحث" : "Search"}
              </button>

              <Link
                href={`/${locale}/opportunities`}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-6 text-sm text-white/55 transition hover:border-gold/30 hover:text-gold"
              >
                {isRtl ? "مسح" : "Clear"}
              </Link>
            </form>
          </section>

          <div className="mt-6 flex items-center justify-between text-xs text-white/35">
            <p>
              {isRtl
                ? `عرض ${filteredOpportunities.length} فرصة`
                : `Showing ${filteredOpportunities.length} opportunities`}
            </p>

            <p>
              {isRtl
                ? `الترتيب: ${getSortLabel(selectedSort, true)}`
                : `Sort: ${getSortLabel(selectedSort, false)}`}
            </p>
          </div>

          {filteredOpportunities.length === 0 ? (
            <section className="mt-6 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-8 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <OpportunityIcon
                  name="search"
                  className="h-6 w-6"
                />
              </div>

              <h2 className="mt-5 text-2xl font-light">
                {isRtl
                  ? "لا توجد فرص مطابقة"
                  : "No matching opportunities"}
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isRtl
                  ? "جرّب تغيير كلمات البحث أو إزالة بعض الفلاتر للوصول إلى نتائج أكثر."
                  : "Try changing your search terms or clearing some filters."}
              </p>

              <Link
                href={`/${locale}/opportunities`}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-gold/40 bg-gold px-6 py-3 text-sm text-black transition hover:bg-gold-soft"
              >
                {isRtl ? "إزالة الفلاتر" : "Clear Filters"}
              </Link>
            </section>
          ) : (
            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOpportunities.map((item: any) => {
                const slug = item.slug || String(item.id);

                const city = isRtl
                  ? item.city_ar || item.city_en || "—"
                  : item.city_en || item.city_ar || "—";

                const createdDate = item.created_at
                  ? getRelativeDate(item.created_at, locale)
                  : "—";

                const isNew = isNewOpportunity(item.created_at);
                const budget = formatBudget(item.budget, isRtl);

                const typeLabel = getOpportunityTypeLabel(
                  item.opportunity_type,
                  isRtl,
                );

                const companyName =
                  item.company_name ||
                  item.publisher_name ||
                  item.company ||
                  null;

                const imageUrl =
                  item.cover_image || item.image_url || null;

                return (
                  <Link
                    key={item.id}
                    href={`/${locale}/opportunities/${slug}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025] transition duration-500 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_70px_rgba(201,169,98,0.1)]"
                  >
                    {imageUrl ? (
                      <div
                        className="relative h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${imageUrl}")`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-black/20" />

                        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                          <span className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] text-white/70 backdrop-blur">
                            {typeLabel}
                          </span>

                          {isNew ? (
                            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.1] px-3 py-1 text-[10px] text-emerald-200 backdrop-blur">
                              {isRtl ? "جديدة" : "New"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex min-h-[360px] flex-col p-6">
                      {!imageUrl ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-[10px] text-gold">
                            {typeLabel}
                          </span>

                          {isNew ? (
                            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-3 py-1 text-[10px] text-emerald-200">
                              {isRtl ? "جديدة" : "New"}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between gap-4 text-xs text-white/35">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <OpportunityIcon name="city" />
                          <span className="truncate">{city}</span>
                        </span>

                        <span className="inline-flex shrink-0 items-center gap-2">
                          <OpportunityIcon name="clock" />
                          {createdDate}
                        </span>
                      </div>

                      <h2 className="mt-5 text-2xl font-light leading-snug text-white transition group-hover:text-gold">
                        {item.title ||
                          (isRtl
                            ? "فرصة بدون عنوان"
                            : "Untitled Opportunity")}
                      </h2>

                      {companyName ? (
                        <p className="mt-2 text-sm text-white/45">
                          {companyName}
                        </p>
                      ) : null}

                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/40">
                        {item.description ||
                          (isRtl
                            ? "لا يوجد وصف متاح لهذه الفرصة."
                            : "No description is available for this opportunity.")}
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="arabic-safe inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                            <OpportunityIcon name="wallet" />
                            {isRtl ? "الميزانية" : "Budget"}
                          </p>

                          <p className="mt-2 text-sm text-white">
                            {budget}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <p className="arabic-safe inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/30">
                            <OpportunityIcon name="calendar" />
                            {isRtl ? "تاريخ النشر" : "Published"}
                          </p>

                          <p className="mt-2 text-sm text-white">
                            {createdDate}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto pt-6">
                        <div className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gold/35 text-sm text-gold transition group-hover:bg-gold group-hover:text-black">
                          {isRtl ? "عرض التفاصيل" : "View Details"}

                          <span className={isRtl ? "rotate-180" : ""}>
                            <OpportunityIcon name="arrow" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function MobileStatCard({
  label,
  value,
  icon,
  highlighted = false,
}: {
  label: string;
  value: number;
  icon: "briefcase" | "sparkles" | "city" | "filter";
  highlighted?: boolean;
}) {
  return (
    <article
      className={`min-w-[132px] rounded-[1.5rem] border p-4 ${
        highlighted
          ? "border-gold/25 bg-gold/[0.07]"
          : "border-white/[0.08] bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.06] text-gold">
          <OpportunityIcon name={icon} />
        </div>

        <span className="text-2xl font-semibold text-white">{value}</span>
      </div>

      <p className="mt-4 text-xs text-white/45">{label}</p>
    </article>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlighted = false,
}: {
  label: string;
  value: number;
  icon: "briefcase" | "sparkles" | "city" | "filter";
  highlighted?: boolean;
}) {
  return (
    <article
      className={`rounded-[1.5rem] border p-5 transition hover:-translate-y-0.5 hover:border-gold/25 ${
        highlighted
          ? "border-gold/25 bg-gold/[0.06]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/[0.05] text-gold">
        <OpportunityIcon name={icon} />
      </div>

      <p className="arabic-safe mt-5 text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-2 text-4xl font-light">{value}</p>
    </article>
  );
}