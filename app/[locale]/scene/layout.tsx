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
  UsersRound,
} from "lucide-react";

import { SceneWorldNav } from "@/components/scene/SceneWorldNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTalentProfileReviewReadiness } from "@/lib/talent/profile-review-readiness";

type SceneAudience = "talent" | "publisher" | null;
type ApprovalStatus =
  | "not_submitted"
  | "submitted"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

type TalentSceneState = {
  approvalStatus: ApprovalStatus;
  isReady: boolean;
  missingLabelsAr: string[];
  missingLabelsEn: string[];
};

type PublisherSceneState = {
  approvalStatus: ApprovalStatus;
  isProfileComplete: boolean;
  isSuspended: boolean;
  opportunityCount: number;
  applicantsCount: number;
};

type SceneContext = {
  audience: SceneAudience;
  talentState: TalentSceneState | null;
  publisherState: PublisherSceneState | null;
};

function normalizeApprovalStatus(value: unknown): ApprovalStatus {
  return value === "submitted" ||
    value === "pending" ||
    value === "approved" ||
    value === "changes_requested" ||
    value === "rejected"
    ? value
    : "not_submitted";
}

function isSceneAuthTimingError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return (
    candidate.code === "PGRST303" &&
    typeof candidate.message === "string" &&
    candidate.message.toLowerCase().includes("jwt issued at future")
  );
}

function logSceneReadError(scope: string, error: unknown) {
  // A browser can briefly carry a token that PostgREST considers too new because
  // of clock skew. Scene personalization is optional, so fall back to the public
  // experience without polluting production error logs for this recoverable case.
  if (isSceneAuthTimingError(error)) return;
  console.error(scope, error);
}

