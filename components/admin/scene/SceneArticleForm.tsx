import Link from "next/link";
import { Save } from "lucide-react";

import type { SceneArticle, SceneCategory } from "@/lib/types/scene";

type Props = {
  locale: "ar" | "en";
  categories: SceneCategory[];
  article?: SceneArticle | null;
  action: (formData: FormData) => void | Promise<void>;
};

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/45";
const textareaClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-gold/45";
const labelClass = "block text-xs font-medium text-white/60";

function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

export function SceneArticleForm({ locale, categories, article, action }: Props) {
  const isArabic = locale === "ar";
  const editing = Boolean(article);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {article ? <input type="hidden" name="article_id" value={article.id} /> : null}

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">CONTENT CORE</p>
          <h2 className="mt-2 text-xl font-medium">
            {isArabic ? "البيانات الأساسية" : "Core content"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {isArabic ? "الرابط المختصر (Slug)" : "Slug"}
            <input
              className={inputClass}
              name="slug"
              dir="ltr"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              defaultValue={article?.slug ?? ""}
              placeholder="how-to-build-talent-profile"
            />
          </label>

          <label className={labelClass}>
            {isArabic ? "التصنيف" : "Category"}
            <select className={inputClass} name="category_id" required defaultValue={article?.category_id ?? ""}>
              <option value="" disabled>{isArabic ? "اختر التصنيف" : "Choose category"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {isArabic ? category.name_ar : category.name_en}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            {isArabic ? "نوع المحتوى" : "Content type"}
            <select className={inputClass} name="content_type" defaultValue={article?.content_type ?? "guide"}>
              <option value="guide">{isArabic ? "دليل" : "Guide"}</option>
              <option value="help">{isArabic ? "شرح / مساعدة" : "Help"}</option>
              <option value="industry">{isArabic ? "الصناعة" : "Industry"}</option>
              <option value="story">{isArabic ? "قصة / مقابلة" : "Story"}</option>
              <option value="report">{isArabic ? "تقرير" : "Report"}</option>
              <option value="qa">{isArabic ? "سؤال وجواب" : "Q&A"}</option>
            </select>
          </label>

          <label className={labelClass}>
            {isArabic ? "الجمهور" : "Audience"}
            <select className={inputClass} name="audience" defaultValue={article?.audience ?? "all"}>
              <option value="all">{isArabic ? "الجميع" : "Everyone"}</option>
              <option value="talent">{isArabic ? "المواهب" : "Talent"}</option>
              <option value="publisher">{isArabic ? "الناشرون" : "Publishers"}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {isArabic ? "العنوان العربي" : "Arabic title"}
            <input className={inputClass} name="title_ar" required maxLength={180} defaultValue={article?.title_ar ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "العنوان الإنجليزي" : "English title"}
            <input className={inputClass} name="title_en" maxLength={180} defaultValue={article?.title_en ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "الملخص العربي" : "Arabic excerpt"}
            <textarea className={textareaClass} name="excerpt_ar" rows={4} defaultValue={article?.excerpt_ar ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "الملخص الإنجليزي" : "English excerpt"}
            <textarea className={textareaClass} name="excerpt_en" rows={4} defaultValue={article?.excerpt_en ?? ""} />
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">ARTICLE BODY</p>
        <h2 className="mt-2 text-xl font-medium">{isArabic ? "المحتوى" : "Article body"}</h2>
        <p className="mt-2 text-xs leading-6 text-white/35">
          {isArabic
            ? "في هذه المرحلة يُحفظ النص كمحتوى آمن بدون HTML مباشر. محرر بصري متقدم سيأتي لاحقًا دون تغيير بنية المقالات."
            : "For this phase, content is stored safely without raw HTML. A richer editor can be added later without changing the article model."}
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className={labelClass}>
            {isArabic ? "المحتوى العربي" : "Arabic content"}
            <textarea className={`${textareaClass} min-h-[420px]`} name="content_ar" required defaultValue={article?.content_ar ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "المحتوى الإنجليزي" : "English content"}
            <textarea className={`${textareaClass} min-h-[420px]`} name="content_en" defaultValue={article?.content_en ?? ""} />
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">PRESENTATION</p>
        <h2 className="mt-2 text-xl font-medium">{isArabic ? "الصورة والكاتب" : "Media & author"}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {isArabic ? "رابط صورة الغلاف" : "Cover image URL"}
            <input className={inputClass} name="cover_image_url" dir="ltr" defaultValue={article?.cover_image_url ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "وقت القراءة (دقيقة)" : "Read time (minutes)"}
            <input className={inputClass} name="read_time_minutes" type="number" min={1} max={180} defaultValue={article?.read_time_minutes ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "وصف الصورة بالعربية" : "Arabic image alt"}
            <input className={inputClass} name="cover_image_alt_ar" defaultValue={article?.cover_image_alt_ar ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "وصف الصورة بالإنجليزية" : "English image alt"}
            <input className={inputClass} name="cover_image_alt_en" defaultValue={article?.cover_image_alt_en ?? ""} />
          </label>
          <label className={labelClass}>
            {isArabic ? "اسم الكاتب بالعربية" : "Author name (Arabic)"}
            <input className={inputClass} name="author_name_ar" defaultValue={article?.author_name_ar ?? "ملامح"} />
          </label>
          <label className={labelClass}>
            {isArabic ? "اسم الكاتب بالإنجليزية" : "Author name (English)"}
            <input className={inputClass} name="author_name_en" defaultValue={article?.author_name_en ?? "MLAMH"} />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            {isArabic ? "الوسوم — افصل بينها بفاصلة" : "Tags — comma separated"}
            <input className={inputClass} name="tags" defaultValue={(article?.tags ?? []).join(", ")} />
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">SEO & ACTION</p>
        <h2 className="mt-2 text-xl font-medium">SEO + CTA</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className={labelClass}>{isArabic ? "عنوان SEO بالعربية" : "Arabic SEO title"}<input className={inputClass} name="seo_title_ar" defaultValue={article?.seo_title_ar ?? ""} /></label>
          <label className={labelClass}>{isArabic ? "عنوان SEO بالإنجليزية" : "English SEO title"}<input className={inputClass} name="seo_title_en" defaultValue={article?.seo_title_en ?? ""} /></label>
          <label className={labelClass}>{isArabic ? "وصف SEO بالعربية" : "Arabic SEO description"}<textarea className={textareaClass} rows={3} name="seo_description_ar" defaultValue={article?.seo_description_ar ?? ""} /></label>
          <label className={labelClass}>{isArabic ? "وصف SEO بالإنجليزية" : "English SEO description"}<textarea className={textareaClass} rows={3} name="seo_description_en" defaultValue={article?.seo_description_en ?? ""} /></label>
          <label className={labelClass}>{isArabic ? "نص زر الإجراء بالعربية" : "Arabic CTA label"}<input className={inputClass} name="cta_label_ar" defaultValue={article?.cta_label_ar ?? ""} /></label>
          <label className={labelClass}>{isArabic ? "نص زر الإجراء بالإنجليزية" : "English CTA label"}<input className={inputClass} name="cta_label_en" defaultValue={article?.cta_label_en ?? ""} /></label>
          <label className={`${labelClass} md:col-span-2`}>{isArabic ? "رابط زر الإجراء" : "CTA link"}<input className={inputClass} name="cta_href" dir="ltr" defaultValue={article?.cta_href ?? ""} placeholder="/talent-dashboard/profile" /></label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-gold/15 bg-gold/[0.035] p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelClass}>
            {isArabic ? "حالة المقال" : "Article status"}
            <select className={inputClass} name="status" defaultValue={article?.status ?? "draft"}>
              <option value="draft">{isArabic ? "مسودة" : "Draft"}</option>
              <option value="published">{isArabic ? "منشور" : "Published"}</option>
              <option value="archived">{isArabic ? "مؤرشف" : "Archived"}</option>
            </select>
          </label>
          <label className={labelClass}>
            {isArabic ? "موعد النشر" : "Publish date"}
            <input className={inputClass} type="datetime-local" name="published_at" defaultValue={localDateTime(article?.published_at)} />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
          <input type="checkbox" name="is_featured" defaultChecked={article?.is_featured ?? false} className="h-4 w-4 accent-[#d4af37]" />
          {isArabic ? "إبراز المقال ضمن مختارات مشهد" : "Feature this article in Scene selections"}
        </label>
      </section>

      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-xl">
        <Link href={`/admin/scene?lang=${locale}`} className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/55 hover:text-white">
          {isArabic ? "إلغاء" : "Cancel"}
        </Link>
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-xs font-semibold text-black transition hover:bg-gold-soft">
          <Save className="h-4 w-4" />
          {editing ? (isArabic ? "حفظ التعديلات" : "Save changes") : (isArabic ? "إنشاء المقال" : "Create article")}
        </button>
      </div>
    </form>
  );
}
