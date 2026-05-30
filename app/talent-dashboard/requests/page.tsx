import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Requests — MLAMH",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "closed":
      return "bg-emerald-500/10 text-emerald-400";
    case "contacted":
      return "bg-gold/10 text-gold";
    default:
      return "bg-blue-500/10 text-blue-400";
  }
}

export default async function TalentRequestsPage() {
  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    redirect("/talent-login");
  }

  const adminClient = createAdminClient();

  const { data: talent } = await adminClient
    .from("talents")
    .select("id, name_en")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    redirect("/talent-dashboard");
  }

  const { data: requests, error: requestsError } = await adminClient
    .from("talent_requests")
    .select(
      `
      id,
      full_name,
      company,
      email,
      phone,
      project_type,
      project_details,
      budget,
      project_date,
      status,
      created_at
      `
    )
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  if (requestsError) {
    throw new Error(`[TalentRequestsPage] ${requestsError.message}`);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
              MLAMH TALENT
            </p>

            <h1
              className="mt-3 text-4xl font-light tracking-tight text-white md:text-6xl"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              My Requests
            </h1>

            <p className="mt-3 text-sm text-gray-muted">
              Review incoming requests from companies, agencies, and production
              teams.
            </p>
          </div>

          <Link
            href="/talent-dashboard"
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            Back to Dashboard
          </Link>
        </header>

        {!requests || requests.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">
              No requests have been received yet.
            </p>
          </div>
        ) : (
          <section className="grid gap-5">
            {requests.map((request) => (
              <article
                key={request.id}
                className="rounded-3xl border border-white/[0.08] bg-gray-elevated/30 p-6"
              >
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
                        Request #{request.id}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {request.status || "new"}
                      </span>
                    </div>

                    <h2 className="mt-2 text-2xl font-light text-white">
                      {request.company || request.full_name}
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {request.project_type || "Project request"}
                    </p>
                  </div>

                  <p className="text-sm text-gray-muted">
                    {formatDate(request.created_at)}
                  </p>
                </div>

                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Contact Person
                    </dt>
                    <dd className="mt-1 text-white/80">
                      {request.full_name || "—"}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
                      Email
                    </dt>
                    <dd className="mt-1 text-white/80">
                      {request.email || "—"}
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
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}