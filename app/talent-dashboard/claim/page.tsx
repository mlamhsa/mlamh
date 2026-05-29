import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { submitTalentClaimAction } from "@/lib/actions/claim-talent-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Claim Profile — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    submitted?: string;
  }>;
};

export default async function TalentClaimProfilePage({
  searchParams,
}: PageProps) {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const { q, submitted } = await searchParams;
  const search = q?.trim() ?? "";

  const adminClient = createAdminClient();

  let query = adminClient
    .from("talents")
    .select(
      `
      id,
      name_en,
      name_ar,
      display_name_en,
      display_name_ar,
      category_en,
      category_ar,
      city_en,
      city_ar,
      image_url
      `
    )
    .is("user_id", null)
    .eq("published", true)
    .order("id", { ascending: false })
    .limit(24);

  if (search) {
    query = query.or(
      `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,display_name_en.ilike.%${search}%,display_name_ar.ilike.%${search}%`
    );
  }

  const { data: talents, error: talentsError } = await query;

  if (talentsError) {
    throw new Error(`[TalentClaimProfilePage] ${talentsError.message}`);
  }

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
              Claim Your Profile
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-muted">
              If your profile already exists on MLAMH, request ownership so you
              can manage it from your talent dashboard.
            </p>
          </div>

          <Link
            href="/talent-dashboard"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Dashboard
          </Link>
        </header>

        {submitted === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Claim request submitted. MLAMH admin will review it.
          </div>
        ) : null}

        <form action="/talent-dashboard/claim" className="mb-8 flex gap-3">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search your name..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
          />

          <button
            type="submit"
            className="rounded-xl border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.25em] text-gold"
          >
            Search
          </button>
        </form>

        {talents && talents.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {talents.map((talent) => (
              <article
                key={talent.id}
                className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gray-elevated/30"
              >
                <div className="relative aspect-[3/4] bg-black">
                  {talent.image_url ? (
                    <Image
                      src={talent.image_url}
                      alt={talent.name_en || "Talent image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-white/30">
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-2xl font-light text-white">
                    {talent.display_name_en || talent.name_en || "Unnamed"}
                  </h2>

                  <p
                    className="mt-1 text-lg text-white/50"
                    dir="rtl"
                    style={{ fontFamily: "var(--font-noto-arabic)" }}
                  >
                    {talent.display_name_ar || talent.name_ar || "—"}
                  </p>

                  <p className="mt-4 text-sm text-gray-muted">
                    {talent.category_en || "—"} · {talent.city_en || "—"}
                  </p>

                  <form action={submitTalentClaimAction} className="mt-5">
                    <input type="hidden" name="talent_id" value={talent.id} />

                    <button
                      type="submit"
                      className="w-full rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                    >
                      This is my profile
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">
              No unclaimed profiles found.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}