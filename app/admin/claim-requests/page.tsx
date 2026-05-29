import Link from "next/link";
import { redirect } from "next/navigation";
import {
  approveTalentClaimAction,
  rejectTalentClaimAction,
} from "@/lib/actions/admin-claim-requests";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "MLAMH Admin — Claim Requests",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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

  const { data: adminUser, error: adminError } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (adminError || !adminUser) {
    redirect("/admin-login");
  }
}

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

function getStatusClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-400";

    case "rejected":
      return "bg-red-500/10 text-red-400";

    default:
      return "bg-gold/10 text-gold";
  }
}

export default async function AdminClaimRequestsPage() {
  await requireAdminAccess();

  const supabase = createAdminClient();

  const { data: requests, error } = await supabase
    .from("talent_claim_requests")
    .select(
      `
      id,
      talent_id,
      user_id,
      status,
      created_at,
      talents (
        id,
        name_en,
        name_ar,
        image_url
      )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[AdminClaimRequestsPage] ${error.message}`);
  }

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
            Talent Claim Requests
          </h1>

          <p className="mt-3 max-w-xl text-sm text-gray-muted">
            Review talent ownership requests and connect existing profiles to
            talent accounts.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-full border border-white/10 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
        >
          Back to Dashboard
        </Link>
      </header>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-gray-elevated/30 px-6 py-16 text-center">
          <p className="text-sm text-gray-muted">No claim requests yet.</p>
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
                        Claim #{request.id}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
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

                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Talent ID
                    </dt>

                    <dd className="mt-1 text-white/80">
                      {request.talent_id}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      User ID
                    </dt>

                    <dd className="mt-1 break-all text-white/80">
                      {request.user_id}
                    </dd>
                  </div>
                </dl>

                {request.status === "pending" ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <form action={approveTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <button
                        type="submit"
                        className="rounded-full border border-emerald-500/40 bg-emerald-950/30 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-emerald-400 transition hover:bg-emerald-950/50"
                      >
                        Approve
                      </button>
                    </form>

                    <form action={rejectTalentClaimAction}>
                      <input type="hidden" name="id" value={request.id} />

                      <button
                        type="submit"
                        className="rounded-full border border-red-500/30 bg-red-950/20 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-950/40"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}