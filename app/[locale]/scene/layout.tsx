import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CircleCheckBig,
  Clock3,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { SceneWorldNav } from "@/components/scene/SceneWorldNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";

type SceneAudience = "talent" | "publisher" | null;
type TalentApprovalStatus =
  | "not_submitted"
  | "submitted"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

type TalentSceneState = {
  approvalStatus: TalentApprovalStatus;
  isReady: boolean;
  missingLabelsAr: string[];
  missingLabelsEn: string[];
};

type SceneContext = {
  audience: SceneAudience;
  talentState: TalentSceneState | null;
};

function normalizeApprovalStatus(value: unknown): TalentApprovalStatus {
  return value === "submitted" ||
    value === "pending" ||
    value === "approved" ||
    value === "changes_requested" ||
    value === "rejected"
    ? value
    : "not_submitted";
}

async function getSceneContext(): Promise<SceneContext> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { audience: null, talentState: null };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_type, approval_status, phone, data_accuracy_contact_consent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[SceneLayout.profile]", profileError);
      return { audience: null, talentState: null };
    }

    const audience: SceneAudience =
      profile?.account_type === "talent" || profile?.account_type === "publisher"
        ? profile.account_type
        : null;

    if (audience !== "talent") return { audience, talentState: null };

    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select(
        "name_ar, name_en, image_url, primary_role, category_slug, category_en, category_ar, base_country_code, city_slug, gender, nationality, nationality_slug, date_of_birth, profile_visibility",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentError) {
      console.error("[SceneLayout.talent]", talentError);
      return {
        audience,
        talentState: {
          approvalStatus: normalizeApprovalStatus(profile?.approval_status),
          isReady: false,
          missingLabelsAr: [],
          missingLabelsEn: [],
        },
      };
    }

    const readiness = getTalentProfileReviewReadiness({
      ...(talent ?? {}),
      phone: profile?.phone,
      data_accuracy_contact_consent: profile?.data_accuracy_contact_consent,
    });

    return {
      audience,
      talentState: {
        approvalStatus: normalizeApprovalStatus(profile?.approval_status),
        isReady: readiness.isReady,
        missingLabelsAr: readiness.missingRequirements.map((item) => item.ar),
        missingLabelsEn: readiness.missingRequirements.map((item) => item.en),
      },
    };
  } catch (error) {
    console.error("[SceneLayout.context]", error);
    return { audience: null, talentState: null };
  }
}

