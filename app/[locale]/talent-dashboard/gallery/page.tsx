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
  title: "Photos & Work — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MAX_GALLERY_IMAGES = 20;

export default async function TalentGalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
    .select("id, name_ar, name_en, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`[TalentGalleryPage] ${error.message}`);
  if (!talent) redirect(`/${locale}/talent-dashboard`);

  const galleryImages = Array.from(new Set(normalizeGalleryImages(talent.gallery_images).filter(Boolean)));
  const canUploadMore = galleryImages.length < MAX_GALLERY_IMAGES;
  const talentName = (isArabic ? talent.name_ar || talent.name_en : talent.name_en || talent.name_ar) || null;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 pb-24 pt-36 text-white sm:px-6 lg:pt-32">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.12),transparent_40%),rgba(255,255,255,0.025)] p-6 sm:p-8 lg:p-10">
          <Link href={`/${locale}/talent-dashboard/profile`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
            <span>{isArabic ? "→" : "←"}</span>
            {isArabic ? "العودة إلى ملفي" : "Back to profile"}
          </Link>
          <p className="mt-8 text-[10px] uppercase tracking-[0.34em] text-gold">{isArabic ? "ملفي" : "MY PROFILE"}</p>
          <h1 className="mt-3 text-4xl font-light sm:text-5xl">{isArabic ? "الصور والأعمال" : "Photos & work"}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
            {isArabic
              ? "أضف أفضل صور أعمالك التي تساعد الناشرين على تقييم حضورك وخبرتك. هذه الصور اختيارية ومستقلة عن الصورة الشخصية."
              : "Add your strongest work photos to help publishers evaluate your presence and experience. These photos are optional and separate from your profile photo."}
          </p>
        </header>

        <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{isArabic ? "صور الأعمال" : "WORK PHOTOS"}</p>
                <h2 className="mt-2 text-2xl font-light">{isArabic ? "أضف أفضل صورك" : "Add your strongest images"}</h2>
                <p className="mt-2 text-sm leading-7 text-white/45">{isArabic ? `${galleryImages.length} من ${MAX_GALLERY_IMAGES} صورة` : `${galleryImages.length} of ${MAX_GALLERY_IMAGES} photos`}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">{galleryImages.length}/{MAX_GALLERY_IMAGES}</span>
            </div>
            {canUploadMore ? (
              <GalleryUploadButton isArabic={isArabic} locale={locale} currentImageCount={galleryImages.length} action={addSecureGalleryImagesAction} />
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-4 text-sm text-amber-100">
                {isArabic ? "وصلت إلى الحد الأقصى للصور. احذف صورة قبل إضافة صورة جديدة." : "You reached the image limit. Remove an image before uploading another."}
              </div>
            )}
          </div>

          <Link href={`/${locale}/talent-dashboard/gallery/links`} className="group rounded-[2rem] border border-gold/20 bg-gold/[0.035] p-5 transition hover:border-gold/40 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-gold">{isArabic ? "قسم آخر من ملفك" : "ANOTHER PROFILE SECTION"}</p>
            <h2 className="mt-2 text-2xl font-light">{isArabic ? "الفيديو والروابط المهنية" : "Video & professional links"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/45">{isArabic ? "Showreel وروابط الفيديو والبورتفوليو الخارجي وInstagram وTikTok وSnapchat تُدار في قسم مستقل وواضح." : "Showreel, video links, external portfolio, Instagram, TikTok and Snapchat are managed in a separate, clear profile section."}</p>
            <span className="mt-6 inline-flex text-sm text-gold">{isArabic ? "فتح القسم ←" : "Open section →"}</span>
          </Link>
        </section>

        <section className="mt-6">
          {galleryImages.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] px-5 py-14 text-center">
              <h3 className="text-2xl font-light">{isArabic ? "لا توجد صور أعمال بعد" : "No work photos yet"}</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">{isArabic ? "هذا طبيعي. صور الأعمال اختيارية ويمكن إضافتها لاحقًا، ولا تمنع إرسال الملف للمراجعة." : "That is okay. Work photos are optional, can be added later, and do not block review submission."}</p>
            </div>
          ) : (
            <GallerySortableList images={galleryImages} talentName={talentName} locale={locale} reorderAction={reorderOwnGalleryImagesAction} removeAction={removeOwnGalleryImageAction} />
          )}
        </section>
      </div>
    </main>
  );
}
