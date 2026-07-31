import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Opportunity Details — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function publishOpportunityAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id) return;

  const adminClient = createAdminClient();

  await adminClient
    .from("opportunities")
    .update({ published: true, status: "published" })
    .eq("id", id);

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/admin/opportunities");
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
}

async function hideOpportunityAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id) return;

  const adminClient = createAdminClient();

  await adminClient
    .from("opportunities")
    .update({ published: false, status: "draft" })
    .eq("id", id);

  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/admin/opportunities");
  revalidatePath("/ar/opportunities");
  revalidatePath("/en/opportunities");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status?: string | null, published?: boolean) {
  if (published) return "Published";

  switch (status) {
    case "pending_review":
      return "Pending Review";

    case "closed":
      return "Closed";

    case "archived":
      return "Archived";

    case "draft":
      return "Draft";

    case "needs_changes":
      return "Needs Changes";

    case "rejected":
      return "Rejected";

    case "published":
      return "Published";

    default:
      return "Pending Review";
  }
}

function statusClass(status?: string | null, published?: boolean) {
  if (published) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  switch (status) {
    case "pending_review":
      return "border-gold/30 bg-gold/10 text-gold";

    case "closed":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    case "archived":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "needs_changes":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";

    case "rejected":
      return "border-red-600/30 bg-red-600/10 text-red-400";

    default:
      return "border-gold/30 bg-gold/10 text-gold";
  }
}

export default async function AdminOpportunityDetailsPage({ params }: PageProps) {
  await requireAdminAccess();

  const { id } = await params;
  const opportunityId = Number(id);

  if (!opportunityId) {
    notFound();
  }

  const adminClient = createAdminClient();

  const { data: opportunity, error } = await adminClient
    .from("opportunities")
    .select(
      `
      id,
      title,
      slug,
      description,
      opportunity_type,
      city_ar,
      city_en,
      required_gender,
      min_age,
      max_age,
      budget,
      company_name,
      contact_name,
      contact_phone,
      contact_email,
      status,
      published,
      expires_at,
      created_at,
      updated_at
      `
    )
    .eq("id", opportunityId)
    .maybeSingle();

  if (error) {
    throw new Error(`[AdminOpportunityDetailsPage] ${error.message}`);
  }

  if (!opportunity) {
    notFound();
  }

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(
      `
      id,
      status,
      created_at,
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
    .eq("opportunity_id", opportunity.id)
    .order("created_at", { ascending: false });

  const applicationList = applications ?? [];

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
              Opportunity Details
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Review all opportunity data, publishing state, and applicants.
            </p>
          </div>

          <Link
            href="/admin/opportunities"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Opportunities
          </Link>
        </header>

        <section className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusClass(
                    opportunity.status,
                    opportunity.published
                  )}`}
                >
                  {statusLabel(opportunity.status, opportunity.published)}
                </span>

                <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                  Opportunity #{opportunity.id}
                </span>
              </div>

              <h2 className="text-3xl font-light text-white">
                {opportunity.title || "Untitled Opportunity"}
              </h2>

              <p className="mt-4 max-w-4xl text-sm leading-7 text-gray-muted">
                {opportunity.description || "—"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              {opportunity.slug ? (
                <Link
                  href={`/ar/opportunities/${opportunity.slug}`}
                  target="_blank"
                  className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                >
                  View Public
                </Link>
              ) : null}

              {!opportunity.published ? (
                <form action={publishOpportunityAction}>
                  <input type="hidden" name="id" value={opportunity.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/10"
                  >
                    Publish
                  </button>
                </form>
              ) : (
                <form action={hideOpportunityAction}>
                  <input type="hidden" name="id" value={opportunity.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-yellow-500/30 bg-yellow-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-yellow-300 transition hover:bg-yellow-500/10"
                  >
                    Hide
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h3 className="mb-6 text-xl font-light text-white">
              Opportunity Information
            </h3>

            <div className="grid gap-4 text-sm md:grid-cols-2">
              <InfoBlock label="Type" value={opportunity.opportunity_type} />
              <InfoBlock label="City AR" value={opportunity.city_ar} />
              <InfoBlock label="City EN" value={opportunity.city_en} />
              <InfoBlock label="Budget" value={opportunity.budget} />
              <InfoBlock label="Required Gender" value={opportunity.required_gender} />
              <InfoBlock
                label="Age Range"
                value={
                  opportunity.min_age || opportunity.max_age
                    ? `${opportunity.min_age ?? "—"} - ${opportunity.max_age ?? "—"}`
                    : "—"
                }
              />
              <InfoBlock label="Expires At" value={formatDate(opportunity.expires_at)} />
              <InfoBlock label="Created At" value={formatDate(opportunity.created_at)} />
              <InfoBlock label="Updated At" value={formatDate(opportunity.updated_at)} />
              <InfoBlock
                label="Published"
                value={opportunity.published ? "Yes" : "No"}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
            <h3 className="mb-6 text-xl font-light text-white">
              Publisher / Company
            </h3>

            <div className="grid gap-4 text-sm">
              <InfoBlock label="Company Name" value={opportunity.company_name} />
              <InfoBlock label="Contact Name" value={opportunity.contact_name} />
              <InfoBlock label="Contact Phone" value={opportunity.contact_phone} />
              <InfoBlock label="Contact Email" value={opportunity.contact_email} />
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-light text-white">
                Applications
              </h3>
              <p className="mt-1 text-sm text-gray-muted">
                {applicationList.length} applicants for this opportunity.
              </p>
            </div>

            <Link
              href="/admin/opportunity-applications"
              className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              View All Applications
            </Link>
          </div>

          {applicationList.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-black/10 px-6 py-12 text-center">
              <p className="text-sm text-gray-muted">
                No applications for this opportunity yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {applicationList.map((application: any) => {
                const talent = Array.isArray(application.talents)
                  ? application.talents[0]
                  : application.talents;

                return (
                  <article
                    key={application.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-black/10 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      {talent?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.image_url}
                          alt={talent.name_en || "Talent"}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl border border-white/10 bg-black/30" />
                      )}

                      <div>
                        <p className="text-white">
                          {talent?.name_ar || talent?.name_en || "Unnamed Talent"}
                        </p>

                        <p className="mt-1 text-xs text-gray-muted">
                          {talent?.city_ar || "—"} · {talent?.gender || "—"} · Applied{" "}
                          {formatDate(application.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
                        {application.status || "pending"}
                      </span>

                      {talent?.slug ? (
                        <Link
                          href={`/ar/talent/${talent.slug}`}
                          target="_blank"
                          className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                        >
                          View Talent
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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