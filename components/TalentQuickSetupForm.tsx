"use client";

import { startTransition, useActionState, useEffect } from "react";
import { Drama, Sparkles } from "lucide-react";

import {
  createTalentDraftAction,
  type CreateTalentDraftState,
} from "@/lib/actions/create-talent-draft";
import type { Locale } from "@/lib/i18n";

const initialState: CreateTalentDraftState = {
  success: false,
  message: null,
};

type TalentRole = "actor" | "model";

export function TalentQuickSetupForm({
  locale,
  initialRole = null,
}: {
  locale: Locale;
  initialRole?: TalentRole | null;
}) {
  const isRtl = locale === "ar";
  const [state, formAction, isPending] = useActionState(
    createTalentDraftAction,
    initialState,
  );

  useEffect(() => {
    if (!state.success) return;
    window.dispatchEvent(new Event("mlamh:account-updated"));
    window.location.assign(`/${locale}/talent-dashboard/profile`);
  }, [locale, state.success]);

  const roleName = initialRole === "actor"
    ? (isRtl ? "ممثل" : "Actor")
    : initialRole === "model"
      ? (isRtl ? "مودل" : "Model")
      : null;
  const RoleIcon = initialRole === "actor" ? Drama : Sparkles;

  if (state.success) {
    return (
      <section className="rounded-[2rem] border border-gold/25 bg-gold/[0.04] px-6 py-10 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-gold" />
        <h2 className="mt-4 text-2xl font-light text-white">
          {isRtl ? "تم حفظ تخصصك" : "Your talent type is saved"}
        </h2>
        <p className="mt-3 text-sm text-white/50">
          {isRtl ? "ننقلك الآن إلى الخطوة التالية لإكمال ملفك." : "Taking you to the next profile step."}
        </p>
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
      {initialRole ? <input type="hidden" name="primary_role" value={initialRole} /> : null}

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {isRtl ? "التخصص الأساسي" : "PRIMARY ROLE"}
        </p>
        <h2 className="mt-3 text-2xl font-light text-white sm:text-3xl">
          {initialRole
            ? (isRtl ? "اختيارك محفوظ معنا" : "We kept your choice")
            : (isRtl ? "ما هو تخصصك؟" : "What's your talent type?")}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/45">
          {initialRole
            ? (isRtl
                ? "اخترت هذا المسار عند إنشاء الحساب، لذلك لن نطلب منك اختياره مرة أخرى."
                : "You chose this path during signup, so we won't ask you to select it again.")
            : (isRtl
                ? "اختر تخصصك الأساسي للمتابعة."
                : "Choose your primary talent type to continue.")}
        </p>
      </div>

      {state.message ? (
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
          {state.message}
        </div>
      ) : null}

      {initialRole && roleName ? (
        <div className="flex items-center gap-4 rounded-[1.5rem] border border-gold/35 bg-gold/[0.06] p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.08] text-gold">
            <RoleIcon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/40">{isRtl ? "مسارك" : "Your path"}</p>
            <p className="mt-1 text-xl text-white">{roleName}</p>
          </div>
          <span className="rounded-full border border-gold/25 px-3 py-1 text-[10px] text-gold">
            {isRtl ? "محدد" : "Selected"}
          </span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <RoleChoice value="actor" icon={<Drama size={22} />} title={isRtl ? "ممثل" : "Actor"} body={isRtl ? "للأدوار الدرامية والإعلانية والأفلام والمحتوى." : "For acting roles, commercials, film, and content."} />
          <RoleChoice value="model" icon={<Sparkles size={22} />} title={isRtl ? "مودل" : "Model"} body={isRtl ? "للإعلانات والأزياء والحملات والتصوير." : "For commercials, fashion, campaigns, and shoots."} />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-medium text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isPending
          ? (isRtl ? "جارٍ الحفظ..." : "Saving...")
          : (isRtl ? "حفظ ومتابعة" : "Save & Continue")}
      </button>
    </form>
  );
}

function RoleChoice({
  value,
  icon,
  title,
  body,
}: {
  value: TalentRole;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <label className="group cursor-pointer">
      <input type="radio" name="primary_role" value={value} required className="peer sr-only" />
      <div className="min-h-44 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 transition group-hover:border-gold/35 peer-checked:border-gold peer-checked:bg-gold/[0.08]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-gold">
          {icon}
        </div>
        <h3 className="mt-5 text-2xl font-light text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/45">{body}</p>
      </div>
    </label>
  );
}
