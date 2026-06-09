import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  approveApplicationAction,
  rejectApplicationAction,
} from "./actions";

export const metadata = {
  title: "Opportunity Applications — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ApplicationRecord = {
  id: number;
  status: string | null;
  created_at: string | null;
  opportunities:
    | {
        id: number;
        title: string;
        slug: string;
        city_ar: string | null;
        opportunity_type: string | null;
      }
    | {
        id: number;
        title: string;
        slug: string;
        city_ar: string | null;
        opportunity_type: string | null;
      }[]
    | null;
  talents:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
        image_url: string | null;
        city_ar: string | null;
        gender: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
        image_url: string | null;
        city_ar: string | null;
        gender: string | null;
      }[]
    | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "accepted":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "rejected":
      return "border-red-500/20 bg-red-500/10 text-red-300";
    default:
      return "border-gold/30 bg-gold/10 text-gold";
  }
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

export default async function AdminOpportunityApplicationsPage() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
      opportunities (
        id,
        title,
        slug,
        city_ar,
        opportunity_type
      ),
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender
      )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[AdminOpportunityApplicationsPage] ${error.message}`);
  }

  const applications = (data ?? []) as unknown as ApplicationRecord[];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH ADMIN
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Opportunity Applications
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Review talents who applied to published opportunities.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Admin
          </Link>
        </header>

        {applications.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">
              No opportunity applications yet.
            </p>
          </div>
        ) : (
          <section className="grid gap-5">
            {applications.map((application) => {
              const opportunity = Array.isArray(application.opportunities)
                ? application.opportunities[0]
                : application.opportunities;

              const talent = Array.isArray(application.talents)
                ? application.talents[0]
                : application.talents;

              const status = application.status || "pending";

              return (
                <article
                  key={application.id}
                  className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6 transition hover:border-white/15"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-5">
                      {talent?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.image_url}
                          alt={talent.name_en || "Talent"}
                          className="h-24 w-24 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-2xl border border-white/10 bg-black/20" />
                      )}

                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                            Application #{application.id}
                          </p>

                          <span
                            className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getStatusClass(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <h2 className="text-2xl font-light text-white">
                          {talent?.name_ar || talent?.name_en || "Unnamed Talent"}
                        </h2>

                        <p className="mt-1 text-sm text-white/50">
                          {talent?.city_ar || "—"} · {talent?.gender || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                        Applied
                      </p>

                      <p className="mt-1 text-sm text-gray-muted">
                        {formatDate(application.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 rounded-2xl border border-white/[0.06] bg-black/10 p-5 text-sm md:grid-cols-4">
                    <InfoBlock label="Opportunity" value={opportunity?.title} />
                    <InfoBlock label="Type" value={opportunity?.opportunity_type} />
                    <InfoBlock label="City" value={opportunity?.city_ar} />
                    <InfoBlock label="Status" value={getStatusLabel(status)} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {opportunity?.slug ? (
                      <Link
                        href={`/ar/opportunities/${opportunity.slug}`}
                        className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                      >
                        View Opportunity
                      </Link>
                    ) : null}

                    {talent?.slug ? (
                      <Link
                        href={`/ar/talent/${talent.slug}`}
                        className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        View Talent
                      </Link>
                    ) : null}

                    {status !== "accepted" ? (
                      <form action={approveApplicationAction}>
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <button
                          type="submit"
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/10"
                        >
                          Approve
                        </button>
                      </form>
                    ) : null}

                    {status !== "rejected" ? (
                      <form action={rejectApplicationAction}>
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <button
                          type="submit"
                          className="rounded-full border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/10"
                        >
                          Reject
                        </button>
                      </form>
                    ) : null}
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

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-1 text-white/80">{value || "—"}</p>
    </div>
  );
}