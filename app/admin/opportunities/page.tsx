import Link from "next/link";
import {
  AdminActionButton,
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
import { requireAdminAccess } from "@/lib/auth/require-admin";
import {
  archiveOpportunityAction,
  hideOpportunityAction,
  publishOpportunityAction,
  rejectOpportunityAction,
  requestChangesOpportunityAction,
} from "@/lib/actions/admin-opportunity-actions";
import { OpportunityService } from "@/lib/services/opportunities/OpportunityService";

export const metadata = {
  title: "Opportunities — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

type OpportunityStatus =
  | "published"
  | "pending_review"
  | "needs_changes"
  | "rejected"
  | "closed"
  | "archived"
  | "draft";

type OpportunityRow = {
  id: number;
  title: string | null;
  slug: string | null;
  description: string | null;
  opportunity_type: string | null;
  city_ar: string | null;
  city_en: string | null;
  required_gender: string | null;
  min_age: number | null;
  max_age: number | null;
  budget: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: OpportunityStatus | string | null;
  published: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusVariant(status?: string | null) {
  switch (status) {
    case "published":
      return "success";
    case "pending_review":
      return "gold";
    case "needs_changes":
      return "warning";
    case "rejected":
      return "danger";
    case "closed":
      return "warning";
    case "archived":
      return "muted";
    default:
      return "default";
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "published":
      return "Published";
    case "pending_review":
      return "Pending Review";
    case "needs_changes":
      return "Needs Changes";
    case "rejected":
      return "Rejected";
    case "closed":
      return "Closed";
    case "archived":
      return "Archived";
    case "draft":
      return "Draft";
    default:
      return status || "Unknown";
  }
}

function buildHref(status?: string, q?: string) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);

  const query = params.toString();

  return query ? `/admin/opportunities?${query}` : "/admin/opportunities";
}

function countByStatus(opportunities: OpportunityRow[], status: string) {
  return opportunities.filter((item) => item.status === status).length;
}

export default async function AdminOpportunitiesPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const { status, q } = await searchParams;

  const opportunities = (await OpportunityService.getAll({
    status,
    search: q,
  })) as OpportunityRow[];

  const total = opportunities.length;
  const pendingCount = countByStatus(opportunities, "pending_review");
  const publishedCount = countByStatus(opportunities, "published");
  const needsChangesCount = countByStatus(opportunities, "needs_changes");
  const rejectedCount = countByStatus(opportunities, "rejected");
  const closedCount = countByStatus(opportunities, "closed");
  const archivedCount = countByStatus(opportunities, "archived");

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Opportunity Management"
        description="Review, approve, publish, hide, and monitor all platform opportunities."
      />

      <AdminGrid className="mb-8 md:grid-cols-3 xl:grid-cols-7">
        <AdminStatCard
          label="All"
          value={total}
          active={!status}
          href="/admin/opportunities"
        />

        <AdminStatCard
          label="Pending"
          value={pendingCount}
          active={status === "pending"}
          href={buildHref("pending", q)}
        />

        <AdminStatCard
          label="Published"
          value={publishedCount}
          active={status === "published"}
          href={buildHref("published", q)}
        />

        <AdminStatCard
          label="Needs Changes"
          value={needsChangesCount}
          active={status === "needs_changes"}
          href={buildHref("needs_changes", q)}
        />

        <AdminStatCard
          label="Rejected"
          value={rejectedCount}
          active={status === "rejected"}
          href={buildHref("rejected", q)}
        />

        <AdminStatCard
          label="Closed"
          value={closedCount}
          active={status === "closed"}
          href={buildHref("closed", q)}
        />

        <AdminStatCard
          label="Archived"
          value={archivedCount}
          active={status === "archived"}
          href={buildHref("archived", q)}
        />
      </AdminGrid>

      <form
        method="GET"
        className="mb-8 rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-5"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search title, company, or city..."
            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30"
          />

          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="published">Published</option>
            <option value="needs_changes">Needs Changes</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>

          <button
            type="submit"
            className="rounded-2xl border border-gold/40 px-8 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
          >
            Search
          </button>
        </div>
      </form>

      {opportunities.length === 0 ? (
        <AdminEmptyState message="No opportunities found." />
      ) : (
        <AdminGrid>
          {opportunities.map((opportunity) => (
            <AdminCard key={opportunity.id}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <AdminBadge variant={getStatusVariant(opportunity.status)}>
                      {statusLabel(opportunity.status)}
                    </AdminBadge>

                    <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                      Opportunity #{opportunity.id}
                    </span>
                  </div>

                  <h2 className="text-2xl font-light text-white">
                    {opportunity.title || "Untitled Opportunity"}
                  </h2>

                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-7 text-gray-muted">
                    {opportunity.description || "—"}
                  </p>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Created
                  </p>

                  <p className="mt-1 text-sm text-gray-muted">
                    {formatDate(opportunity.created_at)}
                  </p>
                </div>
              </div>

              <AdminInfoGrid>
                <AdminInfoItem
                  label="Company"
                  value={opportunity.company_name}
                />

                <AdminInfoItem
                  label="Type"
                  value={opportunity.opportunity_type?.replaceAll("_", " ")}
                />

                <AdminInfoItem
                  label="City"
                  value={opportunity.city_en || opportunity.city_ar}
                />

                <AdminInfoItem label="Budget" value={opportunity.budget} />

                <AdminInfoItem
                  label="Gender"
                  value={opportunity.required_gender}
                />

                <AdminInfoItem
                  label="Age"
                  value={
                    opportunity.min_age || opportunity.max_age
                      ? `${opportunity.min_age ?? "—"} - ${
                          opportunity.max_age ?? "—"
                        }`
                      : "—"
                  }
                />

                <AdminInfoItem
                  label="Contact"
                  value={opportunity.contact_name}
                />

                <AdminInfoItem
                  label="Expires"
                  value={formatDate(opportunity.expires_at)}
                />
              </AdminInfoGrid>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/admin/opportunities/${opportunity.id}`}
                  className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/70 transition hover:border-gold/40 hover:text-gold"
                >
                  Admin Details
                </Link>

                {opportunity.slug ? (
                  <Link
                    href={`/ar/opportunities/${opportunity.slug}`}
                    target="_blank"
                    className="rounded-full border border-gold/30 bg-gold/[0.04] px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10"
                  >
                    View Public
                  </Link>
                ) : null}

                {opportunity.status !== "published" ? (
                  <form action={publishOpportunityAction}>
                    <input type="hidden" name="id" value={opportunity.id} />
                    <AdminActionButton type="submit" variant="success">
                      Approve & Publish
                    </AdminActionButton>
                  </form>
                ) : (
                  <form action={hideOpportunityAction}>
                    <input type="hidden" name="id" value={opportunity.id} />
                    <AdminActionButton type="submit" variant="warning">
                      Hide
                    </AdminActionButton>
                  </form>
                )}

                {opportunity.status !== "rejected" ? (
                  <form action={rejectOpportunityAction}>
                    <input type="hidden" name="id" value={opportunity.id} />
                    <AdminActionButton type="submit" variant="danger">
                      Reject
                    </AdminActionButton>
                  </form>
                ) : null}

                {opportunity.status !== "needs_changes" ? (
                  <form action={requestChangesOpportunityAction}>
                    <input type="hidden" name="id" value={opportunity.id} />
                    <AdminActionButton type="submit" variant="warning">
                      Request Changes
                    </AdminActionButton>
                  </form>
                ) : null}

                {opportunity.status !== "archived" ? (
                  <form action={archiveOpportunityAction}>
                    <input type="hidden" name="id" value={opportunity.id} />
                    <AdminActionButton type="submit" variant="muted">
                      Archive
                    </AdminActionButton>
                  </form>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </AdminGrid>
      )}
    </AdminPageContainer>
  );
}