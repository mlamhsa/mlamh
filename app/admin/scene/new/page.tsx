import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SceneArticleForm } from "@/components/admin/scene/SceneArticleForm";
import { createSceneArticleAction } from "@/lib/actions/admin-scene-actions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SceneService } from "@/lib/services/SceneService";
import type { SceneCategory } from "@/lib/types/scene";

export const metadata = {
  title: "New Scene Article — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function NewSceneArticlePage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const query = await searchParams;
  const locale: "ar" | "en" = query.lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const result = await SceneService.getCategoriesForAdmin();

  if (result.error) throw new Error(result.error.message);
  const categories = ((result.data ?? []) as SceneCategory[]).filter((category) => category.is_active);
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto max-w-6xl px-4 py-7 text-white sm:px-6 lg:px-8 lg:py-10">
      <Link href={`/admin/scene?lang=${locale}`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
        <BackIcon className="h-4 w-4" />
        {isArabic ? "العودة إلى مشهد ملامح" : "Back to MLAMH Scene"}
      </Link>
      <div className="mb-7 mt-5">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gold">MLAMH SCENE</p>
        <h1 className="mt-3 text-3xl font-light md:text-5xl">{isArabic ? "مقال جديد" : "New article"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
          {isArabic ? "أنشئ المحتوى كمسودة أولًا، ثم راجعه وحدد وقت النشر عندما يصبح جاهزًا." : "Create content as a draft first, review it, then publish when ready."}
        </p>
      </div>
      <SceneArticleForm locale={locale} categories={categories} action={createSceneArticleAction} />
    </main>
  );
}
