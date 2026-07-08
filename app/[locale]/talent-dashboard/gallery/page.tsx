import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addOwnGalleryImageAction,
  removeOwnGalleryImageAction,
  reorderOwnGalleryImagesAction,
  setOwnMainImageAction,
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

export default async function TalentGalleryPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const { updated } = await searchParams;

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, slug, name_en, image_url, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    redirect(`/${locale}/talent-dashboard`);
  }

  const gallery = normalizeGalleryImages(talent.gallery_images);

  const allImages = Array.from(
    new Set([talent.image_url, ...gallery].filter(Boolean) as string[])
  );

  const galleryData = allImages.map((url) => ({ url }));

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENT
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              My Gallery
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Upload, reorder, and manage your gallery images.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/talent-dashboard/profile`}
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Edit Profile
            </Link>

            <Link
              href={`/${locale}/talent-dashboard`}
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {updated === "1" ? (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            <span>Gallery updated successfully.</span>

            <Link
              href={`/${locale}/talent-dashboard/gallery`}
              className="text-[10px] uppercase tracking-[0.25em] text-emerald-200/70 transition hover:text-emerald-100"
            >
              Dismiss
            </Link>
          </div>
        ) : null}

        <section className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <h2 className="text-2xl font-light text-white">Upload Image</h2>

          <form
            action={addOwnGalleryImageAction}
            className="mt-5 flex flex-col gap-3 md:flex-row"
          >
            <input
              type="file"
              name="image_file"
              accept="image/*"
              required
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none file:mr-4 file:rounded-full file:border-0 file:bg-gold/[0.12] file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-[0.2em] file:text-gold focus:border-gold/40"
            />

            <button
              type="submit"
              className="rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
            >
              Upload
            </button>
          </form>
        </section>

        {galleryData.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">No images added yet.</p>
          </div>
        ) : (
          <GallerySortableList
            images={galleryData.map((image) => image.url)}
            mainImageUrl={talent.image_url}
            talentName={talent.name_en}
            reorderAction={reorderOwnGalleryImagesAction}
            setMainAction={setOwnMainImageAction}
            removeAction={removeOwnGalleryImageAction}
          />
        )}
      </div>
    </main>
  );
}