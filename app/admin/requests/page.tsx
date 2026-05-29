import Link from "next/link";
import { redirect } from "next/navigation";
import { updateTalentRequestStatusAction } from "@/lib/actions/update-talent-request-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminTalentRequests } from "@/lib/supabase/admin-talent-requests";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "MLAMH Admin — Requests",
  robots: { index: false, follow: false },
};

async function requireAdminAccess() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/admin-login");
  }

  const adminClient = createAdminClient();

  const { data: adminUser } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminUser) {
    redirect("/admin-login");
  }
}

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

function getStatusClasses(status: string) {
  switch (status) {
    case "closed":
      return "bg-emerald-500/10 text-emerald-400";

    case "contacted":
      return "bg-gold/10 text-gold";

    default:
      return "bg-blue-500/10 text-blue-400";
  }
}

export default async function AdminRequestsPage() {
  await requireAdminAccess();

  const requests = await getAdminTalentRequests();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-white">
      <header className="mb-10 flex flex-col gap-4 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            MLAMH ADMIN
          </p>

          <h1
            className="mt-3 text-3xl font-light tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Talent Requests
          </h1>

          <p className="mt-3 max-w-xl text-sm text-gray-muted">
            Review incoming client requests and follow up with potential leads.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-full border border-white/10 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
        >
          Back to Dashboard
        </Link>
      </header>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-gray-elevated/30 px-6 py-16 text-center">
          <p className="text-sm text-gray-muted">No talent requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {requests.map((request) => {
            const talent = normalizeTalent(request.talents);

            return (
              <article
                key={request.id}
                className="rounded-2xl border border-white/[0.08] bg-gray-elevated/40 p-6"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        Request #{request.id}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getStatusClasses(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
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

                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Talent
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {talent
                        ? `${talent.name_en || "Unnamed"} / ${
                            talent.name_ar || "—"
                          }`
                        : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Email
                    </dt>

                    <dd className="mt-1 text-white/80">
                      <a
                        href={`mailto:${request.email}`}
                        className="text-gold hover:text-gold-soft"
                      >
                        {request.email}
                      </a>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Phone
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {request.phone || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Project Type
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {request.project_type || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Budget
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {request.budget || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Project Date
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {request.project_date || "—"}
                    </dd>
                  </div>

                  <div className="md:col-span-2">
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Details
                    </dt>

                    <dd className="mt-1 whitespace-pre-line text-white/80">
                      {request.project_details || "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="new" />

                    <button
                      type="submit"
                      className="rounded-full border border-blue-500/30 bg-blue-950/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-400"
                    >
                      New
                    </button>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="contacted" />

                    <button
                      type="submit"
                      className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold"
                    >
                      Contacted
                    </button>
                  </form>

                  <form action={updateTalentRequestStatusAction}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="closed" />

                    <button
                      type="submit"
                      className="rounded-full border border-emerald-500/30 bg-emerald-950/20 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-400"
                    >
                      Closed
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}