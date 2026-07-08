import {
  approveTalentClaimAction,
  rejectTalentClaimAction,
} from "@/lib/actions/admin-claim-requests";
import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageHeader,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { ClaimService } from "@/lib/services/claims/ClaimService";

export const metadata = {
  title: "MLAMH Admin — Claim Requests",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function normalizeTalent(
  value:
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        image_url: string | null;
      }
    | {
        id: number;
        name_en: string | null;
        name_ar: string | null;
        image_url: string | null;
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

function getBadgeVariant(status: string) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "gold";
  }
}

export default async function AdminClaimRequestsPage() {
  await requireAdminAccess();

  const requests = await ClaimService.getAll();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <AdminPageHeader
        title="Talent Claim Requests"
        description="Review talent ownership requests and connect existing profiles to talent accounts."
      />

      {!requests || requests.length === 0 ? (
        <AdminEmptyState message="No claim requests yet." />
      ) : (
        <section className="grid gap-5">
          {requests.map((request) => {
            const talent = normalizeTalent(request.talents);

            return (
              <AdminCard key={request.id}>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        Claim #{request.id}
                      </p>

                      <AdminBadge variant={getBadgeVariant(request.status)}>
                        {request.status}
                      </AdminBadge>
                    </div>

                    <h2 className="mt-2 text-2xl font-light text-white">
                      {talent?.name_en || "Unknown Talent"}
                    </h2>

                    <p
                      className="mt-1 text-lg text-white/50"
                      dir="rtl"
                      style={{ fontFamily: "var(--font-noto-arabic)" }}
                    >
                      {talent?.name_ar || "—"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-muted">
                    {formatDate(request.created_at)}
                  </p>
                </div>

                <AdminInfoGrid columns={2}>
                  <AdminInfoItem label="Talent ID" value={request.talent_id} />
                  <AdminInfoItem label="User ID" value={request.user_id} />
                </AdminInfoGrid>

                {request.status === "pending" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <form action={approveTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <AdminActionButton type="submit" variant="success">
                        Approve
                      </AdminActionButton>
                    </form>

                    <form action={rejectTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <AdminActionButton type="submit" variant="danger">
                        Reject
                      </AdminActionButton>
                    </form>
                  </div>
                ) : null}
              </AdminCard>
            );
          })}
        </section>
      )}
    </main>
  );
}