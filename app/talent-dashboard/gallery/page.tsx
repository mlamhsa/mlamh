import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addOwnGalleryImageAction,
  removeOwnGalleryImageAction,
  setOwnMainImageAction,
} from "@/lib/actions/update-own-talent-gallery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeGalleryImages } from "@/lib/utils/talent-gallery";

export const metadata = {
  title: "My Gallery — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    updated?: string;
  }>;
};

export default async function TalentGalleryPage({ searchParams }: PageProps) {
  const { updated } = await searchParams;

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, slug, name_en, image_url, gallery_images")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    redirect("/talent-dashboard");
  }

  const gallery = normalizeGalleryImages(talent.gallery_images);
  const allImages = Array.from(
    new Set([talent.image_url, ...gallery].filter(Boolean) as string[])
  );

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
              Manage your profile images. Upload support will be added later;
              for now, add image URLs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/talent-dashboard/profile"
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Edit Profile
            </Link>

            <Link
              href="/talent-dashboard"
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Back to Dashboard
            </Link>
          </div>
        </header>

        {updated === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Gallery updated successfully.
          </div>
        ) : null}

        <section className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <h2 className="text-2xl font-light text-white">Add Image URL</h2>

          <form action={addOwnGalleryImageAction} className="mt-5 flex gap-3">
            <input
              name="image_url"
              required
              placeholder="https://example.com/image.jpg"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
            />

            <button
              type="submit"
              className="rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
            >
              Add
            </button>
          </form>
        </section>

        {allImages.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">
              No images added yet.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-3">
            {allImages.map((imageUrl) => {
              const isMain = imageUrl === talent.image_url;

              return (
                <article
                  key={imageUrl}
                  className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gray-elevated/30"
                >
                  <div className="relative aspect-[3/4] bg-black">
                    <Image
                      src={imageUrl}
                      alt={talent.name_en || "Talent image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />

                    {isMain ? (
                      <div className="absolute left-4 top-4 rounded-full border border-gold/30 bg-black/50 px-3 py-1 text-[9px] uppercase tracking-[0.25em] text-gold backdrop-blur">
                        Main Image
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 p-4">
                    {!isMain ? (
                      <form action={setOwnMainImageAction}>
                        <input
                          type="hidden"
                          name="image_url"
                          value={imageUrl}
                        />

                        <button
                          type="submit"
                          className="rounded-full border border-gold/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold transition hover:bg-gold/10"
                        >
                          Set Main
                        </button>
                      </form>
                    ) : null}

                    <form action={removeOwnGalleryImageAction}>
                      <input
                        type="hidden"
                        name="image_url"
                        value={imageUrl}
                      />

                      <button
                        type="submit"
                        className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-red-400 transition hover:bg-red-950/30"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}