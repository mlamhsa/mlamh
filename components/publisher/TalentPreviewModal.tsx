"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

type PreviewTalent = {
  id?: string | number | null;
  slug?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  image_url?: string | null;
  category_ar?: string | null;
  category_en?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  experience_years?: number | null;
  profile_completion?: number | null;
  profile_views?: number | null;
  featured?: boolean | null;
  skills?: string[] | null;
};

type TalentPreviewModalProps = {
  talent: PreviewTalent | null;
  locale: string;
  isRtl: boolean;
};

function displayValue(value: unknown, fallback = "-") {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
}

export default function TalentPreviewModal({
  talent,
  locale,
  isRtl,
}: TalentPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!talent) return null;

  const talentName = isRtl
    ? talent.name_ar ?? talent.name_en ?? "موهبة"
    : talent.name_en ?? talent.name_ar ?? "Talent";

  const category = isRtl
    ? talent.category_ar ?? talent.category_en
    : talent.category_en ?? talent.category_ar;

  const city = isRtl
    ? talent.city_ar ?? talent.city_en
    : talent.city_en ?? talent.city_ar;

  const publicProfileHref = talent.slug
    ? `/${locale}/talent/${talent.slug}`
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex rounded-full border border-gold/30 px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black"
      >
        {isRtl ? "معاينة الملف" : "Preview Profile"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false);
            }
          }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0b0b0b] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {talent.image_url ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/10">
                  <Image
                    src={talent.image_url}
                    alt={talentName}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl text-gold">
                    {talentName.slice(0, 1)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.28em] text-gold">
                    {isRtl ? "معاينة الموهبة" : "Talent Preview"}
                  </p>

                  <h2
                    id={titleId}
                    className="mt-2 truncate text-2xl font-light text-white"
                  >
                    {talentName}
                  </h2>

                  <p className="mt-1 text-sm text-white/45">
                    {[category, city].filter(Boolean).join(" • ") || "-"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={isRtl ? "إغلاق" : "Close"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-xl text-white/50 transition hover:border-red-400/30 hover:text-red-300"
              >
                ×
              </button>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PreviewItem
                label={isRtl ? "التخصص" : "Category"}
                value={displayValue(category)}
              />
              <PreviewItem
                label={isRtl ? "المدينة" : "City"}
                value={displayValue(city)}
              />
              <PreviewItem
                label={isRtl ? "سنوات الخبرة" : "Experience"}
                value={
                  talent.experience_years === null ||
                  talent.experience_years === undefined
                    ? "-"
                    : isRtl
                      ? `${talent.experience_years} سنوات`
                      : `${talent.experience_years} years`
                }
              />
              <PreviewItem
                label={isRtl ? "اكتمال الملف" : "Profile Completion"}
                value={
                  talent.profile_completion === null ||
                  talent.profile_completion === undefined
                    ? "-"
                    : `${talent.profile_completion}%`
                }
              />
              <PreviewItem
                label={isRtl ? "مشاهدات الملف" : "Profile Views"}
                value={displayValue(talent.profile_views)}
              />
              <PreviewItem
                label={isRtl ? "موهبة مميزة" : "Featured"}
                value={
                  talent.featured === true
                    ? isRtl
                      ? "نعم"
                      : "Yes"
                    : talent.featured === false
                      ? isRtl
                        ? "لا"
                        : "No"
                      : "-"
                }
              />
            </div>

            {Array.isArray(talent.skills) && talent.skills.length > 0 ? (
              <div className="mt-7 rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-gold">
                  {isRtl ? "المهارات" : "Skills"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {talent.skills.map((skill: string, index: number) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-xl border border-gold/40 bg-gold/[0.06] px-5 py-4 text-center text-sm text-gold transition hover:bg-gold hover:text-black"
                >
                  {isRtl ? "فتح الملف الكامل" : "Open Full Profile"}
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-white/10 px-5 py-4 text-sm text-white/60 transition hover:border-white/30 hover:text-white"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PreviewItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm text-white">{value}</p>
    </div>
  );
}
