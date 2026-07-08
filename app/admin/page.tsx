import Link from "next/link";
import { AdminTalentAnalytics } from "@/components/admin/AdminTalentAnalytics";
import { AdminTalentSearch } from "@/components/admin/AdminTalentSearch";
import { PendingTalentCard } from "@/components/admin/PendingTalentCard";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { TalentService } from "@/lib/services/talents/TalentService";
import {
  AdminEmptyState,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";

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
      TalentService.getAdminTalents({
        page: currentPage,
        pageSize: PAGE_SIZE,
        status: activeStatus,
        search: q,
      }),
      TalentService.getAdminStats(),
      TalentService.getTopViewed(5),
    ]);
  } catch (error) {
    console.error("Failed to load talents:", error);

    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-6 py-12 text-white">
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
    <AdminPageContainer>
      <AdminPageHeader
        title="Talent Management"
        description="Review, approve, reject, and edit talent profiles."
      />
  
      <AdminGrid className="mb-8 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          href={buildQueryString({ q })}
          label="All"
          value={totalTalents}
          active={!activeStatus}
        />
  
        <AdminStatCard
          href={buildQueryString({ status: "pending", q })}
          label="Pending"
          value={pending}
          active={activeStatus === "pending"}
        />
  
        <AdminStatCard
          href={buildQueryString({ status: "approved", q })}
          label="Approved"
          value={approved}
          active={activeStatus === "approved"}
        />
  
        <AdminStatCard
          href={buildQueryString({ status: "rejected", q })}
          label="Rejected"
          value={rejected}
          active={activeStatus === "rejected"}
        />
      </AdminGrid>
  
      <AdminTalentAnalytics topViewedTalents={topViewedTalents} />
  
      <AdminTalentSearch />
  
      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-white">
              Talent Profiles
            </h2>
  
            <p className="mt-1 text-sm text-gray-muted">
              Showing paginated admin results.
            </p>
          </div>
  
          <p className="text-sm text-gray-muted">
            {total} total profiles
          </p>
        </div>
  
        {talents.length === 0 ? (
          <AdminEmptyState message="No talents found." />
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
    </AdminPageContainer>
  );
}