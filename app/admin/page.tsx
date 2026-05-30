import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminTalentAnalytics } from "@/components/admin/AdminTalentAnalytics";
import { AdminTalentSearch } from "@/components/admin/AdminTalentSearch";
import { PendingTalentCard } from "@/components/admin/PendingTalentCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTopViewedTalents } from "@/lib/supabase/admin-talent-analytics";
import { getAdminTalents } from "@/lib/supabase/admin-talents";
import { getAdminTalentStats } from "@/lib/supabase/admin-talent-stats";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "MLAMH Admin — Talents",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 12;

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
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

function buildQueryString({
  status,
  q,
  page,
}: {
  status?: string;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/admin?${query}` : "/admin";
}

function StatLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border px-5 py-4 transition ${
        active
          ? "border-gold/40 bg-gold/[0.06]"
          : "border-white/[0.08] bg-gray-elevated/30 hover:border-gold/20"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gray-muted">
        {label}
      </p>

      <p className="mt-2 text-3xl font-light text-white">{count}</p>
    </Link>
  );
}

function Pagination({
  currentPage,
  totalPages,
  status,
  q,
}: {
  currentPage: number;
  totalPages: number;
  status?: string;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <Link
        href={buildQueryString({
          status,
          q,
          page: Math.max(1, currentPage - 1),
        })}
        className={`rounded-full border px-5 py-2 text-sm transition ${
          currentPage === 1
            ? "pointer-events-none border-white/5 text-white/20"
            : "border-white/10 text-white/70 hover:border-gold/30 hover:text-gold"
        }`}
      >
        Previous
      </Link>

      <div className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/70">
        Page {currentPage} of {totalPages}
      </div>

      <Link
        href={buildQueryString({
          status,
          q,
          page: Math.min(totalPages, currentPage + 1),
        })}
        className={`rounded-full border px-5 py-2 text-sm transition ${
          currentPage >= totalPages
            ? "pointer-events-none border-white/5 text-white/20"
            : "border-white/10 text-white/70 hover:border-gold/30 hover:text-gold"
        }`}
      >
        Next
      </Link>
    </div>
  );
}

export default async function AdminPage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const { status, q, page } = await searchParams;

  const currentPage = Math.max(1, Number(page) || 1);

  const activeStatus =
    status === "pending" ||
    status === "approved" ||
    status === "rejected"
      ? status
      : undefined;

  let result;
  let stats;
  let topViewedTalents;

  try {
    [result, stats, topViewedTalents] = await Promise.all([
      getAdminTalents({
        page: currentPage,
        pageSize: PAGE_SIZE,
        status: activeStatus,
        search: q,
      }),
      getAdminTalentStats(),
      getTopViewedTalents(5),
    ]);
  } catch (error) {
    console.error("Failed to load talents:", error);

    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h1 className="text-lg font-medium text-red-400">
            Failed to load dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Could not fetch talents from Supabase.
          </p>
        </div>
      </main>
    );
  }

  const { talents, total, totalPages } = result;
  const { total: totalTalents, pending, approved, rejected } = stats;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-white">
      <header className="mb-10 flex flex-col gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gold">
            MLAMH ADMIN
          </p>

          <h1
            className="mt-3 text-3xl font-light tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Talent Management Dashboard
          </h1>

          <p className="mt-3 max-w-xl text-sm text-gray-muted">
            Review, approve, reject, and edit all talent profiles from one
            secure admin workspace.
          </p>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/requests"
              className="rounded-full border border-white/10 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Talent Requests
            </Link>

            <Link
              href="/admin/claim-requests"
              className="rounded-full border border-white/10 px-5 py-2 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
            >
              Claim Requests
            </Link>

            <AdminLogoutButton />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatLink
              href={buildQueryString({ q })}
              label="All"
              count={totalTalents}
              active={!activeStatus}
            />

            <StatLink
              href={buildQueryString({ status: "pending", q })}
              label="Pending"
              count={pending}
              active={activeStatus === "pending"}
            />

            <StatLink
              href={buildQueryString({ status: "approved", q })}
              label="Approved"
              count={approved}
              active={activeStatus === "approved"}
            />

            <StatLink
              href={buildQueryString({ status: "rejected", q })}
              label="Rejected"
              count={rejected}
              active={activeStatus === "rejected"}
            />
          </div>
        </div>
      </header>

      <AdminTalentAnalytics topViewedTalents={topViewedTalents} />

      <AdminTalentSearch />

      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-white">Talent Profiles</h2>

            <p className="mt-1 text-sm text-gray-muted">
              Showing paginated admin results.
            </p>
          </div>

          <p className="text-sm text-gray-muted">{total} total profiles</p>
        </div>

        {talents.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-gray-elevated/30 px-6 py-16 text-center">
            <p className="text-sm text-gray-muted">No talents found.</p>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-6">
              {talents.map((talent) => (
                <li key={talent.id}>
                  <PendingTalentCard talent={talent} />
                </li>
              ))}
            </ul>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              status={activeStatus}
              q={q}
            />
          </>
        )}
      </section>
    </main>
  );
}