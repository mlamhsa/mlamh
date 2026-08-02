import Link from "next/link";
import { ApplicationService } from "@/lib/services/applications/ApplicationService";
import {
  acceptApplicationAction,
  rejectAdminApplicationAction,
  shortlistApplicationAction,
} from "@/lib/actions/admin-application-actions";
import {
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminGrid,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

export const metadata = {
  title: "Opportunity Applications — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(status?: string | null) {
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

function buildHref(status?: string, q?: string) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);

  const query = params.toString();
  return query ? `/admin/opportunity-applications?${query}` : "/admin/opportunity-applications";
}

export default async function AdminOpportunityApplicationsPage({
  searchParams,
}: PageProps) {
  type AdminApplicationOpportunity = {
    title: string | null;
    opportunity_type: string | null;
    city_ar: string | null;
    slug: string | null;
  };
  
  type AdminApplicationTalent = {
    name_en: string | null;
    name_ar: string | null;
    image_url: string | null;
    city_ar: string | null;
    gender: string | null;
    slug: string | null;
  };
  
  type AdminApplication = {
    id: string | number;
    status: string | null;
    created_at: string | null;
    opportunities:
      | AdminApplicationOpportunity
      | AdminApplicationOpportunity[]
      | null;
    talents:
      | AdminApplicationTalent
      | AdminApplicationTalent[]
      | null;
  };
  const { status, q } = await searchParams;

  const applications =
  (await ApplicationService.getAdminApplications({
    status,
    search: q,
  })) as AdminApplication[];
  
  const stats = {
    total: applications.length,
    pending: applications.filter(
      (item) => (item.status || "pending") === "pending",
    ).length,
    shortlisted: applications.filter(
      (item) => item.status === "shortlisted",
    ).length,
    accepted: applications.filter(
      (item) => item.status === "accepted",
    ).length,
    rejected: applications.filter(
      (item) => item.status === "rejected",
    ).length,
  };

  return (
    <AdminPageContainer>
        <AdminPageHeader
  title="Opportunity Applications"
  description="Review, shortlist, accept, and reject talent applications."
/>

<AdminGrid className="mb-8 md:grid-cols-5">
        <AdminStatCard label="Total" value={stats.total} active={!status} href="/admin/opportunity-applications" />
        <AdminStatCard label="Pending" value={stats.pending} active={status === "pending"} href={buildHref("pending", q)} />
        <AdminStatCard label="Shortlisted" value={stats.shortlisted} active={status === "shortlisted"} href={buildHref("shortlisted", q)} />
        <AdminStatCard label="Accepted" value={stats.accepted} active={status === "accepted"} href={buildHref("accepted", q)} />
        <AdminStatCard label="Rejected" value={stats.rejected} active={status === "rejected"} href={buildHref("rejected", q)} />
        </AdminGrid>

        <form
          method="GET"
          className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search talent, opportunity, or city..."
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
            />

            <select
              name="status"
              defaultValue={status ?? ""}
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="submit"
              className="rounded-2xl border border-gold/40 px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              Search
            </button>
          </div>
        </form>

        {applications.length === 0 ? (
          <AdminEmptyState message="No opportunity applications found." />
        ) : (
          <AdminGrid>
            {applications.map((application) => {
              const opportunity = Array.isArray(application.opportunities)
                ? application.opportunities[0]
                : application.opportunities;

              const talent = Array.isArray(application.talents)
                ? application.talents[0]
                : application.talents;

              const currentStatus = application.status || "pending";

              return (
                <AdminCard key={application.id}>
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

                          <AdminBadge
  variant={
    currentStatus === "accepted"
      ? "success"
      : currentStatus === "rejected"
      ? "danger"
      : "gold"
  }
>
  {getStatusLabel(currentStatus)}
</AdminBadge>
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

                  <AdminInfoGrid>
  <AdminInfoItem
    label="Opportunity"
    value={opportunity?.title}
  />

  <AdminInfoItem
    label="Type"
    value={opportunity?.opportunity_type}
  />

  <AdminInfoItem
    label="City"
    value={opportunity?.city_ar}
  />

  <AdminInfoItem
    label="Status"
    value={getStatusLabel(currentStatus)}
  />
</AdminInfoGrid>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/admin/opportunity-applications/${application.id}`}
                      className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      Open Application
                    </Link>

                    {opportunity?.slug ? (
                      <Link
                        href={`/ar/opportunities/${opportunity.slug}`}
                        target="_blank"
                        className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                      >
                        View Opportunity
                      </Link>
                    ) : null}

                    {talent?.slug ? (
                      <Link
                        href={`/ar/talent/${talent.slug}`}
                        target="_blank"
                        className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                      >
                        View Talent
                      </Link>
                    ) : null}

                    {currentStatus !== "shortlisted" ? (
                      <form action={shortlistApplicationAction}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-blue-500/30 bg-blue-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-blue-300 transition hover:bg-blue-500/10"
                        >
                          Shortlist
                        </button>
                      </form>
                    ) : null}

                    {currentStatus !== "accepted" ? (
                      <form action={acceptApplicationAction}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-emerald-300 transition hover:bg-emerald-500/10"
                        >
                          Accept
                        </button>
                      </form>
                    ) : null}

                    {currentStatus !== "rejected" ? (
                      <form action={rejectAdminApplicationAction}>
                        <input type="hidden" name="application_id" value={application.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-500/30 bg-red-500/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-red-300 transition hover:bg-red-500/10"
                        >
                          Reject
                        </button>
                      </form>
                    ) : null}
                  </div>
                  </AdminCard>
              );
            })}
          </AdminGrid>
        )}
      </AdminPageContainer>
  );
}