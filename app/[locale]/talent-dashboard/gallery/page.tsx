import Link from "next/link";
import { redirect } from "next/navigation";

import { GalleryUploadButton } from "./GalleryUploadButton";
import { GallerySortableList } from "./gallery-sortable-list";
import { addSecureGalleryImagesAction } from "@/lib/actions/add-secure-gallery-images";
import {
  removeOwnGalleryImageAction,
  reorderOwnGalleryImagesAction,
} from "@/lib/actions/manage-own-talent-gallery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

export const metadata = {
  title: "Portfolio — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MAX_GALLERY_IMAGES = 20;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function Icon({ name }: { name: "image" | "video" | "link" | "arrow" }) {
  if (name === "image") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <circle cx="9" cy="9" r="1.5" />
        <path d="m5.5 17 4.5-4.5 3.2 3.2 2.2-2.2 3.1 3.5" />
      </svg>
    );
  }

  if (name === "video") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
        <rect x="3.5" y="5" width="13" height="14" rx="2.5" />
        <path d="m16.5 9 4-2v10l-4-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "link") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
        <path d="M10 13.5 8.5 15a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0" strokeLinecap="round" />
        <path d="M14 10.5 15.5 9A3.2 3.2 0 0 1 20 13.5l-3 3a3.2 3.2 0 0 1-4.5 0" strokeLinecap="round" />
        <path d="m9 15 6-6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function TalentGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { locale } = await params;
  const { updated } = await searchParams;
  const isArabic = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

  const adminClient = createAdminClient();
  const { data: talent, error } = await adminClient
    .from("talents")
    .select("id, name_ar, name_en, gallery_images, showreel_url, video_intro, portfolio_url, instagram, tiktok, snapchat")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`[TalentGalleryPage] ${error.message}`);
  if (!talent) redirect(`/${locale}/talent-dashboard`);

  const galleryImages = Array.from(new Set(normalizeGalleryImages(talent.gallery_images).filter(Boolean)));
  const canUploadMore = galleryImages.length < MAX_GALLERY_IMAGES;
  const talentName = (isArabic ? talent.name_ar || talent.name_en : talent.name_en || talent.name_ar) || null;
  const hasVideo = hasText(talent.showreel_url) || hasText(talent.video_intro);
  const hasWorkLink = hasText(talent.portfolio_url);
  const hasSocial = hasText(talent.instagram) || hasText(talent.tiktok) || hasText(talent.snapchat);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_40%),rgba(255,255,255,0.025)] p-6 sm:p-8 lg:p-10">
          <Link href={`/${locale}/talent-dashboard`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
            <span className={isArabic ? "rotate-180" : ""}><Icon name="arrow" /></span>
            {isArabic ? "العودة إلى لوحة الموهبة" : "Back to Talent Dashboard"}
          </Link>
          <p className="mt-8 text-[10px] uppercase tracking-[0.34em] text-gold">{isArabic ? "معرضك المهني" : "YOUR PORTFOLIO"}</p>
          <h1 className="mt-3 text-4xl font-light sm:text-5xl">{isArabic ? "معرض الأعمال" : "Portfolio"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
            {isArabic
              ? "الصور والفيديو وShowreel وروابط أعمالك وحساباتك المهنية في مكان واحد. جميع هذه العناصر اختيارية وتزيد قوة ملفك وفرص ترشيحك."
              : "Keep photos, video, showreel, work links and professional social profiles in one place. These are optional and strengthen your profile and matching."}
          </p>
        </header>

        {updated === "1" ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-4 text-sm text-emerald-200">
            {isArabic ? "تم تحديث روابط معرض الأعمال بنجاح." : "Portfolio links updated successfully."}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "الصور" : "Photos"}</p>
                <p className="mt-2 text-lg text-white/80">{galleryImages.length}</p>
              </div>
              <span className="text-gold"><Icon name="image" /></span>
            </div>
          </div>

          <Link href={`/${locale}/talent-dashboard/gallery/links`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-gold/35 hover:bg-gold/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Showreel / Video</p>
                <p className={`mt-2 text-sm ${hasVideo ? "text-emerald-300" : "text-white/50"}`}>{hasVideo ? (isArabic ? "مضاف" : "Added") : (isArabic ? "إضافة" : "Add")}</p>
              </div>
              <span className="text-gold"><Icon name="video" /></span>
            </div>
          </Link>

          <Link href={`/${locale}/talent-dashboard/gallery/links`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-gold/35 hover:bg-gold/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "رابط الأعمال" : "Work link"}</p>
                <p className={`mt-2 text-sm ${hasWorkLink ? "text-emerald-300" : "text-white/50"}`}>{hasWorkLink ? (isArabic ? "مضاف" : "Added") : (isArabic ? "إضافة" : "Add")}</p>
              </div>
              <span className="text-gold"><Icon name="link" /></span>
            </div>
          </Link>

          <Link href={`/${locale}/talent-dashboard/gallery/links`} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-gold/35 hover:bg-gold/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">{isArabic ? "السوشيال" : "Social"}</p>
                <p className={`mt-2 text-sm ${hasSocial ? "text-emerald-300" : "text-white/50"}`}>{hasSocial ? (isArabic ? "مضاف" : "Added") : (isArabic ? "إضافة" : "Add")}</p>
              </div>
              <span className="text-gold"><Icon name="link" /></span>
            </div>
          </Link>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{isArabic ? "صور الأعمال" : "WORK PHOTOS"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "أضف أفضل صورك" : "Add your strongest images"}</h2>
            <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? "معرض الصور اختياري ومستقل عن الصورة الشخصية الأساسية." : "Your photo portfolio is optional and separate from your required profile photo."}</p>
            {canUploadMore ? (
              <GalleryUploadButton isArabic={isArabic} locale={locale} currentImageCount={galleryImages.length} action={addSecureGalleryImagesAction} />
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-4 text-sm text-amber-100">
                {isArabic ? "وصلت إلى الحد الأقصى للصور. احذف صورة قبل إضافة صورة جديدة." : "You reached the image limit. Remove an image before uploading another."}
              </div>
            )}
          </div>

          <Link href={`/${locale}/talent-dashboard/gallery/links`} className="group rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 transition hover:border-gold/40 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{isArabic ? "روابطك المهنية" : "PROFESSIONAL LINKS"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "الفيديو والسوشيال في مكان واحد" : "Video and social in one place"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/45">{isArabic ? "أضف أو عدّل Showreel، الفيديو التعريفي، البورتفوليو الخارجي وInstagram وTikTok وSnapchat." : "Add or edit your showreel, intro video, external portfolio, Instagram, TikTok and Snapchat."}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm text-gold">{isArabic ? "إدارة الروابط" : "Manage links"}<span className={isArabic ? "rotate-180" : ""}><Icon name="arrow" /></span></span>
          </Link>
        </section>

        <section className="mt-6">
          {galleryImages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-5 py-14 text-center">
              <h3 className="text-2xl font-light">{isArabic ? "معرض الصور فارغ" : "Your photo gallery is empty"}</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">{isArabic ? "هذا طبيعي. الصور الإضافية اختيارية ويمكن إضافتها لاحقًا." : "That is okay. Additional portfolio photos are optional and can be added later."}</p>
            </div>
          ) : (
            <GallerySortableList images={galleryImages} talentName={talentName} locale={locale} reorderAction={reorderOwnGalleryImagesAction} removeAction={removeOwnGalleryImageAction} />
          )}
        </section>
      </div>
    </main>
  );
}
