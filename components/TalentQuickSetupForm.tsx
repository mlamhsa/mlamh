"use client";

import {
  startTransition,
  useActionState,
  useEffect,
} from "react";
import {
  Drama,
  Sparkles,
} from "lucide-react";

import {
  createTalentDraftAction,
  type CreateTalentDraftState,
} from "@/lib/actions/create-talent-draft";

import type { Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";

const initialCreateTalentDraftState: CreateTalentDraftState = {
  success: false,
  message: null,
};

export function TalentQuickSetupForm({
  locale,
}: {
  locale: Locale;
}) {
  const isRtl = locale === "ar";
  const router = useRouter();

  const [state, formAction, isPending] =
    useActionState(
      createTalentDraftAction,
      initialCreateTalentDraftState
    );

    useEffect(() => {
      if (!state.success) return;
    
      window.scrollTo({
        top: 0,
        behavior: "auto",
      });
    
      window.dispatchEvent(
        new Event("mlamh:account-updated"),
      );
    }, [state.success]);

  if (state.success) {
    return (
      <section className="talent-setup-success rounded-[2rem] border border-gold/25 bg-gold/[0.04] px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <Sparkles size={24} />
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-gold">
  {isRtl
    ? "أهلًا بك في ملامح"
    : "Welcome to MLAMH"}
</p>

<h2 className="mt-4 text-3xl font-light text-white sm:text-4xl">
  {isRtl
    ? "مكانك صار بيننا"
    : "You belong here"}
</h2>

<p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/55">
  {isRtl
    ? "تم إنشاء ملفك بنجاح. أكمل بياناتك وصورك وأعمالك لتظهر بشكل أفضل أمام الجهات والفرص المناسبة."
    : "Your profile has been created successfully. Complete your details, photos, and work to stand out to publishers and relevant opportunities."}
</p>

<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
  <button
    type="button"
    onClick={() => {
      router.push(
        `/${locale}/talent-dashboard/profile`,
      );
      router.refresh();
    }}
    className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-7 text-sm font-medium text-black transition hover:bg-gold-soft"
  >
    {isRtl
      ? "إكمال ملفي"
      : "Complete My Profile"}
  </button>

  <button
    type="button"
    onClick={() => {
      router.push(
        `/${locale}/talent-dashboard`,
      );
      router.refresh();
    }}
    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-sm text-white/65 transition hover:border-gold/40 hover:text-gold"
  >
    {isRtl
      ? "الذهاب إلى لوحة التحكم"
      : "Go to Dashboard"}
  </button>
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
            ? "التخصص الأساسي"
            : "Primary role"}
        </p>

        <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
          {isRtl
            ? "ما هو تخصصك؟"
            : "What's your talent type?"}
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/45">
          {isRtl
            ? "اختر تخصصك الأساسي الآن. يمكنك استكمال جميع بياناتك المهنية لاحقًا من ملفك الشخصي."
            : "Choose your primary talent type. You can complete the rest of your professional profile later."}
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
        <label className="group cursor-pointer">
          <input
            type="radio"
            name="primary_role"
            value="actor"
            className="peer sr-only"
          />

          <div className="min-h-48 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition group-hover:border-gold/35 peer-checked:border-gold peer-checked:bg-gold/[0.08]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
              <Drama size={22} />
            </div>

            <h3 className="mt-6 text-2xl font-light text-white">
              {isRtl ? "ممثل" : "Actor"}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {isRtl
                ? "للأدوار الدرامية والإعلانية والأفلام والمحتوى."
                : "For acting roles, commercials, film, and content."}
            </p>
          </div>
        </label>

        <label className="group cursor-pointer">
          <input
            type="radio"
            name="primary_role"
            value="model"
            className="peer sr-only"
          />

          <div className="min-h-48 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 transition group-hover:border-gold/35 peer-checked:border-gold peer-checked:bg-gold/[0.08]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
              <Sparkles size={22} />
            </div>

            <h3 className="mt-6 text-2xl font-light text-white">
              {isRtl ? "مودل" : "Model"}
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {isRtl
                ? "للإعلانات والأزياء والحملات والتصوير."
                : "For commercials, fashion, campaigns, and shoots."}
            </p>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isPending
          ? isRtl
            ? "جارٍ إنشاء الملف..."
            : "Creating profile..."
          : isRtl
            ? "إنشاء ملفي"
            : "Create My Profile"}
      </button>
    </form>
  );
}