function buildTalentConfig({
  locale,
  talentState,
}: {
  locale: "ar" | "en";
  talentState: TalentSceneState | null;
}) {
  const isArabic = locale === "ar";
  const status = talentState?.approvalStatus ?? "not_submitted";
  const profileHref = `/${locale}/talent-dashboard/profile`;
  const talentCategoryHref = `/${locale}/scene/category/talent`;
  const completionGuideHref = `/${locale}/scene/complete-talent-profile-and-submit-review`;

  if (status === "approved") {
    return {
      icon: CircleCheckBig,
      eyebrow: isArabic ? "مشهدك • معتمد" : "YOUR SCENE • APPROVED",
      title: isArabic ? "ملفك معتمد — ركّز الآن على فرصك" : "Your profile is approved — focus on opportunities",
      description: isArabic
        ? "طوّر حضورك واستعدادك للكاستينغ بمحتوى يناسب المرحلة التالية."
        : "Strengthen your presence and casting readiness with content for your next stage.",
      primaryLabel: isArabic ? "محتوى للمواهب المعتمدة" : "Content for approved talent",
      primaryHref: talentCategoryHref,
      secondaryLabel: isArabic ? "الاستعداد لتجربة الأداء" : "Audition preparation",
      secondaryHref: `/${locale}/scene/first-audition-preparation`,
    };
  }

  if (status === "submitted" || status === "pending") {
    return {
      icon: Clock3,
      eyebrow: isArabic ? "مشهدك • قيد المراجعة" : "YOUR SCENE • UNDER REVIEW",
      title: isArabic ? "ملفك قيد المراجعة" : "Your profile is under review",
      description: isArabic
        ? "لا تحتاج لإعادة الإرسال. استغل وقت المراجعة في تحسين معرض أعمالك والاستعداد للفرص."
        : "No need to resubmit. Use review time to strengthen your portfolio and prepare for opportunities.",
      primaryLabel: isArabic ? "طوّر معرض أعمالك" : "Improve your portfolio",
      primaryHref: `/${locale}/scene/talent-portfolio-gallery-guide`,
      secondaryLabel: isArabic ? "استكشف محتوى المواهب" : "Explore talent content",
      secondaryHref: talentCategoryHref,
    };
  }

  if (status === "changes_requested" || status === "rejected") {
    return {
      icon: TriangleAlert,
      eyebrow: isArabic ? "مشهدك • يحتاج تحديثًا" : "YOUR SCENE • UPDATE NEEDED",
      title: isArabic ? "راجع ملفك قبل الخطوة التالية" : "Review your profile before the next step",
      description: isArabic
        ? "ابدأ من ملفك لمعالجة الملاحظات، ثم استخدم دليل ملامح للتأكد من اكتمال الأساسيات."
        : "Start from your profile to address feedback, then use the MLAMH guide to confirm the essentials.",
      primaryLabel: isArabic ? "فتح الملف" : "Open profile",
      primaryHref: profileHref,
      secondaryLabel: isArabic ? "دليل إكمال الملف" : "Profile completion guide",
      secondaryHref: completionGuideHref,
    };
  }

  if (talentState?.isReady) {
    return {
      icon: CircleCheckBig,
      eyebrow: isArabic ? "مشهدك • جاهز للإرسال" : "YOUR SCENE • READY TO SUBMIT",
      title: isArabic ? "أساسيات ملفك مكتملة" : "Your profile essentials are complete",
      description: isArabic
        ? "ملفك يحقق متطلبات الإرسال الأساسية. انتقل إلى ملفك لإرساله للمراجعة عندما تكون جاهزًا."
        : "Your profile meets the core submission requirements. Open your profile and submit it for review when ready.",
      primaryLabel: isArabic ? "الانتقال إلى الملف" : "Go to profile",
      primaryHref: profileHref,
      secondaryLabel: isArabic ? "راجع دليل الإرسال" : "Review submission guide",
      secondaryHref: completionGuideHref,
    };
  }

  const missing = isArabic ? talentState?.missingLabelsAr ?? [] : talentState?.missingLabelsEn ?? [];
  const visibleMissing = missing.slice(0, 3).join(isArabic ? "، " : ", ");
  const remaining = Math.max(missing.length - 3, 0);
  const missingText = visibleMissing
    ? isArabic
      ? `ابدأ بإكمال: ${visibleMissing}${remaining ? `، و${remaining} أخرى` : ""}.`
      : `Start with: ${visibleMissing}${remaining ? `, plus ${remaining} more` : ""}.`
    : isArabic
      ? "أكمل البيانات الأساسية في ملفك قبل إرساله للمراجعة."
      : "Complete the core profile details before submitting for review.";

  return {
    icon: UserRound,
    eyebrow: isArabic ? "مشهدك • أكمل ملفك" : "YOUR SCENE • COMPLETE YOUR PROFILE",
    title: isArabic ? "خطوتك التالية: جهّز ملفك للمراجعة" : "Next step: get your profile review-ready",
    description: missingText,
    primaryLabel: isArabic ? "أكمل ملفك" : "Complete profile",
    primaryHref: profileHref,
    secondaryLabel: isArabic ? "دليل إكمال الملف" : "Profile completion guide",
    secondaryHref: completionGuideHref,
  };
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
  const { audience, talentState } = await getSceneContext();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const audienceConfig =
    audience === "talent"
      ? buildTalentConfig({ locale, talentState })
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
