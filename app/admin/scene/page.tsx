import Link from "next/link";
import { BookOpenText, FilePenLine, Plus, Sparkles } from "lucide-react";

import { AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SceneService } from "@/lib/services/SceneService";
import type { SceneArticle, SceneCategory } from "@/lib/types/scene";

export const metadata = {
  title: "MLAMH Scene — Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ lang?: string; error?: string }>;
};

function dateLabel(value: string | null, locale: "ar" | "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function statusLabel(status: string, isArabic: boolean) {
  if (status === "published") return isArabic ? "منشور" : "Published";
  if (status === "archived") return isArabic ? "مؤرشف" : "Archived";
  return isArabic ? "مسودة" : "Draft";
}

function errorLabel(code: string | undefined, isArabic: boolean) {
  if (!code) return null;
  const map: Record<string, { ar: string; en: string }> = {
    invalid_slug: { ar: "الرابط المختصر غير صالح. استخدم حروفًا إنجليزية صغيرة وأرقامًا وشرطات فقط.", en: "Invalid slug. Use lowercase English letters, numbers and hyphens only." },
    invalid_title: { ar: "العنوان العربي مطلوب وبحد أقصى 180 حرفًا.", en: "Arabic title is required and must be 180 characters or fewer." },
    invalid_content: { ar: "المحتوى العربي مطلوب ويجب أن يكون 20 حرفًا على الأقل.", en: "Arabic content is required and must be at least 20 characters." },
    duplicate_slug: { ar: "هذا الرابط المختصر مستخدم في مقال آخر.", en: "This slug is already used by another article." },
    create_failed: { ar: "تعذر إنشاء المقال. لم يتم حفظ أي تغييرات.", en: "Article creation failed. No changes were saved." },
    invalid_category: { ar: "اختر تصنيفًا صالحًا.", en: "Choose a valid category." },
    invalid_type: { ar: "نوع المحتوى غير صالح.", en: "Invalid content type." },
    invalid_audience: { ar: "الجمهور المحدد غير صالح.", en: "Invalid audience." },
    invalid_status: { ar: "حالة المقال غير صالحة.", en: "Invalid article status." },
    invalid_read_time: { ar: "وقت القراءة يجب أن يكون بين دقيقة و180 دقيقة.", en: "Read time must be between 1 and 180 minutes." },
    invalid_publish_date: { ar: "تاريخ النشر غير صالح.", en: "Invalid publish date." },
  };
  const item = map[code];
  return item ? (isArabic ? item.ar : item.en) : (isArabic ? "تعذر إكمال العملية." : "Unable to complete the operation.");
}

export default async function AdminScenePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const query = await searchParams;
  const locale: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";

  const [articlesResult, categoriesResult] = await Promise.all([
    SceneService.getArticlesForAdmin({ limit: 200 }),
    SceneService.getCategoriesForAdmin(),
  ]);

  if (articlesResult.error) throw new Error(articlesResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);

  const articles = (articlesResult.data ?? []) as SceneArticle[];
  const categories = (categoriesResult.data ?? []) as SceneCategory[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const published = articles.filter((article) => article.status === "published").length;
  const drafts = articles.filter((article) => article.status === "draft").length;
  const featured = articles.filter((article) => article.is_featured && article.status === "published").length;
  const errorMessage = errorLabel(query.error, isArabic);

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
      <AdminPageHeader
        eyebrow="MLAMH SCENE"
        title={isArabic ? "مشهد ملامح" : "MLAMH Scene"}
        description={
          isArabic
            ? "إدارة الأدلة والشروحات والمقالات والقصص والتقارير من مساحة محتوى واحدة."
            : "Manage guides, help content, articles, stories and reports from one content workspace."
        }
        actions={
          <Link href={`/admin/scene/new?lang=${locale}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-xs font-semibold text-black transition hover:opacity-90">
            <Plus className="h-4 w-4" />
            {isArabic ? "مقال جديد" : "New article"}
          </Link>
        }
      />

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">{errorMessage}</div>
      ) : null}

      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminStatCard label={isArabic ? "إجمالي المحتوى" : "Total content"} value={articles.length} />
        <AdminStatCard label={isArabic ? "منشور" : "Published"} value={published} />
        <AdminStatCard label={isArabic ? "مسودات" : "Drafts"} value={drafts} active={drafts > 0} />
        <AdminStatCard label={isArabic ? "مختارات" : "Featured"} value={featured} />
      </section>

      <section className="mt-7 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.id} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55">
              {isArabic ? category.name_ar : category.name_en}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-medium">{isArabic ? "المحتوى" : "Content"}</h2>
        </div>

        {articles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <BookOpenText className="mx-auto h-8 w-8 text-gold/70" />
            <p className="mt-4 text-sm text-white/55">{isArabic ? "لا توجد مقالات بعد. ابدأ بأول محتوى لمشهد ملامح." : "No articles yet. Create the first MLAMH Scene article."}</p>
            <Link href={`/admin/scene/new?lang=${locale}`} className="mt-5 inline-flex rounded-xl border border-gold/30 px-4 py-2.5 text-xs text-gold">{isArabic ? "إنشاء أول مقال" : "Create first article"}</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {articles.map((article) => {
              const category = article.category_id ? categoryById.get(article.category_id) : null;
              return (
                <div key={article.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] ${article.status === "published" ? "border-emerald-400/20 text-emerald-300" : article.status === "archived" ? "border-white/10 text-white/35" : "border-gold/25 text-gold"}`}>
                        {statusLabel(article.status, isArabic)}
                      </span>
                      {category ? <span className="text-[10px] text-white/30">{isArabic ? category.name_ar : category.name_en}</span> : null}
                      {article.is_featured ? <span className="text-[10px] text-gold">★ {isArabic ? "مختار" : "Featured"}</span> : null}
                    </div>
                    <h3 className="mt-2 truncate text-base font-medium text-white/90">{isArabic ? article.title_ar : article.title_en || article.title_ar}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/25">
                      <span dir="ltr">/{article.slug}</span>
                      <span>{isArabic ? "آخر تحديث" : "Updated"}: {dateLabel(article.updated_at, locale)}</span>
                      {article.published_at ? <span>{isArabic ? "النشر" : "Published"}: {dateLabel(article.published_at, locale)}</span> : null}
                    </div>
                  </div>
                  <Link href={`/admin/scene/${article.id}?lang=${locale}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs text-white/65 transition hover:border-gold/30 hover:text-gold">
                    <FilePenLine className="h-3.5 w-3.5" />
                    {isArabic ? "تحرير" : "Edit"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </AdminPageContainer>
    </div>
  );
}
