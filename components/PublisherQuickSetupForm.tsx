"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
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

const initialState: CreatePublisherDraftState = {
  success: false,
  message: null,
};

const organizationTypes = [
  {
    value: "production_company",
    ar: "شركة إنتاج",
    en: "Production Company",
    descriptionAr: "للإنتاج التلفزيوني والسينمائي والإعلاني وصناعة المحتوى.",
    descriptionEn: "For TV, film, commercial, and content production.",
    icon: Clapperboard,
  },
  {
    value: "advertising_agency",
    ar: "وكالة إعلانية",
    en: "Advertising Agency",
    descriptionAr: "للوكالات التي تدير الحملات والإعلانات وتبحث عن مواهب.",
    descriptionEn: "For agencies running campaigns and sourcing talent.",
    icon: Megaphone,
  },
  {
    value: "casting_agency",
    ar: "كاستينغ",
    en: "Casting",
    descriptionAr: "لمسؤولي وفرق الكاستينغ الباحثين عن ممثلين ومودلز.",
    descriptionEn: "For casting teams sourcing actors and models.",
    icon: UsersRound,
  },
  {
    value: "talent_agency",
    ar: "وكالة مواهب",
    en: "Talent Agency",
    descriptionAr: "للوكالات التي تمثل أو تدير المواهب وتعمل مع جهات الإنتاج.",
    descriptionEn: "For agencies representing and managing talent.",
    icon: BriefcaseBusiness,
  },
  {
    value: "brand",
    ar: "علامة تجارية",
    en: "Brand",
    descriptionAr: "للعلامات التجارية التي تبحث عن وجوه ومواهب لحملاتها.",
    descriptionEn: "For brands sourcing talent for campaigns and content.",
    icon: BadgeCheck,
  },
  {
    value: "content_company",
    ar: "شركة محتوى",
    en: "Content Company",
    descriptionAr: "لشركات وصناع المحتوى الذين يحتاجون مواهب لمشاريعهم.",
    descriptionEn: "For content companies sourcing talent for productions.",
    icon: Building2,
  },
  {
    value: "other",
    ar: "أخرى",
    en: "Other",
    descriptionAr: "إذا لم يكن نوع الجهة ضمن الخيارات السابقة.",
    descriptionEn: "If your organization type is not listed above.",
    icon: Sparkles,
  },
];

export function PublisherQuickSetupForm({ locale }: { locale: Locale }) {
  const isRtl = locale === "ar";
  const [mode, setMode] = useState<"individual" | "organization" | null>(null);
  const [state, formAction, isPending] = useActionState(
    createPublisherDraftAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.success]);

  if (state.success) {
    return (
      <section className="rounded-[2rem] border border-gold/25 bg-gold/[0.04] px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <BriefcaseBusiness size={24} />
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "مساحة العمل جاهزة" : "WORKSPACE READY"}
        </p>
        <h2 className="mt-4 text-3xl font-light text-white sm:text-4xl">
          {isRtl ? "يمكنك الآن البدء" : "You’re ready to start"}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55">
          {isRtl
            ? "تم حفظ صفة الحساب وتجهيز مساحة العمل. يمكنك إكمال الملف أو البدء بإدارة احتياجك للمواهب."
            : "Your account type is saved and your workspace is ready. Complete the profile or start managing your talent needs."}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/${locale}/workspace/profile`}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-black transition hover:bg-gold-soft"
          >
            {isRtl ? "إكمال الملف" : "Complete profile"}
          </Link>
          <Link
            href={`/${locale}/workspace`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold"
          >
            {isRtl ? "الدخول إلى مساحة العمل" : "Open workspace"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form
      action={(formData) => {
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="publisher_mode" value={mode ?? ""} />

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "طريقة استخدام مساحة العمل" : "WORKSPACE TYPE"}
        </p>
        <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
          {isRtl ? "هل تبحث عن المواهب لنفسك أم لجهة؟" : "Are you sourcing talent for yourself or an organization?"}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/45">
          {isRtl
            ? "هذا الاختيار يضبط مساحة العمل فقط، ولا يغيّر طريقة إنشاء الفرص أو إدارة المتقدمين."
            : "This only configures your workspace; opportunity creation and applicant management stay the same."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeButton
          selected={mode === "individual"}
          onClick={() => setMode("individual")}
          icon={<UserRound size={22} />}
          title={isRtl ? "فرد / مستقل" : "Individual / Freelancer"}
          description={
            isRtl
              ? "أبحث عن مواهب لمشروعي أو عملي بصفتي الشخصية."
              : "I source talent for my own projects or professional work."
          }
        />
        <ModeButton
          selected={mode === "organization"}
          onClick={() => setMode("organization")}
          icon={<Building2 size={22} />}
          title={isRtl ? "شركة / جهة" : "Company / Organization"}
          description={
            isRtl
              ? "أبحث عن مواهب نيابة عن شركة أو وكالة أو علامة تجارية أو جهة."
              : "I source talent on behalf of a company, agency, brand, or organization."
          }
        />
      </div>

      {mode === "organization" ? (
        <>
          <div className="pt-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isRtl ? "نوع الجهة" : "ORGANIZATION TYPE"}
            </p>
            <h3 className="mt-3 text-xl font-light text-white">
              {isRtl ? "اختر نوع الجهة التي تمثلها" : "Choose your organization type"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {organizationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <label key={type.value} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="publisher_type"
                    value={type.value}
                    required
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
                      {isRtl ? type.descriptionAr : type.descriptionEn}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </>
      ) : null}

      {state.message ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300"
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !mode}
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isPending
          ? isRtl
            ? "جارٍ تجهيز مساحة العمل..."
            : "Preparing workspace..."
          : isRtl
            ? "حفظ والدخول إلى مساحة العمل"
            : "Save and continue to workspace"}
      </button>
    </form>
  );
}

function ModeButton({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-40 rounded-[1.75rem] border p-6 text-start transition ${
        selected
          ? "border-gold bg-gold/[0.08]"
          : "border-white/10 bg-white/[0.025] hover:border-gold/35"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-light text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
    </button>
  );
}
