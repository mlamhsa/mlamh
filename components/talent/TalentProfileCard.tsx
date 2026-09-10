"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Edit3, Eye, Sparkles } from "lucide-react";

import { ProfileShareButton } from "@/components/public/ProfileShareButton";

type TalentProfileCardProps = {
  locale: string;
  talent: {
    image_url?: string | null;
    gallery_images?: unknown;
    category_ar?: string | null;
    category_en?: string | null;
    status?: string | null;
    published?: boolean | null;
    slug?: string | null;
    verified?: boolean | null;
    featured?: boolean | null;
  };
  talentName: string;
  talentCity?: string | null;
  profileStatus: string;
  availabilityStatus: string;
  profileCompletion: number;
};

export default function TalentProfileCard({
  locale,
  talent,
  talentName,
  talentCity,
  profileStatus,
  availabilityStatus,
  profileCompletion,
}: TalentProfileCardProps) {
  const isRtl = locale === "ar";
  const talentCategory =
    locale === "ar"
      ? talent.category_ar ?? talent.category_en ?? null
      : talent.category_en ?? talent.category_ar ?? null;
  const imageUrl = String(talent.image_url ?? "").trim();
  const canShareProfile = Boolean(talent.published === true && talent.slug?.trim());
  const publicProfileUrl = talent.slug
    ? `/${locale}/talent/${encodeURIComponent(talent.slug)}`
    : null;

  return (
    <section className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
      <div className="h-24 bg-gradient-to-r from-gold/[0.18] via-white/[0.06] to-transparent" />
      <div className="p-6">
        <div className="-mt-16 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-black bg-white/5 ring-1 ring-gold/30">
              {imageUrl ? (
                <Image src={imageUrl} alt={talentName} fill unoptimized sizes="128px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-gold">
                  {talentName?.charAt(0) ?? "M"}
                </div>
              )}
            </div>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words text-3xl font-light text-white md:text-4xl">{talentName}</h2>
                {talent.verified ? <Pill label={isRtl ? "موثق" : "Verified"} icon={<BadgeCheck size={13} />} success /> : null}
                {talent.featured ? <Pill label={isRtl ? "مميز" : "Featured"} icon={<Sparkles size={13} />} gold /> : null}
              </div>
              <p className="mt-3 text-sm text-white/45">{[talentCategory, talentCity].filter(Boolean).join(" · ")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Pill label={profileStatus} success={profileStatus === "جاهز" || profileStatus === "Ready"} />
                <Pill label={availabilityStatus} gold />
                <Pill label={talent.published ? (isRtl ? "ظاهر للجهات" : "Visible to publishers") : (isRtl ? "غير ظاهر للجهات" : "Not visible to publishers")} />
              </div>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
            <Link href={`/${locale}/talent-dashboard/profile`} className="arabic-safe inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/[0.06] px-4 text-[10px] uppercase tracking-[0.14em] text-gold transition hover:bg-gold hover:text-black">
              <Edit3 size={15} />
              {isRtl ? "إكمال الملف" : "Complete profile"}
            </Link>
            {canShareProfile && publicProfileUrl ? (
              <>
                <Link href={publicProfileUrl} target="_blank" rel="noopener noreferrer" className="arabic-safe inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-[10px] uppercase tracking-[0.14em] text-white transition hover:border-gold/40 hover:text-gold">
                  <Eye size={15} />
                  {isRtl ? "معاينة الملف" : "Preview Profile"}
                </Link>
                <ProfileShareButton locale={isRtl ? "ar" : "en"} title={talentName} url={publicProfileUrl} className="h-10 w-full justify-center px-4 py-0 tracking-[0.14em]" />
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.22em] text-white/40">
            <span>{isRtl ? "قوة الملف" : "Profile strength"}</span>
            <span className="text-gold">{profileCompletion}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${Math.min(Math.max(profileCompletion, 0), 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/45">
            {isRtl
              ? "إدارة الصورة الشخصية ومتطلبات الاعتماد أصبحت داخل صفحة الملف الشخصي لتكون التجربة أوضح وأسهل."
              : "Profile photo and approval requirements are managed from the profile page for a clearer experience."}
          </p>
        </div>
      </div>
    </section>
  );
}

function Pill({ label, icon, success = false, gold = false }: { label: string; icon?: React.ReactNode; success?: boolean; gold?: boolean }) {
  const className = success
    ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-200"
    : gold
      ? "border-gold/30 bg-gold/[0.08] text-gold"
      : "border-white/10 bg-black/25 text-white/55";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] ${className}`}>
      {icon}
      {label}
    </span>
  );
}
