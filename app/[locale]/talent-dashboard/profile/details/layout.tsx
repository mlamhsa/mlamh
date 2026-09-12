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

    // Draft/profile improvements must remain saveable independently from the
    // final review gate. The canonical review readiness check runs elsewhere.
    const previousNoValidate = form.noValidate;
    form.noValidate = true;
    form.requestSubmit();
    window.setTimeout(() => {
      form.noValidate = previousNoValidate;
    }, 0);
  }

  return (
    <>
      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto mb-5 max-w-6xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
                {isArabic ? "تعديل الملف" : "EDIT PROFILE"}
              </p>
              {isApproved ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] text-emerald-100">
                  {isArabic ? "ملف معتمد" : "Approved profile"}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-light text-white sm:text-3xl">
              {isArabic ? "حدّث بياناتك بسهولة" : "Keep your profile up to date"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">
              {isApproved
                ? isArabic
                  ? "التعديلات المهنية تُحفظ مباشرة، واعتماد ملفك يبقى محفوظًا. البيانات الأساسية المحمية لها مسار مراجعة منفصل."
                  : "Professional updates save directly and your approval stays active. Protected identity details use a separate review flow."
                : isArabic
                  ? "احفظ ما أدخلته الآن وارجع لاحقًا لإكمال بقية البيانات."
                  : "Save what you have now and come back later to finish the rest."}
            </p>
          </div>

          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/10 px-4 text-xs text-white/60 transition hover:border-gold/30 hover:text-gold"
          >
            {isArabic ? "العودة لملفي" : "Back to my profile"}
          </Link>
        </div>
      </section>

      {isApproved ? (
        <section
          dir={isArabic ? "rtl" : "ltr"}
          className="mx-auto mb-5 max-w-6xl rounded-[1.75rem] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.075),rgba(197,160,89,0.025))] p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[11px] text-emerald-100">
                  {isArabic ? "الاعتماد محفوظ" : "Approval stays active"}
                </span>
                <span className="rounded-full border border-gold/20 bg-gold/[0.045] px-3 py-1 text-[11px] text-gold">
                  {isArabic ? "حفظ مباشر للبيانات المهنية" : "Professional details save directly"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                {isArabic
                  ? "عدّل الطول والوزن والمقاسات والمهارات والخبرة والتوفر والتنقل وغيرها من بياناتك المهنية مباشرة. لن نعرض لك حقولًا مقفلة داخل هذا المحرر؛ تعديل البيانات الأساسية المحمية يتم من المسار المخصص."
                  : "Update measurements, skills, experience, availability, mobility and other professional details directly. Protected identity fields are handled in their dedicated flow instead of appearing as disabled inputs here."}
              </p>
            </div>

            <Link
              href={`/${locale}/talent-dashboard/profile/change-request`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/[0.055] px-5 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
            >
              {isArabic ? "طلب تعديل البيانات الأساسية" : "Request core detail changes"}
            </Link>
          </div>
        </section>
      ) : null}

      <div
        ref={editorScopeRef}
        className={isApproved ? "talent-profile-editor talent-profile-editor--approved" : "talent-profile-editor"}
      >
        {children}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-4 sm:px-6 lg:bottom-6">
        <div className="mx-auto flex max-w-6xl justify-end">
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

      <style jsx global>{`
        .talent-profile-editor > main > div:first-child {
          max-width: 72rem !important;
        }
        .talent-profile-editor > main > div > div:first-child {
          display: none;
        }
        .talent-profile-editor--approved > main form > section:first-of-type {
          display: none;
        }
        .talent-profile-editor > main form > div:last-child {
          display: none;
        }
        .talent-profile-editor > main {
          padding-top: 0 !important;
          padding-bottom: 8.5rem !important;
        }
      `}</style>
    </>
  );
}
