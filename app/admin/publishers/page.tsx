import { revalidatePath } from "next/cache";
import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminInfoGrid,
  AdminInfoItem,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { PublisherService } from "@/lib/services/publishers/PublisherService";

export const metadata = {
  title: "Publishers — MLAMH Admin",
  robots: { index: false, follow: false },
};

async function approvePublisherAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id) return;

  await PublisherService.approve(id);

  revalidatePath("/admin/publishers");
}

async function unverifyPublisherAction(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id) return;

  await PublisherService.markPending(id);

  revalidatePath("/admin/publishers");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPublishersPage() {
  await requireAdminAccess();

  const publishers = await PublisherService.getAll();

  const approved = publishers.filter((item) => item.verified).length;
  const pending = publishers.filter((item) => !item.verified).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <AdminPageHeader
        title="Publisher Management"
        description="Review and approve companies, agencies, and production accounts."
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Total Publishers" value={publishers.length} />
        <AdminStatCard label="Pending Review" value={pending} />
        <AdminStatCard label="Approved" value={approved} />
      </section>

      {publishers.length === 0 ? (
        <AdminEmptyState message="No publishers found." />
      ) : (
        <section className="grid gap-5">
          {publishers.map((publisher) => (
            <AdminCard key={publisher.id}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <AdminBadge variant={publisher.verified ? "success" : "gold"}>
                      {publisher.verified ? "Approved" : "Pending"}
                    </AdminBadge>

                    <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                      Publisher #{publisher.id}
                    </span>
                  </div>

                  <h2 className="text-2xl font-light text-white">
                    {publisher.company_name ||
                      publisher.contact_name ||
                      "Unnamed Publisher"}
                  </h2>

                  <p className="mt-2 text-sm text-white/50">
                    {publisher.publisher_type || "—"} · {publisher.city || "—"}
                  </p>

                  <p className="mt-2 text-sm text-gray-muted">
                    Contact: {publisher.contact_name || "—"}
                  </p>
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                    Joined
                  </p>

                  <p className="mt-1 text-sm text-gray-muted">
                    {formatDate(publisher.created_at)}
                  </p>
                </div>
              </div>

              <AdminInfoGrid>
                <AdminInfoItem label="Website" value={publisher.website} />
                <AdminInfoItem label="Instagram" value={publisher.instagram} />
                <AdminInfoItem
                  label="Profile ID"
                  value={String(publisher.profile_id)}
                />
                <AdminInfoItem
                  label="Verification"
                  value={publisher.verified ? "Approved" : "Pending"}
                />
              </AdminInfoGrid>

              <div className="mt-6 flex flex-wrap gap-3">
                {!publisher.verified ? (
                  <form action={approvePublisherAction}>
                    <input type="hidden" name="id" value={publisher.id} />
                    <AdminActionButton type="submit" variant="success">
                      Approve
                    </AdminActionButton>
                  </form>
                ) : (
                  <form action={unverifyPublisherAction}>
                    <input type="hidden" name="id" value={publisher.id} />
                    <AdminActionButton type="submit" variant="warning">
                      Mark Pending
                    </AdminActionButton>
                  </form>
                )}

                {publisher.website ? (
                  <a
                    href={publisher.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                  >
                    Visit Website
                  </a>
                ) : null}
              </div>
            </AdminCard>
          ))}
        </section>
      )}
    </main>
  );
}