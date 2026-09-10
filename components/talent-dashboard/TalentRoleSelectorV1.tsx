"use client";

import { useEffect, useMemo, useState } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { updateOwnTalentRoleAction } from "@/lib/actions/update-own-talent-role";
import { TALENT_PROFILE_ROLE_CONFIGS } from "@/lib/talent/profile-role-config";

type Props = {
  locale: "ar" | "en";
};

export function TalentRoleSelectorV1({ locale }: Props) {
  const isArabic = locale === "ar";
  const [currentRole, setCurrentRole] = useState("");
  const [loading, setLoading] = useState(true);

  const roles = useMemo(
    () => Object.values(TALENT_PROFILE_ROLE_CONFIGS),
    [],
  );

  useEffect(() => {
    let active = true;

    void getOwnTalentProfileAction(locale)
      .then((talent) => {
        if (!active) return;
        setCurrentRole(String(talent?.primary_role ?? talent?.category_slug ?? ""));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <section className="rounded-[1.75rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.13),transparent_45%),rgba(255,255,255,0.02)] p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
            {isArabic ? "نوع الموهبة" : "Talent Type"}
          </p>
          <h2 className="mt-3 text-xl font-light text-white sm:text-2xl">
            {isArabic ? "اختر تخصصك الأساسي ⭐" : "Choose your primary talent type ⭐"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
            {isArabic
              ? "اختيارك يحدد الحقول المهنية المناسبة لك ويستخدم في المطابقة مع الفرص والـBriefs."
              : "Your choice controls the professional fields shown to you and is used for opportunity and Brief matching."}
          </p>
        </div>

        <span className="mt-1 shrink-0 rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-[10px] text-gold">
          {isArabic ? "مطلوب للاعتماد" : "Required for approval"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {roles.map((role) => {
          const selected = currentRole === role.slug;

          return (
            <form key={role.slug} action={updateOwnTalentRoleAction}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="primary_role" value={role.slug} />
              <button
                type="submit"
                disabled={loading || selected}
                className={`flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition active:scale-[0.98] disabled:cursor-default ${
                  selected
                    ? "border-gold bg-gold text-black shadow-lg shadow-gold/10"
                    : "border-white/10 bg-black/25 text-white/70 hover:border-gold/40 hover:text-gold"
                }`}
                aria-pressed={selected}
              >
                <span className="text-2xl" aria-hidden="true">{role.icon}</span>
                <span className="mt-2 text-sm font-medium">
                  {isArabic ? role.ar : role.en}
                </span>
                <span className={`mt-1 text-[10px] leading-4 ${selected ? "text-black/55" : "text-white/35"}`}>
                  {isArabic ? role.descriptionAr : role.descriptionEn}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
