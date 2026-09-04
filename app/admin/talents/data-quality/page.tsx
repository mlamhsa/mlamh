import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTalentProfileDataQualityIssues } from "@/lib/talent/profile-data-quality";

const PAGE_SIZE = 20;
const INVALID_MEASUREMENTS_FILTER = [
  "height_cm.lte.0",
  "weight_kg.lte.0",
  "shoe_size.lte.0",
  "chest_size.lte.0",
  "waist_size.lte.0",
  "hip_size.lte.0",
].join(",");

type PageProps = {
  searchParams: Promise<{
    lang?: string;
    page?: string;
  }>;
};

type TalentQualityRow = {
  id: number;
  slug: string | null;
  name_ar: string | null;
  name_en: string | null;
  display_name_ar: string | null;
  display_name_en: string | null;
  image_url: string | null;
  city_ar: string | null;
  city_en: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  shoe_size: number | null;
  chest_size: number | null;
  waist_size: number | null;
  hip_size: number | null;
};

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function pageUrl(language: "ar" | "en", page: number) {
  const params = new URLSearchParams({ lang: language });
  if (page > 1) params.set("page", String(page));
  return `/admin/talents/data-quality?${params.toString()}`;
}

export default async function AdminTalentDataQualityPage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const params = await searchParams;
  const language: "ar" | "en" = params.lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const page = parsePage(params.page);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const adminClient = createAdminClient();
  const { data, error, count } = await adminClient
    .from("admin_talent_profiles")
    .select(
      `
        id,
        slug,
        name_ar,
        name_en,
        display_name_ar,
        display_name_en,
        image_url,
        city_ar,
        city_en,
        height_cm,
        weight_kg,
        shoe_size,
        chest_size,
        waist_size,
        hip_size
      `,
      { count: "exact" },
    )
    .or(INVALID_MEASUREMENTS_FILTER)
    .order("id", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`[AdminTalentDataQualityPage] ${error.message}`);
  }

  const rows = (data ?? []) as TalentQualityRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main dir={ar ? "rtl" : "ltr"} className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-[0.25em]">
                {ar ? "تشخيص جودة البيانات" : "Data quality diagnostics"}
              </p>
            </div>
            <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
              {ar ? "قياسات تحتاج مراجعة" : "Measurements needing review"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
              {ar
                ? "هذه القائمة تعرض فقط الملفات التي تحتوي قياسًا صفريًا أو سالبًا. لا يتم تعديل أي قيمة تلقائيًا؛ الهدف هو تسهيل المراجعة والتصحيح الآمن."
                : "This list only shows profiles with a zero or negative physical measurement. Nothing is changed automatically; it is an operational queue for safe review and correction."}
            </p>
          </div>

          <Link
            href={`/admin/talents?lang=${language}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm text-white/60 transition hover:border-gold/30 hover:text-gold"
          >
            {ar ? "العودة إلى المواهب" : "Back to talents"}
          </Link>
        </div>

        <section className="mt-6 rounded-3xl border border-amber-400/15 bg-amber-400/[0.035] p-5">
          <p className="text-xs text-white/40">
            {ar ? "إجمالي الملفات التي تحتاج مراجعة" : "Profiles needing review"}
          </p>
          <p className="mt-2 text-3xl font-light text-amber-200">{total}</p>
        </section>

        <div className="mt-6 grid gap-4">
          {rows.length === 0 ? (
            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/[0.04] p-8 text-center text-sm text-emerald-200">
              {ar
                ? "لا توجد حاليًا قياسات صفرية أو سالبة تحتاج مراجعة."
                : "There are currently no zero or negative measurements requiring review."}
            </div>
          ) : (
            rows.map((talent) => {
              const issues = getTalentProfileDataQualityIssues(talent);
              const name =
                (ar
                  ? talent.display_name_ar || talent.name_ar || talent.display_name_en || talent.name_en
                  : talent.display_name_en || talent.name_en || talent.display_name_ar || talent.name_ar) ||
                `#${talent.id}`;
              const city = ar ? talent.city_ar || talent.city_en : talent.city_en || talent.city_ar;

              return (
                <article
                  key={talent.id}
                  className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        {talent.image_url ? (
                          <Image src={talent.image_url} alt="" fill className="object-cover" sizes="64px" />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg text-white">{name}</h2>
                        <p className="mt-1 text-xs text-white/35">
                          {city ? `${city} · ` : ""}#{talent.id}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {issues.map((issue) => (
                            <span
                              key={issue.key}
                              className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs text-amber-200"
                            >
                              {ar ? issue.ar : issue.en}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={`/admin/talents/${talent.id}?lang=${language}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold"
                      >
                        {ar ? "مراجعة الملف" : "Review profile"}
                      </Link>
                      <Link
                        href={`/admin/talents/${talent.id}/edit?lang=${language}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.06] px-4 text-xs text-gold transition hover:bg-gold hover:text-black"
                      >
                        {ar ? "تعديل" : "Edit"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {totalPages > 1 ? (
          <nav className="mt-6 flex items-center justify-center gap-3" aria-label={ar ? "صفحات النتائج" : "Results pages"}>
            <Link
              aria-disabled={page <= 1}
              href={pageUrl(language, Math.max(1, page - 1))}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                page <= 1
                  ? "pointer-events-none border-white/5 text-white/15"
                  : "border-white/10 text-white/50 hover:border-gold/30 hover:text-gold"
              }`}
            >
              {ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Link>

            <span className="text-xs text-white/40">
              {page} / {totalPages}
            </span>

            <Link
              aria-disabled={page >= totalPages}
              href={pageUrl(language, Math.min(totalPages, page + 1))}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                page >= totalPages
                  ? "pointer-events-none border-white/5 text-white/15"
                  : "border-white/10 text-white/50 hover:border-gold/30 hover:text-gold"
              }`}
            >
              {ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Link>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
