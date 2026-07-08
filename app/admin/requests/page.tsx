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
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { updateTalentRequestStatusAction } from "@/lib/actions/update-talent-request-status";
import { TalentRequestService } from "@/lib/services/requests/TalentRequestService";

export const metadata = {
  title: "MLAMH Admin — Requests",
  robots: { index: false, follow: false },
};

function normalizeTalent(
  value:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        slug: string | null;
      }[]
    | null
) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusVariant(status: string) {
  switch (status) {
    case "closed":
      return "success";
    case "contacted":
      return "gold";
    default:
      return "info";
  }
}

export default async function AdminRequestsPage() {
  await requireAdminAccess();

  const requests = await TalentRequestService.getAll();

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Talent Requests"
        description="Review incoming client requests and follow up with potential leads."
      />

      {requests.length === 0 ? (
        <AdminEmptyState message="No talent requests yet." />
      ) : (
        <AdminGrid>
          {requests.map((request) => {
            const talent = normalizeTalent(request.talents);

            return (
              <AdminCard key={request.id}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        Request #{request.id}
                      </p>

                      <AdminBadge variant={getStatusVariant(request.status)}>
                        {request.status}
                      </AdminBadge>
                    </div>

                    <h2 className="mt-2 text-2xl font-light text-white">
                      {request.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {request.company || "No company"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-muted">
                    {formatDate(request.created_at)}
                  </p>
                </div>

                <AdminInfoGrid columns={2}>
                  <AdminInfoItem
                    label="Talent"
                    value={
                      talent
                        ? `${talent.name_en || "Unnamed"} / ${
                            talent.name_ar || "—"
                          }`
                        : "—"
                    }
                  />

                  <AdminInfoItem label="Email" value={request.email} />

                  <AdminInfoItem label="Phone" value={request.phone || "—"} />

                  <AdminInfoItem
                    label="Project Type"
                    value={request.project_type || "—"}
                  />

                  <AdminInfoItem label="Budget" value={request.budget || "—"} />

                  <AdminInfoItem
                    label="Project Date"
                    value={request.project_date || "—"}
                  />

                  <div className="md:col-span-2">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Details
                    </p>

                    <p className="mt-1 whitespace-pre-line text-white/80">
                      {request.project_details || "—"}
                    </p>
                  </div>
                </AdminInfoGrid>

                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="new" />

                    <AdminActionButton type="submit" variant="info">
                      New
                    </AdminActionButton>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="contacted" />

                    <AdminActionButton type="submit" variant="gold">
                      Contacted
                    </AdminActionButton>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="closed" />

                    <AdminActionButton type="submit" variant="success">
                      Closed
                    </AdminActionButton>
                  </form>

                  {talent?.slug ? (
                    <Link
                      href={`/ar/talent/${talent.slug}`}
                      target="_blank"
                      className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      View Talent
                    </Link>
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