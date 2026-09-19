import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

import { SceneArticleForm } from "@/components/admin/scene/SceneArticleForm";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { updateSceneArticleAction } from "@/lib/actions/admin-scene-actions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SceneService } from "@/lib/services/SceneService";
import type { SceneArticle, SceneCategory } from "@/lib/types/scene";

export const metadata = {
  title: "Edit Scene Article — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; saved?: string; error?: string }>;
};

function errorLabel(code: string | undefined, isArabic: boolean) {
  if (!code) return null;
  const map: Record<string, { ar: string; en: string }> = {
    invalid_slug: { ar: "الرابط المختصر غير صالح.", en: "Invalid slug." },
    invalid_title: { ar: "العنوان العربي مطلوب وبحد أقصى 180 حرفًا.", en: "Arabic title is required and must be 180 characters or fewer." },
    invalid_content: { ar: "المحتوى العربي مطلوب ويجب أن يكون 20 حرفًا على الأقل.", en: "Arabic content is required and must be at least 20 characters." },
    duplicate_slug: { ar: "هذا الرابط المختصر مستخدم في مقال آخر.", en: "This slug is already used by another article." },
    invalid_category: { ar: "اختر تصنيفًا صالحًا.", en: "Choose a valid category." },
    invalid_type: { ar: "نوع المحتوى غير صالح.", en: "Invalid content type." },
    invalid_audience: { ar: "الجمهور المحدد غير صالح.", en: "Invalid audience." },
    invalid_status: { ar: "حالة المقال غير صالحة.", en: "Invalid article status." },
    invalid_read_time: { ar: "وقت القراءة يجب أن يكون بين دقيقة و180 دقيقة.", en: "Read time must be between 1 and 180 minutes." },
    invalid_publish_date: { ar: "تاريخ النشر غير صالح.", en: "Invalid publish date." },
    update_failed: { ar: "تعذر حفظ التعديلات. بقي المقال دون تغيير.", en: "Unable to save changes. The article was left unchanged." },
  };
  const item = map[code];
  return item ? (isArabic ? item.ar : item.en) : (isArabic ? "تعذر إكمال العملية." : "Unable to complete the operation.");
}

export default async function EditSceneArticlePage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id: idParam }, query] = await Promise.all([params, searchParams]);
  const locale: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) notFound();

  const [articleResult, categoriesResult] = await Promise.all([
    SceneService.getArticleForAdminById(id),
    SceneService.getCategoriesForAdmin(),
  ]);

  if (articleResult.error) throw new Error(articleResult.error.message);
  if (categoriesResult.error) throw new Error(categoriesResult.error.message);
  if (!articleResult.data) notFound();

  const article = articleResult.data as SceneArticle;
  const categories = (categoriesResult.data ?? []) as SceneCategory[];
  const errorMessage = errorLabel(query.error, isArabic);
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer className="max-w-6xl">
        <AdminPageHeader
          eyebrow="MLAMH SCENE"
          title={isArabic ? "تحرير المقال" : "Edit article"}
          description={isArabic ? article.title_ar : article.title_en || article.title_ar}
          actions={
            <Link
              href={`/admin/scene?lang=${locale}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] px-4 text-xs font-medium text-white/55 transition hover:border-gold/20 hover:text-gold"
            >
              <BackIcon className="h-4 w-4" />
              {isArabic ? "العودة إلى مشهد ملامح" : "Back to MLAMH Scene"}
            </Link>
          }
        />

      {query.saved === "1" ? (
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {isArabic ? "تم حفظ المقال بنجاح." : "Article saved successfully."}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">{errorMessage}</div>
      ) : null}

      <SceneArticleForm locale={locale} categories={categories} article={article} action={updateSceneArticleAction} />
      </AdminPageContainer>
    </div>
  );
}
