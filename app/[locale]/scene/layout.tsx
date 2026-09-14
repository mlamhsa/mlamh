import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Sparkles, UserRound } from "lucide-react";

import { SceneWorldNav } from "@/components/scene/SceneWorldNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SceneAudience = "talent" | "publisher" | null;

async function getSceneAudience(): Promise<SceneAudience> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[SceneLayout.profile]", error);
      return null;
    }

    return data?.account_type === "talent" || data?.account_type === "publisher"
      ? data.account_type
      : null;
  } catch (error) {
    console.error("[SceneLayout.audience]", error);
    return null;
  }
}

export default async function SceneLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const audience = await getSceneAudience();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const audienceConfig =
    audience === "talent"
      ? {
          icon: UserRound,
          eyebrow: isArabic ? "مشهدك" : "YOUR SCENE",
          title: isArabic ? "محتوى مختار للموهبة" : "Selected for talent",
          description: isArabic
            ? "ابدأ بما يساعدك على بناء ملف أقوى والاستعداد للكاستينغ."
            : "Start with guidance for a stronger profile and better casting readiness.",
          primaryLabel: isArabic ? "استكشف محتوى المواهب" : "Explore talent content",
          primaryHref: `/${locale}/scene/category/talent`,
          secondaryLabel: isArabic ? "دليل إكمال الملف" : "Profile completion guide",
          secondaryHref: `/${locale}/scene/complete-talent-profile-and-submit-review`,
        }
      : audience === "publisher"
        ? {
            icon: Building2,
            eyebrow: isArabic ? "مشهدك" : "YOUR SCENE",
            title: isArabic ? "محتوى مختار للناشر" : "Selected for publishers",
            description: isArabic
              ? "ابدأ بما يساعدك على كتابة طلب أوضح واختيار الموهبة الأنسب."
              : "Start with guidance for clearer briefs and better talent selection.",
            primaryLabel: isArabic ? "استكشف محتوى الناشرين" : "Explore publisher content",
            primaryHref: `/${locale}/scene/category/publishers`,
            secondaryLabel: isArabic ? "دليل البداية كناشر" : "Publisher getting-started guide",
            secondaryHref: `/${locale}/scene/publisher-getting-started-mlamh`,
          }
        : null;

  return (
    <>
      <SceneWorldNav locale={locale} />

      {audienceConfig ? (
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="border-b border-white/[0.07] bg-[linear-gradient(90deg,rgba(212,175,55,0.08),rgba(255,255,255,0.015),rgba(212,175,55,0.04))]"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gold/20 bg-gold/[0.07] text-gold">
                <audienceConfig.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-gold/75">
                  <Sparkles className="h-3 w-3" />
                  {audienceConfig.eyebrow}
                </div>
                <p className="mt-1 text-sm font-medium text-white">{audienceConfig.title}</p>
                <p className="mt-1 max-w-2xl text-xs leading-6 text-white/45">{audienceConfig.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Link
                href={audienceConfig.primaryHref}
                className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2.5 text-xs font-medium text-black transition hover:bg-gold-soft"
              >
                {audienceConfig.primaryLabel}
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={audienceConfig.secondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/65 transition hover:border-gold/25 hover:text-gold"
              >
                {audienceConfig.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {children}
    </>
  );
}
