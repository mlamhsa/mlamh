import Link from "next/link";
import { redirect } from "next/navigation";
import { updateOwnTalentProfileAction } from "@/lib/actions/update-own-talent-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Edit My Profile — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    updated?: string;
  }>;
};

function Field({
  label,
  name,
  defaultValue,
  dir = "ltr",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  dir = "ltr",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </label>

      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        dir={dir}
        rows={5}
        className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
      />
    </div>
  );
}

export default async function TalentProfileEditorPage({
  searchParams,
}: PageProps) {
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
    .select(
      `
      id,
      slug,
      name_en,
      name_ar,
      display_name_en,
      display_name_ar,
      city_en,
      city_ar,
      bio_en,
      bio_ar,
      instagram,
      tiktok,
      snapchat,
      portfolio_url,
      availability_status
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    redirect("/talent-dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENT
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Edit My Profile
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              You can update profile details, availability, biography, and links.
            </p>
          </div>

          <Link
            href="/talent-dashboard"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Dashboard
          </Link>
        </header>

        {updated === "1" ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
            Profile updated successfully.
          </div>
        ) : null}

        <form
          action={updateOwnTalentProfileAction}
          className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6"
        >
          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Identity
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Public Name EN"
                name="readonly_display_name_en"
                defaultValue={talent.display_name_en || talent.name_en}
              />

              <Field
                label="Public Name AR"
                name="readonly_display_name_ar"
                defaultValue={talent.display_name_ar || talent.name_ar}
                dir="rtl"
              />
            </div>

            <p className="mt-4 text-xs leading-6 text-gray-muted">
              Public display name is managed by MLAMH to keep profile quality
              consistent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Availability
            </h2>

            <select
              name="availability_status"
              defaultValue={talent.availability_status ?? "available_now"}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/40"
            >
              <option value="available_now">Available Now</option>
              <option value="available_this_week">Available This Week</option>
              <option value="available_next_month">Available Next Month</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="City EN" name="city_en" defaultValue={talent.city_en} />
              <Field
                label="City AR"
                name="city_ar"
                defaultValue={talent.city_ar}
                dir="rtl"
              />

              <div className="md:col-span-2">
                <TextArea
                  label="Bio EN"
                  name="bio_en"
                  defaultValue={talent.bio_en}
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Bio AR"
                  name="bio_ar"
                  defaultValue={talent.bio_ar}
                  dir="rtl"
                />
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-gold">
              Links
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <Field
                label="Instagram"
                name="instagram"
                defaultValue={talent.instagram}
              />

              <Field label="TikTok" name="tiktok" defaultValue={talent.tiktok} />

              <Field
                label="Snapchat"
                name="snapchat"
                defaultValue={talent.snapchat}
              />

              <Field
                label="Portfolio URL"
                name="portfolio_url"
                defaultValue={talent.portfolio_url}
              />
            </div>
          </section>

          <div className="flex flex-wrap gap-3 border-t border-white/[0.08] pt-6">
            <button
              type="submit"
              className="rounded-full border border-gold/40 bg-gold/[0.06] px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
            >
              Save Changes
            </button>

            <Link
              href="/talent-dashboard"
              className="rounded-full border border-white/10 px-6 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-white/30 hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}