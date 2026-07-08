import Link from "next/link";
import { BadgeCheck, Edit3, Sparkles } from "lucide-react";

export default function TalentProfileCard({
  locale,
  talent,
  talentName,
  talentCategory,
  talentCity,
  profileStatus,
  availabilityStatus,
  profileCompletion,
}: any) {
  const isRtl = locale === "ar";

  return (
    <section className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
      <div className="h-24 bg-gradient-to-r from-gold/[0.18] via-white/[0.06] to-transparent" />

      <div className="p-6">
        <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-black bg-white/5 ring-1 ring-gold/30">
              {talent.image_url ? (
                <img
                  src={talent.image_url}
                  alt={talentName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl text-gold">
                  {talentName?.charAt(0) ?? "M"}
                </div>
              )}
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-light text-white md:text-4xl">
                  {talentName}
                </h2>

                {talent.verified ? (
                  <Pill
                    label={isRtl ? "موثق" : "Verified"}
                    icon={<BadgeCheck size={13} />}
                    success
                  />
                ) : null}

                {talent.featured ? (
                  <Pill
                    label={isRtl ? "مميز" : "Featured"}
                    icon={<Sparkles size={13} />}
                    gold
                  />
                ) : null}
              </div>

              <p className="mt-3 text-sm text-white/45">
                {[talentCategory, talentCity].filter(Boolean).join(" · ")}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill label={profileStatus} />
                <Pill label={availabilityStatus} gold />
                <Pill
                  label={
                    talent.published
                      ? isRtl
                        ? "منشور"
                        : "Published"
                      : isRtl
                      ? "غير منشور"
                      : "Unpublished"
                  }
                />
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-4 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
          >
            <Edit3 size={15} />
            {isRtl ? "تعديل الملف" : "Edit Profile"}
          </Link>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <div className="mb-3 flex justify-between text-xs uppercase tracking-[0.22em] text-white/40">
            <span>{isRtl ? "اكتمال الملف" : "Profile completion"}</span>
            <span className="text-gold">{profileCompletion}%</span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          <p className="mt-3 text-xs leading-6 text-white/40">
            {isRtl
              ? "كلما كان ملفك أكثر اكتمالاً زادت فرص ظهورك للشركات."
              : "A more complete profile improves your visibility to companies."}
          </p>
        </div>
      </div>
    </section>
  );
}

function Pill({
  label,
  icon,
  gold = false,
  success = false,
}: {
  label: string;
  icon?: React.ReactNode;
  gold?: boolean;
  success?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
        success
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : gold
          ? "border-gold/30 bg-gold/10 text-gold"
          : "border-white/10 bg-white/[0.04] text-white/55"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}