async function getSceneContext(): Promise<SceneContext> {
  const emptyContext: SceneContext = {
    audience: null,
    talentState: null,
    publisherState: null,
  };

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      logSceneReadError("[SceneLayout.auth]", userError);
      return emptyContext;
    }

    if (!user) return emptyContext;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, account_type, approval_status, phone, data_accuracy_contact_consent")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      logSceneReadError("[SceneLayout.profile]", profileError);
      return emptyContext;
    }

    const audience: SceneAudience =
      profile?.account_type === "talent" || profile?.account_type === "publisher"
        ? profile.account_type
        : null;

    if (audience === "publisher") {
      const fallbackState: PublisherSceneState = {
        approvalStatus: normalizeApprovalStatus(profile?.approval_status),
        isProfileComplete: false,
        isSuspended: false,
        opportunityCount: 0,
        applicantsCount: 0,
      };

      if (!profile?.id) {
        return { audience, talentState: null, publisherState: fallbackState };
      }

      const { data: publisher, error: publisherError } = await supabase
        .from("publishers")
        .select("id, publisher_type, company_name, contact_name, city, profile_image_url, status")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (publisherError || !publisher) {
        if (publisherError) logSceneReadError("[SceneLayout.publisher]", publisherError);
        return { audience, talentState: null, publisherState: fallbackState };
      }

      const isOrganization = publisher.publisher_type !== "individual";
      const isProfileComplete = isOrganization
        ? Boolean(publisher.company_name?.trim()) &&
          Boolean(publisher.contact_name?.trim()) &&
          Boolean(publisher.publisher_type?.trim()) &&
          Boolean(publisher.city?.trim()) &&
          Boolean(publisher.profile_image_url?.trim())
        : Boolean(publisher.contact_name?.trim()) &&
          Boolean(publisher.publisher_type?.trim()) &&
          Boolean(publisher.city?.trim());

      const { data: opportunities, error: opportunitiesError } = await supabase
        .from("opportunities")
        .select("id, status")
        .eq("publisher_id", publisher.id);

      if (opportunitiesError) {
        logSceneReadError("[SceneLayout.publisherOpportunities]", opportunitiesError);
      }

      const opportunityRows = opportunities ?? [];
      const opportunityIds = opportunityRows.map((item) => item.id);
      let applicantsCount = 0;

      if (opportunityIds.length > 0) {
        const { data: applications, error: applicationsError } = await supabase
          .from("opportunity_applications")
          .select("id, status")
          .in("opportunity_id", opportunityIds);

        if (applicationsError) {
          logSceneReadError("[SceneLayout.publisherApplications]", applicationsError);
        } else {
          applicantsCount = (applications ?? []).filter(
            (application) =>
              application.status !== "accepted" && application.status !== "rejected",
          ).length;
        }
      }

      return {
        audience,
        talentState: null,
        publisherState: {
          approvalStatus: normalizeApprovalStatus(profile?.approval_status),
          isProfileComplete,
          isSuspended: publisher.status === "suspended",
          opportunityCount: opportunityRows.length,
          applicantsCount,
        },
      };
    }

    if (audience !== "talent") return { ...emptyContext, audience };

    const { data: talent, error: talentError } = await supabase
      .from("talents")
      .select(
        "name_ar, name_en, image_url, primary_role, category_slug, category_en, category_ar, base_country_code, city_slug, gender, nationality, nationality_slug, date_of_birth, profile_visibility",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (talentError) {
      logSceneReadError("[SceneLayout.talent]", talentError);
      return {
        audience,
        publisherState: null,
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
      publisherState: null,
      talentState: {
        approvalStatus: normalizeApprovalStatus(profile?.approval_status),
        isReady: readiness.isReady,
        missingLabelsAr: readiness.missingRequirements.map((item) => item.ar),
        missingLabelsEn: readiness.missingRequirements.map((item) => item.en),
      },
    };
  } catch (error) {
    logSceneReadError("[SceneLayout.context]", error);
    return emptyContext;
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

function buildPublisherConfig({
  locale,
  publisherState,
}: {
  locale: "ar" | "en";
  publisherState: PublisherSceneState | null;
}) {
  const isArabic = locale === "ar";
  const state = publisherState ?? {
    approvalStatus: "not_submitted" as ApprovalStatus,
    isProfileComplete: false,
    isSuspended: false,
    opportunityCount: 0,
    applicantsCount: 0,
  };
  const profileHref = `/${locale}/publisher-dashboard/profile`;
  const dashboardHref = `/${locale}/publisher-dashboard`;
  const categoryHref = `/${locale}/scene/category/publishers`;
  const gettingStartedHref = `/${locale}/scene/publisher-getting-started-mlamh`;

  if (state.isSuspended) {
    return {
      icon: TriangleAlert,
      eyebrow: isArabic ? "مشهدك • الحساب موقوف" : "YOUR SCENE • ACCOUNT SUSPENDED",
      title: isArabic ? "راجع حالة حساب الناشر" : "Review your publisher account status",
      description: isArabic
        ? "لن نغيّر أي شيء من مشهد. افتح لوحة الناشر لمراجعة حالة الحساب والتواصل مع الإدارة عند الحاجة."
        : "Scene will not change anything. Open your publisher dashboard to review the account status and contact support if needed.",
      primaryLabel: isArabic ? "فتح لوحة الناشر" : "Open publisher dashboard",
      primaryHref: dashboardHref,
      secondaryLabel: isArabic ? "محتوى الناشرين" : "Publisher content",
      secondaryHref: categoryHref,
    };
  }

  if (state.approvalStatus === "submitted" || state.approvalStatus === "pending") {
    return {
      icon: Clock3,
      eyebrow: isArabic ? "مشهدك • قيد المراجعة" : "YOUR SCENE • UNDER REVIEW",
      title: isArabic ? "حسابك قيد المراجعة" : "Your publisher account is under review",
      description: isArabic
        ? "لا تحتاج لإعادة الإرسال. يمكنك تجهيز أول Brief وفهم آلية اختيار المواهب أثناء انتظار المراجعة."
        : "No need to resubmit. Use the review time to prepare your first brief and learn the talent-selection flow.",
      primaryLabel: isArabic ? "كيف تكتب Brief واضحًا" : "How to write a clear brief",
      primaryHref: `/${locale}/scene/how-to-write-casting-brief-mlamh`,
      secondaryLabel: isArabic ? "دليل البداية كناشر" : "Publisher getting-started guide",
      secondaryHref: gettingStartedHref,
    };
  }

  if (state.approvalStatus === "changes_requested" || state.approvalStatus === "rejected") {
    return {
      icon: TriangleAlert,
      eyebrow: isArabic ? "مشهدك • يحتاج تحديثًا" : "YOUR SCENE • UPDATE NEEDED",
      title: isArabic ? "راجع ملف الناشر قبل الخطوة التالية" : "Review your publisher profile before the next step",
      description: isArabic
        ? "ابدأ من ملف الناشر لمعالجة الملاحظات المطلوبة، ثم أعد الإرسال من المسار المعتمد."
        : "Start from your publisher profile, address the requested changes, then resubmit through the approved flow.",
      primaryLabel: isArabic ? "فتح ملف الناشر" : "Open publisher profile",
      primaryHref: profileHref,
      secondaryLabel: isArabic ? "دليل البداية" : "Getting-started guide",
      secondaryHref: gettingStartedHref,
    };
  }

  if (state.approvalStatus !== "approved") {
    if (state.isProfileComplete) {
      return {
        icon: CircleCheckBig,
        eyebrow: isArabic ? "مشهدك • جاهز للإرسال" : "YOUR SCENE • READY TO SUBMIT",
        title: isArabic ? "بيانات الناشر الأساسية مكتملة" : "Your publisher essentials are complete",
        description: isArabic
          ? "راجع ملف الناشر وأرسله للمراجعة من المسار الحالي، بدون أي تغيير على رحلة الاعتماد."
          : "Review your publisher profile and submit it through the current approval flow without changing that workflow.",
        primaryLabel: isArabic ? "مراجعة ملف الناشر" : "Review publisher profile",
        primaryHref: profileHref,
        secondaryLabel: isArabic ? "دليل البداية كناشر" : "Publisher getting-started guide",
        secondaryHref: gettingStartedHref,
      };
    }

    return {
      icon: Building2,
      eyebrow: isArabic ? "مشهدك • أكمل حسابك" : "YOUR SCENE • COMPLETE YOUR ACCOUNT",
      title: isArabic ? "خطوتك التالية: أكمل ملف الناشر" : "Next step: complete your publisher profile",
      description: isArabic
        ? "أكمل البيانات الأساسية أولًا، ثم استخدم دليل البداية لفهم ما يحدث حتى أول طلب مواهب."
        : "Complete the essential details first, then use the getting-started guide to understand the path to your first talent request.",
      primaryLabel: isArabic ? "إكمال ملف الناشر" : "Complete publisher profile",
      primaryHref: profileHref,
      secondaryLabel: isArabic ? "دليل البداية" : "Getting-started guide",
      secondaryHref: gettingStartedHref,
    };
  }

  if (state.applicantsCount > 0) {
    return {
      icon: UsersRound,
      eyebrow: isArabic ? "مشهدك • لديك متقدمون" : "YOUR SCENE • APPLICANTS WAITING",
      title: isArabic
        ? state.applicantsCount === 1
          ? "لديك متقدم يحتاج مراجعتك"
          : `لديك ${state.applicantsCount} متقدمين يحتاجون مراجعتك`
        : state.applicantsCount === 1
          ? "You have 1 applicant to review"
          : `You have ${state.applicantsCount} applicants to review`,
      description: isArabic
        ? "ابدأ بالمتقدمين الحاليين، واستفد من دليل المراجعة لبناء قرار أسرع وأكثر اتساقًا."
        : "Start with your current applicants and use the review guide for faster, more consistent decisions.",
      primaryLabel: isArabic ? "فتح المتقدمين" : "Open applicants",
      primaryHref: `/${locale}/publisher-dashboard/applicants`,
      secondaryLabel: isArabic ? "دليل مراجعة المتقدمين" : "Applicant review guide",
      secondaryHref: `/${locale}/scene/how-to-review-talent-applications`,
    };
  }

  if (state.opportunityCount === 0) {
    return {
      icon: CircleCheckBig,
      eyebrow: isArabic ? "مشهدك • الحساب معتمد" : "YOUR SCENE • APPROVED",
      title: isArabic ? "حسابك جاهز — أنشئ أول فرصة" : "Your account is ready — create your first opportunity",
      description: isArabic
        ? "ابدأ بفرصة واضحة، وحدد المطلوب بدقة حتى تصل إلى المواهب الأقرب لمشروعك."
        : "Start with a clear opportunity and precise requirements so the right talent can find your project.",
      primaryLabel: isArabic ? "إنشاء أول فرصة" : "Create first opportunity",
      primaryHref: `/${locale}/publisher-dashboard/opportunities/new`,
      secondaryLabel: isArabic ? "كيف تكتب Brief واضحًا" : "How to write a clear brief",
      secondaryHref: `/${locale}/scene/how-to-write-casting-brief-mlamh`,
    };
  }

  return {
    icon: Building2,
    eyebrow: isArabic ? "مشهدك • فرصك نشطة" : "YOUR SCENE • YOUR OPPORTUNITIES",
    title: isArabic ? "لديك فرص بالفعل — حسّن جودة الطلب والاختيار" : "You already have opportunities — improve brief and selection quality",
    description: isArabic
      ? "استخدم مشهد لتحسين المتطلبات وبناء Shortlist أوضح قبل القرار النهائي."
      : "Use Scene to sharpen requirements and build a clearer shortlist before final selection.",
    primaryLabel: isArabic ? "إدارة الفرص" : "Manage opportunities",
    primaryHref: `/${locale}/publisher-dashboard/opportunities`,
    secondaryLabel: isArabic ? "دليل بناء Shortlist" : "Shortlist guide",
    secondaryHref: `/${locale}/scene/publisher-shortlist-guide`,
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
  const { audience, talentState, publisherState } = await getSceneContext();
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const audienceConfig =
    audience === "talent"
      ? buildTalentConfig({ locale, talentState })
      : audience === "publisher"
        ? buildPublisherConfig({ locale, publisherState })
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
