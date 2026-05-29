import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutTalentAction } from "@/lib/actions/talent-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Talent Dashboard — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function getAvailabilityLabel(status?: string | null) {
  switch (status) {
    case "available_now":
      return "Available Now";

    case "available_this_week":
      return "Available This Week";

    case "available_next_month":
      return "Available Next Month";

    case "unavailable":
      return "Unavailable";

    default:
      return "Not set";
  }
}

export default async function TalentDashboardPage() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: talentUser } = await adminClient
    .from("talent_users")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!talentUser) {
    await adminClient.from("talent_users").upsert({
      id: user.id,
      email: user.email,
      role: "talent",
    });
  }

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
      image_url,
      gallery_images,
      category_en,
      category_ar,
      city_en,
      city_ar,
      availability_status,
      verified,
      featured,
      published,
      status
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: views } = talent
    ? await adminClient
        .from("talent_views")
        .select("views")
        .eq("talent_id", talent.id)
        .maybeSingle()
    : { data: null };

  const { count: requestsCount } = talent
    ? await adminClient
        .from("talent_requests")
        .select("id", { count: "exact", head: true })
        .eq("talent_id", talent.id)
    : { count: 0 };

  const publicProfileHref = talent?.slug
    ? `/ar/talent/${talent.slug}`
    : talent?.id
      ? `/ar/talent/${talent.id}`
      : null;

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
              Talent Dashboard
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Manage your profile, availability, requests, and visibility.
            </p>
          </div>

          <form action={signOutTalentAction}>
            <button
              type="submit"
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Sign out
            </button>
          </form>
        </header>

        {!talent ? (
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
              Profile Setup
            </p>

            <h2 className="mt-3 text-3xl font-light text-white">
              Connect your talent profile
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-muted">
              Your account is ready, but no talent profile is linked to it yet.
              If your profile already exists on MLAMH, request ownership. If not,
              create a new profile for admin review.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/talent-dashboard/claim"
                className="inline-flex rounded-full border border-gold/40 bg-gold/[0.06] px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-gold transition hover:bg-gold/10"
              >
                Claim Existing Profile
              </Link>

              <Link
                href="/ar/join"
                className="inline-flex rounded-full border border-white/10 px-7 py-4 text-[10px] uppercase tracking-[0.35em] text-white/60 transition hover:border-gold/40 hover:text-gold"
              >
                Create New Profile
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-4">
              <DashboardCard
                label="Profile Status"
                value={talent.status || "pending"}
              />

              <DashboardCard
                label="Availability"
                value={getAvailabilityLabel(talent.availability_status)}
              />

              <DashboardCard
                label="Profile Views"
                value={String(views?.views ?? 0)}
              />

              <DashboardCard
                label="Requests"
                value={String(requestsCount ?? 0)}
              />
            </section>

            <section className="mt-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gold">
                    My Profile
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-light text-white">
                      {talent.display_name_en || talent.name_en || "Unnamed"}
                    </h2>

                    {talent.verified ? (
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                        Verified
                      </span>
                    ) : null}

                    {talent.featured ? (
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[9px] uppercase tracking-[0.2em] text-gold">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-gray-muted">
                    {talent.category_en || "—"} · {talent.city_en || "—"}
                  </p>

                  <p className="mt-2 text-sm text-gray-muted">
                    Published: {talent.published ? "Yes" : "No"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/admin/talents/${talent.id}/edit`}
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    Edit Profile
                  </Link>

                  {publicProfileHref ? (
                    <Link
                      href={publicProfileHref}
                      className="rounded-full border border-gold/40 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-gold transition hover:bg-gold/10"
                    >
                      View Public Profile
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function DashboardCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-muted">
        {label}
      </p>

      <p className="mt-3 text-2xl font-light text-white">{value}</p>
    </div>
  );
}