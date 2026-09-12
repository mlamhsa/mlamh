"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { getOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";

export default function TalentProfileDetailsLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const editorScopeRef = useRef<HTMLDivElement>(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    let active = true;

    void getOwnTalentProfileAction(locale)
      .then((talent) => {
        if (!active) return;
        const status = String(talent?.approval_status ?? "").trim().toLowerCase();
        setIsApproved(status === "approved");
      })
      .catch(() => {
        if (active) setIsApproved(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  function saveCurrentDraft() {
    const form = editorScopeRef.current?.querySelector<HTMLFormElement>("form");
    if (!form) return;

    // Saving a draft must stay possible before every approval requirement is
    // complete. Final review submission is validated separately by readiness.
    const previousNoValidate = form.noValidate;
    form.noValidate = true;
    form.requestSubmit();
    window.setTimeout(() => {
      form.noValidate = previousNoValidate;
    }, 0);
  }

  return (
    <>
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="mb-5 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            {isArabic ? "محرر الملف" : "PROFILE EDITOR"}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {isArabic ? "يمكنك الحفظ والعودة لاحقًا في أي وقت." : "Save your progress and return any time."}
          </p>
        </div>
        <Link
          href={`/${locale}/talent-dashboard/profile`}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold"
        >
          {isArabic ? "العودة لملفي" : "Back to my profile"}
        </Link>
      </div>

      {isApproved ? (
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="mb-5 overflow-hidden rounded-[1.75rem] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.08),rgba(197,160,89,0.035))] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-100">
                  {isArabic ? "الاعتماد محفوظ" : "Approval stays active"}
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-white/50">
                  {isArabic ? "تعديل مباشر للبيانات المهنية" : "Professional details save directly"}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-light text-white sm:text-3xl">
                {isArabic ? "عدّل ملفك بحرية" : "Edit your profile with confidence"}
              </h1>
              <p className="mt-2 text-sm leading-7 text-white/55">
                {isArabic
                  ? "الطول والوزن والمقاسات والمهارات والخبرة والتوفر وغيرها تُحفظ مباشرة. فقط الاسم والجوال والجنسية تحتاج مراجعة منفصلة لحماية هوية الملف المعتمد."
                  : "Measurements, skills, experience, availability and other professional details save directly. Only name, phone and nationality use a separate review to protect an approved profile identity."}
              </p>
            </div>

            <Link
              href={`/${locale}/talent-dashboard/profile/change-request`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/[0.055] px-5 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
            >
              {isArabic ? "تعديل الاسم أو الجوال أو الجنسية" : "Change name, phone or nationality"}
            </Link>
          </div>
        </section>
      ) : null}

      <div ref={editorScopeRef}>{children}</div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-4 sm:px-6 lg:bottom-6">
        <div className="mx-auto flex max-w-3xl justify-end">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/90 p-1.5 shadow-2xl backdrop-blur-xl">
            <Link
              href={`/${locale}/talent-dashboard/profile`}
              className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-xs text-white/55 transition hover:text-white"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </Link>
            <button
              type="button"
              onClick={saveCurrentDraft}
              className="min-h-11 rounded-full bg-gold px-6 text-sm font-semibold text-black transition hover:brightness-105"
            >
              {isArabic ? "حفظ التعديلات" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
