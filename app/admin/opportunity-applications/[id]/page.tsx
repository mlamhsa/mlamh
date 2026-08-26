import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  acceptApplicationAction,
  markPendingApplicationAction,
  shortlistApplicationAction,
} from "@/lib/actions/admin-application-actions";
export const metadata = {
  title: "Application Details — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status?: string | null) {
  switch (status) {
    case "shortlisted":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "accepted":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "rejected":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-gold/30 bg-gold/10 text-gold";
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "shortlisted":
      return "Shortlisted";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}

function getStatusAction(
  status: string,
) {
  switch (status) {
    case "pending":
      return markPendingApplicationAction;

    case "shortlisted":
      return shortlistApplicationAction;

    case "accepted":
      return acceptApplicationAction;

    default:
      return null;
  }
}

export default async function AdminApplicationDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const applicationId = Number(id);

  if (!applicationId) notFound();

  const adminClient = createAdminClient();

  const { data: application, error } = await adminClient
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
        description,
        company_name,
        city_ar,
        city_en,
        opportunity_type,
        budget,
        status
      ),
      talents (
        id,
        name_en,
        name_ar,
        slug,
        image_url,
        city_ar,
        gender,
        instagram,
        whatsapp
      )
      `
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new Error(`[AdminApplicationDetailsPage] ${error.message}`);
  }

  if (!application) notFound();

  const opportunity = Array.isArray(application.opportunities)
    ? application.opportunities[0]
    : application.opportunities;

  const talent = Array.isArray(application.talents)
    ? application.talents[0]
    : application.talents;

  const status = application.status || "pending";

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
              Application Details
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Review the applicant, opportunity, and application pipeline.
            </p>
          </div>

          <Link
            href="/admin/opportunity-applications"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Applications
          </Link>
        </header>

        <section className="mb-6 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-5">
              {talent?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={talent.image_url}
                  alt={talent.name_en || "Talent"}
                  className="h-28 w-28 rounded-3xl object-cover"
                />
              ) : (
                <div className="h-28 w-28 rounded-3xl border border-white/10 bg-black/20" />
              )}

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusClass(
                      status
                    )}`}
                  >
                    {statusLabel(status)}
                  </span>

                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Application #{application.id}
                  </span>
                </div>

                <h2 className="text-3xl font-light text-white">
                  {talent?.name_ar || talent?.name_en || "Unnamed Talent"}
                </h2>

                <p className="mt-2 text-sm text-white/50">
                  {talent?.city_ar || "—"} · {talent?.gender || "—"} · Applied{" "}
                  {formatDate(application.created_at)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {talent?.slug ? (
                <Link
                  href={`/ar/talent/${talent.slug}`}
                  target="_blank"
                  className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                >
                  View Talent
                </Link>
              ) : null}

              {opportunity?.slug ? (
                <Link
                  href={`/ar/opportunities/${opportunity.slug}`}
                  target="_blank"
                  className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                >
                  View Opportunity
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
  {["pending", "shortlisted", "accepted"].map(
    (nextStatus) => {
      const action =
        getStatusAction(nextStatus);

      if (!action) {
        return null;
      }

      const isCurrent =
        status === nextStatus;

      return (
        <form
          key={nextStatus}
          action={action}
        >
          <input
            type="hidden"
            name="application_id"
            value={application.id}
          />

          <input
            type="hidden"
            name="locale"
            value="ar"
          />

          <button
            type="submit"
            className={`rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.25em] transition ${
              isCurrent
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-white/10 text-white/60 hover:border-gold/40 hover:text-gold"
            }`}
          >
            {statusLabel(nextStatus)}
          </button>
        </form>
      );
    },
  )}

  <button
    type="button"
    disabled
    title="يجب إدخال سبب الرفض من شاشة المراجعة المعتمدة."
    className={`rounded-full border px-5 py-3 text-[10px] uppercase tracking-[0.25em] ${
      status === "rejected"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "cursor-not-allowed border-white/10 text-white/25"
    }`}
  >
    Rejected
  </button>
</div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h3 className="mb-6 text-xl font-light text-white">Talent</h3>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <InfoBlock label="Name EN" value={talent?.name_en} />
              <InfoBlock label="Name AR" value={talent?.name_ar} />
              <InfoBlock label="City" value={talent?.city_ar} />
              <InfoBlock label="Gender" value={talent?.gender} />
              <InfoBlock label="Instagram" value={talent?.instagram} />
              <InfoBlock label="WhatsApp" value={talent?.whatsapp} />
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h3 className="mb-6 text-xl font-light text-white">Opportunity</h3>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <InfoBlock label="Title" value={opportunity?.title} />
              <InfoBlock label="Company" value={opportunity?.company_name} />
              <InfoBlock label="Type" value={opportunity?.opportunity_type} />
              <InfoBlock label="City" value={opportunity?.city_ar || opportunity?.city_en} />
              <InfoBlock label="Budget" value={opportunity?.budget} />
              <InfoBlock label="Status" value={opportunity?.status} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-black/10 p-5">
              <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                Description
              </p>

              <p className="mt-2 text-sm leading-7 text-white/70">
                {opportunity?.description || "—"}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <h3 className="text-xl font-light text-white">Application Timeline</h3>

          <div className="mt-6 grid gap-4">
            <TimelineItem
              title="Application submitted"
              date={formatDate(application.created_at)}
              active
            />

            <TimelineItem
              title={`Current status: ${statusLabel(status)}`}
              date="Now"
              active
            />

            <TimelineItem
              title="Audit log and notes"
              date="Coming soon"
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4">
      <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-white/80">{value || "—"}</p>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  active = false,
}: {
  title: string;
  date: string;
  active?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div
        className={`mt-1 h-3 w-3 rounded-full ${
          active ? "bg-gold" : "bg-white/15"
        }`}
      />

      <div>
        <p className="text-sm text-white">{title}</p>
        <p className="mt-1 text-xs text-gray-muted">{date}</p>
      </div>
    </div>
  );
}