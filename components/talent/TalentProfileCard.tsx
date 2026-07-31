"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Camera,
  Edit3,
  Eye,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { useFormStatus } from "react-dom";

import { ProfileShareButton } from "@/components/public/ProfileShareButton";
import { updateOwnTalentMainImageAction } from "@/lib/actions/update-own-talent-main-image";

type TalentProfileCardProps = {
  locale: string;
  talent: {
    image_url?: string | null;
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

  const canShareProfile = Boolean(
    talent.status === "approved" &&
      talent.published === true &&
      talent.slug?.trim()
  );

  const publicProfileUrl = talent.slug
    ? `/${locale}/talent/${encodeURIComponent(talent.slug)}`
    : null;

  return (
    <section className="mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035]">
      <div className="h-24 bg-gradient-to-r from-gold/[0.18] via-white/[0.06] to-transparent" />

      <div className="p-6">
        <div className="-mt-16 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
            <form
              action={updateOwnTalentMainImageAction}
              className="shrink-0"
            >
              <input type="hidden" name="locale" value={locale} />

              <ProfileImagePicker
                imageUrl={talent.image_url}
                talentName={talentName}
                isRtl={isRtl}
              />
            </form>

            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="break-words text-3xl font-light text-white md:text-4xl">
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
                {[talentCategory, talentCity]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill
                  label={profileStatus}
                  success={talent.status === "approved"}
                />

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

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:w-auto">
            <Link
              href={`/${locale}/talent-dashboard/profile`}
              className="arabic-safe inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gold/40 bg-gold/[0.06] px-4 text-[10px] uppercase tracking-[0.14em] text-gold transition hover:bg-gold hover:text-black"
            >
              <Edit3 size={15} />

              {isRtl ? "تعديل الملف" : "Edit Profile"}
            </Link>

            {canShareProfile && publicProfileUrl ? (
              <>
                <Link
                  href={publicProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="arabic-safe inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-4 text-[10px] uppercase tracking-[0.14em] text-white transition hover:border-gold/40 hover:text-gold"
                >
                  <Eye size={15} />

                  {isRtl ? "معاينة الملف" : "Preview Profile"}
                </Link>

                <ProfileShareButton
                  locale={isRtl ? "ar" : "en"}
                  title={talentName}
                  url={publicProfileUrl}
                  className="h-10 w-full justify-center px-4 py-0 tracking-[0.14em]"
                />
              </>
            ) : null}
          </div>
        </div>

        {!canShareProfile ? (
          <div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] px-5 py-4">
            <p className="text-xs leading-6 text-white/45">
              {isRtl
                ? "ستظهر خاصيتا معاينة الملف ومشاركته بعد اعتماد الملف ونشره."
                : "Profile preview and sharing will appear after the profile is approved and published."}
            </p>
          </div>
        ) : null}

<div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.22em] text-white/40">
            <span>
              {isRtl ? "اكتمال الملف" : "Profile completion"}
            </span>

            <span className="text-gold">
              {profileCompletion}%
            </span>
          </div>

          <div
  role="progressbar"
  aria-label={
    isRtl ? "نسبة اكتمال الملف" : "Profile completion percentage"
  }
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.min(Math.max(profileCompletion, 0), 100)}
  className="h-3 overflow-hidden rounded-full bg-white/10"
>
  <div
    className="h-full rounded-full bg-gold transition-all duration-500"
    style={{
      width: `${Math.min(
        Math.max(profileCompletion, 0),
        100
      )}%`,
    }}
  />
</div>

<p className="mt-2 text-xs text-white/45">
            {profileCompletion >= 100
              ? isRtl
                ? "ملفك مكتمل وجاهز للظهور أمام الشركات."
                : "Your profile is complete and ready to be discovered by companies."
              : isRtl
                ? "كلما كان ملفك أكثر اكتمالًا زادت فرص ظهوره للشركات."
                : "A more complete profile improves your visibility to companies."}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileImagePicker({
  imageUrl,
  talentName,
  isRtl,
}: {
  imageUrl?: string | null;
  talentName: string;
  isRtl: boolean;
}) {
  const { pending } = useFormStatus();

  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    imageUrl ?? null
  );

  useEffect(() => {
    formRef.current = inputRef.current?.form ?? null;
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(nextPreviewUrl);

    window.setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }

  return (
    <div className="group relative">
      <input
        ref={inputRef}
        type="file"
        name="profile_image"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageChange}
        disabled={pending}
        className="sr-only"
        id="talent-profile-image"
      />

      <label
        htmlFor="talent-profile-image"
        aria-label={
          isRtl
            ? "تغيير الصورة الشخصية"
            : "Change profile image"
        }
        className={`relative block h-32 w-32 overflow-hidden rounded-full border-4 border-black bg-white/5 ring-1 ring-gold/30 transition ${
          pending
            ? "cursor-wait opacity-75"
            : "cursor-pointer hover:ring-gold/70"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={talentName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-gold">
            {talentName?.charAt(0) ?? "M"}
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/45">
          {pending ? (
            <div className="flex flex-col items-center gap-2 text-white">
              <LoaderCircle className="h-6 w-6 animate-spin" />

              <span className="text-[9px]">
                {isRtl ? "جارٍ الرفع" : "Uploading"}
              </span>
            </div>
          ) : (
            <div className="flex translate-y-2 flex-col items-center gap-1 text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              <Camera className="h-6 w-6" />

              <span className="text-[9px]">
                {isRtl ? "تغيير الصورة" : "Change Image"}
              </span>
            </div>
          )}
        </div>
      </label>

      {!pending ? (
        <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 end-0 flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 bg-black text-gold shadow-lg transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={
            isRtl
              ? "رفع صورة شخصية جديدة"
              : "Upload a new profile image"
          }
        >
          <Camera className="h-4 w-4" />
        </button>
      ) : null}
    </div>
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