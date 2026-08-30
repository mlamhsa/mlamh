"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "react";
import { useFormStatus } from "react-dom";

import { ProfileShareButton } from "@/components/public/ProfileShareButton";
import { updateOwnTalentMainImageAction } from "@/lib/actions/update-own-talent-main-image";

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

  const hasProfileImage = Boolean(
    String(talent.image_url ?? "").trim()
  );

  const galleryImageCount = Array.isArray(talent.gallery_images)
    ? Array.from(
        new Set(
          talent.gallery_images
            .filter(
              (value): value is string =>
                typeof value === "string" && Boolean(value.trim())
            )
            .map((value) => value.trim())
        )
      ).length
    : 0;

  const canShareProfile = Boolean(
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
                  success={
                    profileStatus === "جاهز" ||
                    profileStatus === "Ready"
                  }
                />

                <Pill label={availabilityStatus} gold />

                <Pill
                  label={
                    talent.published
                      ? isRtl
                        ? "ظاهر للجهات"
                        : "Visible to publishers"
                      : isRtl
                        ? "غير ظاهر للجهات"
                        : "Not visible to publishers"
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

        {!hasProfileImage ? (
          <div className="mt-6 rounded-2xl border border-orange-400/25 bg-orange-400/[0.07] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1 text-[11px] font-medium text-orange-300">
                  {isRtl ? "مهم لظهورك" : "Important for visibility"}
                </span>

                <h3 className="mt-3 text-lg font-medium text-white">
                  {isRtl
                    ? "أضف صورتك الشخصية ليظهر ملفك في صفحة المواهب"
                    : "Add a profile photo to appear in the talent directory"}
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
                  {isRtl
                    ? "لن يظهر ملفك ضمن دليل المواهب حتى تضيف صورة شخصية واضحة. اضغط على الصورة أعلاه أو استخدم الزر لإضافتها الآن."
                    : "Your profile will not appear in the talent directory until you add a clear profile photo. Use the photo above or the button to add one now."}
                </p>
              </div>

              <label
                htmlFor="talent-profile-image"
                className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-medium text-black transition hover:opacity-90"
              >
                <Camera size={16} />
                {isRtl ? "إضافة الصورة الشخصية" : "Add profile photo"}
              </label>
            </div>
          </div>
        ) : null}

        {galleryImageCount === 0 ? (
          <div className="mt-4 rounded-2xl border border-gold/15 bg-gold/[0.04] px-5 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {isRtl
                    ? "أضف صورًا إلى معرض أعمالك"
                    : "Add photos to your work gallery"}
                </p>

                <p className="mt-1 text-xs leading-6 text-white/45">
                  {isRtl
                    ? "معرض الأعمال اختياري ويمكنك رفع حتى 20 صورة. إضافة صور جيدة تساعد الجهات على تقييم ملفك والتعرف على أعمالك بشكل أفضل."
                    : "Your work gallery is optional and supports up to 20 photos. Strong photos help publishers evaluate your profile and understand your work better."}
                </p>
              </div>

              <Link
                href={`/${locale}/talent-dashboard/gallery`}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/[0.08] px-4 text-xs font-medium text-gold transition hover:bg-gold hover:text-black"
              >
                {isRtl ? "إضافة صور الأعمال" : "Add work photos"}
              </Link>
            </div>
          </div>
        ) : null}

        {!canShareProfile ? (
          <div className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.04] px-5 py-4">
            <p className="text-xs leading-6 text-white/45">
              {isRtl
                ? hasProfileImage
                  ? "ستظهر خاصيتا معاينة الملف ومشاركته عند إتاحة الملف للظهور العام. يمكنك التقديم على الفرص دون انتظار ذلك."
                  : "أضف الصورة الشخصية أولًا لإكمال جاهزية ظهور ملفك، ثم ستتاح لك معاينة الملف ومشاركته عند نشره."
                : hasProfileImage
                  ? "Profile preview and sharing will appear when the profile is publicly visible. You can apply for opportunities without waiting for that."
                  : "Add your profile photo first to complete your visibility readiness. Preview and sharing will become available once the profile is published."}
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
          <Image
            src={previewUrl}
            alt={talentName}
            fill
            unoptimized
            sizes="128px"
            className="object-cover transition duration-300 group-hover:scale-105"
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
