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
                {isArabic ? "قوة الملف" : "PROFILE STRENGTH"}
              </p>
              {isApproved ? (
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] text-emerald-100">
                  {isArabic ? "ملف معتمد" : "Approved profile"}
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-light text-white sm:text-3xl">
              {isArabic ? "بياناتك المهنية" : "Professional details"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-white/50">
              {isArabic
                ? "أضف التوفر والتنقل والمقاسات والمظهر والخبرة والمهارات حسب نوع موهبتك. هذه البيانات تقوّي ملفك وتحسّن المطابقة مع الفرص."
                : "Add availability, mobility, measurements, appearance, experience and skills for your talent type. These details strengthen your profile and improve matching."}
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
                  ? "تعديل البيانات المهنية لا يغيّر حالة اعتماد ملفك. البيانات الأساسية مثل الاسم والجوال والجنسية لها مسار منفصل."
                  : "Professional edits do not change your approval status. Core identity details such as name, phone and nationality use a separate flow."}
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

      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto mt-5 max-w-6xl rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {isArabic ? "حفظ البيانات" : "SAVE DETAILS"}
        </p>
        <h2 className="mt-2 text-xl font-light text-white">
          {isArabic ? "احفظ بياناتك المهنية" : "Save your professional details"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-white/50">
          {isArabic
            ? "احفظ ما أدخلته قبل الانتقال لأي صفحة أخرى. يمكنك العودة لاحقًا وإكمال بقية البيانات."
            : "Save what you entered before moving to another page. You can return later to complete the rest."}
        </p>
        <button
          type="button"
          onClick={saveCurrentDraft}
          className="mt-5 min-h-14 w-full rounded-2xl bg-gold px-6 text-base font-semibold text-black transition hover:brightness-105 sm:w-auto sm:min-w-64"
        >
          {isArabic ? "حفظ البيانات المهنية" : "Save professional details"}
        </button>
      </section>

      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="mx-auto mb-28 mt-5 max-w-6xl rounded-[1.75rem] border border-gold/20 bg-gold/[0.035] p-5 sm:p-6"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          {isArabic ? "الخطوة التالية" : "NEXT STEP"}
        </p>
        <h2 className="mt-2 text-xl font-light text-white">
          {isArabic ? "بعد الحفظ، انتقل إلى معرض الأعمال" : "After saving, continue to your portfolio"}
        </h2>
        <p className="mt-2 text-sm leading-7 text-white/55">
          {isArabic
            ? "أضف صورك وفيديوهاتك وروابطك المهنية في معرض الأعمال. تأكد أولًا من ظهور رسالة نجاح الحفظ أعلاه."
            : "Add your photos, videos and professional links in your portfolio. Make sure the save confirmation appears first."}
        </p>
        <Link
          href={`/${locale}/talent-dashboard/gallery`}
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl border border-gold/30 px-5 text-sm font-medium text-gold transition hover:bg-gold hover:text-black"
        >
          {isArabic ? "فتح معرض الأعمال" : "Open portfolio"}
        </Link>
      </section>

      <style jsx global>{`
        .talent-profile-editor > main > div:first-child {
          max-width: 72rem !important;
        }
        .talent-profile-editor > main > div > div:first-child {
          display: none;
        }
        .talent-profile-editor > main form > section:first-of-type {
          display: none;
        }
        .talent-profile-editor > main form > div:last-child {
          display: none;
        }
        .talent-profile-editor a[href*="/talent-dashboard/gallery"] {
          display: none !important;
        }
        .talent-profile-editor > main {
          padding-top: 0 !important;
          padding-bottom: 3rem !important;
        }
      `}</style>
    </>
  );
}
