import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SceneArticleForm } from "@/components/admin/scene/SceneArticleForm";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
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
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer className="max-w-6xl">
        <AdminPageHeader
          eyebrow="MLAMH SCENE"
          title={isArabic ? "مقال جديد" : "New article"}
          description={
            isArabic
              ? "أنشئ المحتوى كمسودة أولًا، ثم راجعه وحدد وقت النشر عندما يصبح جاهزًا."
              : "Create content as a draft first, review it, then publish when ready."
          }
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
        <SceneArticleForm locale={locale} categories={categories} action={createSceneArticleAction} />
      </AdminPageContainer>
    </div>
  );
}
