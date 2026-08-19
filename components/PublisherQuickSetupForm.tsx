"use client";
import Link from "next/link";
import {
  startTransition,
  useActionState,
} from "react";
import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  Clapperboard,
  Megaphone,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  createPublisherDraftAction,
  type CreatePublisherDraftState,
} from "@/lib/actions/create-publisher-draft";

import type { Locale } from "@/lib/i18n";

const initialCreatePublisherDraftState: CreatePublisherDraftState = {
  success: false,
  message: null,
};

const publisherTypes = [
  {
    value: "production_company",
    ar: "شركة إنتاج",
    en: "Production Company",
    descriptionAr:
      "للإنتاج التلفزيوني والسينمائي والإعلاني وصناعة المحتوى.",
    descriptionEn:
      "For TV, film, commercial, and content production.",
    icon: Clapperboard,
  },
  {
    value: "advertising_agency",
    ar: "وكالة إعلانية",
    en: "Advertising Agency",
    descriptionAr:
      "للوكالات التي تدير الحملات والإعلانات وتبحث عن مواهب.",
    descriptionEn:
      "For agencies running campaigns and sourcing talent.",
    icon: Megaphone,
  },
  {
    value: "casting_agency",
    ar: "كاستينغ",
    en: "Casting",
    descriptionAr:
      "لمسؤولي وفرق الكاستينغ الباحثين عن ممثلين ومودلز.",
    descriptionEn:
      "For casting teams sourcing actors and models.",
    icon: UsersRound,
  },
  {
    value: "talent_agency",
    ar: "وكالة مواهب",
    en: "Talent Agency",
    descriptionAr:
      "للوكالات التي تمثل أو تدير المواهب وتعمل مع جهات الإنتاج.",
    descriptionEn:
      "For agencies representing and managing talent.",
    icon: BriefcaseBusiness,
  },
  {
    value: "brand",
    ar: "علامة تجارية",
    en: "Brand",
    descriptionAr:
      "للعلامات التجارية التي تبحث عن وجوه ومواهب لحملاتها.",
    descriptionEn:
      "For brands sourcing talent for campaigns and content.",
    icon: BadgeCheck,
  },
  {
    value: "content_company",
    ar: "شركة محتوى",
    en: "Content Company",
    descriptionAr:
      "لشركات وصناع المحتوى الذين يحتاجون مواهب لمشاريعهم.",
    descriptionEn:
      "For content companies sourcing talent for productions.",
    icon: Building2,
  },
  {
    value: "individual",
    ar: "فرد / مستقل",
    en: "Individual / Freelancer",
    descriptionAr:
      "للمحترفين المستقلين الذين ينشرون فرصًا بشكل مباشر.",
    descriptionEn:
      "For independent professionals posting opportunities directly.",
    icon: UserRound,
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
    descriptionAr:
      "إذا لم يكن نوع حسابك ضمن الخيارات السابقة.",
    descriptionEn:
      "If your publisher type is not listed above.",
    icon: Sparkles,
  },
];

export function PublisherQuickSetupForm({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  const [state, formAction, isPending] =
    useActionState(
      createPublisherDraftAction,
      initialCreatePublisherDraftState
    );

  if (state.success) {
    return (
      <section className="rounded-[2rem] border border-gold/25 bg-gold/[0.04] px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <BriefcaseBusiness size={24} />
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gold">
  {isRtl ? "أهلًا بك في ملامح" : "Welcome to MLAMH"}
</p>

<h2 className="mt-4 text-3xl font-light text-white sm:text-4xl">
  {isRtl ? "حسابك أصبح جاهزًا" : "Your account is ready"}
</h2>

<p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55">
  {isRtl
    ? "تم إنشاء حساب الناشر بنجاح. أكمل ملف شركتك لتجهز حسابك لنشر الفرص واستقبال طلبات المواهب."
    : "Your publisher account has been created successfully. Complete your company profile to prepare your account for publishing opportunities and receiving talent applications."}
</p>

<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
  <Link
    href={`/${locale}/publisher-dashboard/profile`}
    className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-black transition hover:bg-gold-soft"
  >
    {isRtl
      ? "إكمال ملف الشركة"
      : "Complete Company Profile"}
  </Link>

  <Link
    href={`/${locale}/publisher-dashboard`}
    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold"
  >
    {isRtl
      ? "الذهاب إلى لوحة الناشر"
      : "Go to Publisher Dashboard"}
  </Link>
</div>
      </section>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          formAction(formData);
        });
      }}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="locale"
        value={locale}
      />

<div>
  <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
    {isRtl
      ? "نوع الجهة"
      : "Organization Type"}
  </p>

  <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
    {isRtl
      ? "ما نوع الجهة التي تمثلها؟"
      : "What type of organization do you represent?"}
  </h2>

  <p className="mt-3 text-sm leading-7 text-white/45">
    {isRtl
      ? "اختر التصنيف الأقرب لجهتك. يمكنك إكمال بيانات الشركة لاحقًا من ملف الشركة."
      : "Choose the category that best describes your organization. You can complete the remaining company details from your company profile."}
  </p>
</div>

      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {publisherTypes.map((type) => {
          const Icon = type.icon;

          return (
            <label
              key={type.value}
              className="group cursor-pointer"
            >
              <input
                type="radio"
                name="publisher_type"
                value={type.value}
                className="peer sr-only"
              />

              <div className="min-h-44 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition group-hover:border-gold/35 peer-checked:border-gold peer-checked:bg-gold/[0.08]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
                  <Icon size={22} />
                </div>

                <h3 className="mt-5 text-xl font-light text-white">
                  {isRtl ? type.ar : type.en}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/45">
                  {isRtl
                    ? type.descriptionAr
                    : type.descriptionEn}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isPending
          ? isRtl
            ? "جارٍ إنشاء الحساب..."
            : "Creating account..."
          : isRtl
            ? "إنشاء حساب الناشر"
            : "Create Publisher Account"}
      </button>
    </form>
  );
}