import Link from "next/link";
import { redirect } from "next/navigation";
import { GalleryUploadButton } from "./GalleryUploadButton";

import {
  addOwnGalleryImageAction,
  removeOwnGalleryImageAction,
  reorderOwnGalleryImagesAction,
} from "@/lib/actions/update-own-talent-gallery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

import { GallerySortableList } from "./gallery-sortable-list";

export const metadata = {
  title: "My Gallery — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string }>;
};

const MAX_GALLERY_IMAGES = 20;

function GalleryIcon({
  name,
  className = "h-5 w-5",
}: {
  name: "image" | "upload" | "profile" | "dashboard" | "arrow" | "check";
  className?: string;
}) {
  if (name === "image") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <circle cx="9" cy="9" r="1.5" />
        <path d="m5.5 17 4.5-4.5 3.2 3.2 2.2-2.2 3.1 3.5" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="M12 16V5M8 9l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14.5v3A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-3" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "profile") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 19c.8-3.2 3-5 6.5-5s5.7 1.8 6.5 5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
        <rect x="4" y="4" width="6" height="6" rx="1.5" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
        <path d="m6 12 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function TalentGalleryPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { updated } = await searchParams;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id, slug, name_ar, name_en, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (talentError) {
    throw new Error(`[TalentGalleryPage talent] ${talentError.message}`);
  }

  if (!talent) {
    redirect(`/${locale}/talent-dashboard`);
  }

  const gallery = normalizeGalleryImages(talent.gallery_images);

  const galleryImages = Array.from(
    new Set(gallery.filter(Boolean))
  );

  const talentName =
    (isArabic ? talent.name_ar || talent.name_en : talent.name_en || talent.name_ar) ||
    null;

    const galleryProgress = Math.min(
      100,
      Math.round((galleryImages.length / MAX_GALLERY_IMAGES) * 100)
    );
    
    const canUploadMore =
      galleryImages.length < MAX_GALLERY_IMAGES;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 sm:pt-40 lg:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/${locale}/talent-dashboard`}
                className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold"
              >
                <span className={isArabic ? "rotate-180" : ""}>
                  <GalleryIcon name="arrow" className="h-4 w-4" />
                </span>
                {isArabic ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}
              </Link>

              <p className="mt-8 text-[10px] uppercase tracking-[0.36em] text-gold">
                {isArabic ? "لوحة الموهبة" : "Talent Workspace"}
              </p>

              <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl lg:text-6xl">
                {isArabic ? "معرض الأعمال" : "My Gallery"}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
              {isArabic
  ? "اعرض أفضل صور أعمالك ورتّبها بالطريقة التي تريدها لتظهر للناشرين والشركات."
  : "Showcase your best work and arrange it in the order you want publishers and companies to see."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={`/${locale}/talent-dashboard/profile`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs text-white/60 transition hover:border-gold/35 hover:text-gold"
              >
                <GalleryIcon name="profile" className="h-4 w-4" />
                {isArabic ? "تعديل الملف" : "Edit Profile"}
              </Link>

              <Link
                href={`/${locale}/talent-dashboard`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs text-white/60 transition hover:border-gold/35 hover:text-gold"
              >
                <GalleryIcon name="dashboard" className="h-4 w-4" />
                {isArabic ? "لوحة التحكم" : "Dashboard"}
              </Link>
            </div>
          </div>
        </header>

        {updated === "1" ? (
          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-4 text-sm text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <GalleryIcon name="check" className="h-4 w-4" />
              {isArabic ? "تم تحديث معرض الأعمال بنجاح." : "Gallery updated successfully."}
            </span>

            <Link
              href={`/${locale}/talent-dashboard/gallery`}
              className="text-[10px] uppercase tracking-[0.22em] text-emerald-200/70 transition hover:text-emerald-100"
            >
              {isArabic ? "إخفاء" : "Dismiss"}
            </Link>
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                  {isArabic ? "رفع صورة جديدة" : "Upload New Image"}
                </p>

                <h2 className="mt-2 text-2xl font-light sm:text-3xl">
                  {isArabic ? "أضف عملًا إلى معرضك" : "Add Work to Your Gallery"}
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
                <GalleryIcon name="upload" />
              </div>
            </div>

            {canUploadMore ? (
              <GalleryUploadButton
              isArabic={isArabic}
              locale={locale}
              currentImageCount={galleryImages.length}
              action={addOwnGalleryImageAction}
            />
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-4 text-sm text-amber-100">
                {isArabic
                  ? "وصلت إلى الحد الأقصى للصور. احذف صورة قبل إضافة صورة جديدة."
                  : "You reached the maximum number of images. Remove an image before uploading another one."}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_45%),rgba(201,169,98,0.035)] p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              {isArabic ? "ملخص المعرض" : "Gallery Summary"}
            </p>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-white/40">
                  {isArabic ? "إجمالي الصور" : "Total Images"}
                </p>
                <p className="mt-2 text-5xl font-light text-white">
                  {galleryImages.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/25 bg-black/20 text-gold">
                <GalleryIcon name="image" className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/35">
                <span>{isArabic ? "سعة المعرض" : "Gallery Capacity"}</span>
                <span>{galleryImages.length} / {MAX_GALLERY_IMAGES}</span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${galleryProgress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {galleryImages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-5 py-14 text-center sm:px-8 sm:py-20">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.05] text-gold">
                <GalleryIcon name="image" className="h-6 w-6" />
              </div>

              <h3 className="mt-5 text-2xl font-light">
                {isArabic ? "معرضك ما زال فارغًا" : "Your gallery is empty"}
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
                {isArabic
                  ? "ابدأ بإضافة أفضل صورك حتى يتمكن الناشرون والشركات من مشاهدة أعمالك."
                  : "Start adding your best images so publishers and companies can discover your work."}
              </p>
            </div>
          ) : (
            <GallerySortableList
  images={galleryImages}
  talentName={talentName}
  locale={locale}
  reorderAction={reorderOwnGalleryImagesAction}
  removeAction={removeOwnGalleryImageAction}
/>
          )}
        </section>
      </div>
    </main>
  );
}
