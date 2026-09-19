import Link from "next/link";
import { AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  searchParams: Promise<{ lang?: string; status?: string }>;
};

type TicketRow = {
  id: number;
  ticket_number: string;
  sender_name: string;
  sender_email: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  last_message_at: string | null;
  created_at: string;
};

const statuses = ["new", "open", "in_progress", "pending_user", "resolved", "closed"] as const;

function formatDate(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(isArabic ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status: string, isArabic: boolean) {
  const labels: Record<string, [string, string]> = {
    new: ["جديدة", "New"],
    open: ["مفتوحة", "Open"],
    in_progress: ["قيد المعالجة", "In progress"],
    pending_user: ["بانتظار المستخدم", "Waiting for user"],
    resolved: ["تم الحل", "Resolved"],
    closed: ["مغلقة", "Closed"],
  };
  const label = labels[status];
  return label ? (isArabic ? label[0] : label[1]) : status;
}

function statusClass(status: string) {
  if (status === "new") return "border-gold/30 bg-gold/[0.09] text-gold";
  if (status === "open" || status === "in_progress") return "border-blue-400/25 bg-blue-400/[0.08] text-blue-300";
  if (status === "resolved") return "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300";
  if (status === "closed") return "border-white/10 bg-white/[0.04] text-white/35";
  return "border-amber-400/25 bg-amber-400/[0.08] text-amber-300";
}

export const metadata = {
  title: "Support — MLAMH Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSupportPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, status } = await searchParams;
  const locale = lang === "en" ? "en" : "ar";
  const isArabic = locale === "ar";
  const activeStatus = statuses.includes(status as (typeof statuses)[number]) ? status : "";
  const adminClient = createAdminClient();

  let ticketsQuery = adminClient
    .from("support_tickets")
    .select("id, ticket_number, sender_name, sender_email, category, subject, status, priority, last_message_at, created_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (activeStatus) ticketsQuery = ticketsQuery.eq("status", activeStatus);

  const [{ data: ticketData, error }, ...countResults] = await Promise.all([
    ticketsQuery,
    ...statuses.map((ticketStatus) =>
      adminClient
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", ticketStatus),
    ),
  ]);

  if (error) throw new Error(`Unable to load support tickets: ${error.message}`);

  const tickets = (ticketData ?? []) as TicketRow[];
  const counts = Object.fromEntries(
    statuses.map((ticketStatus, index) => [ticketStatus, countResults[index].count ?? 0]),
  ) as Record<(typeof statuses)[number], number>;

  const activeCount = counts.new + counts.open + counts.in_progress + counts.pending_user;

  return (
    <div dir={isArabic ? "rtl" : "ltr"}>
      <AdminPageContainer>
      <AdminPageHeader
        eyebrow={isArabic ? "التواصل" : "COMMUNICATIONS"}
        title={isArabic ? "الدعم" : "Support"}
        description={
          isArabic
            ? "صندوق موحّد لطلبات الدعم والاستفسارات والشكاوى والشراكات الواردة من المنصة."
            : "A unified inbox for support, inquiries, complaints, and partnership requests from the platform."
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AdminStatCard label={isArabic ? "قيد المتابعة" : "Active"} value={activeCount} active={activeCount > 0} />
        <AdminStatCard label={isArabic ? "جديدة" : "New"} value={counts.new} active={counts.new > 0} />
        <AdminStatCard label={isArabic ? "قيد المعالجة" : "In progress"} value={counts.in_progress} active={counts.in_progress > 0} />
        <AdminStatCard label={isArabic ? "تم الحل" : "Resolved"} value={counts.resolved} />
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <Filter href={`/admin/support?lang=${locale}`} active={!activeStatus} label={isArabic ? "الكل" : "All"} />
        {statuses.map((ticketStatus) => (
          <Filter
            key={ticketStatus}
            href={`/admin/support?lang=${locale}&status=${ticketStatus}`}
            active={activeStatus === ticketStatus}
            label={`${statusLabel(ticketStatus, isArabic)} · ${counts[ticketStatus]}`}
          />
        ))}
      </div>

      <section className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025] sm:rounded-[2rem]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <h2 className="text-base font-medium sm:text-lg">
            {isArabic ? `التذاكر (${tickets.length})` : `Tickets (${tickets.length})`}
          </h2>
        </div>

        {tickets.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/40">
            {isArabic ? "لا توجد تذاكر ضمن هذا التصنيف." : "No tickets in this view."}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}?lang=${locale}`}
                className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 sm:py-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono text-xs text-gold">{ticket.ticket_number}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] ${statusClass(ticket.status)}`}>
                      {statusLabel(ticket.status, isArabic)}
                    </span>
                    {ticket.priority === "high" || ticket.priority === "urgent" ? (
                      <span className="rounded-full border border-red-400/20 bg-red-400/[0.07] px-2.5 py-1 text-[9px] text-red-300">
                        {ticket.priority}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 truncate text-sm font-medium text-white/80 sm:text-base">{ticket.subject}</h3>
                  <p className="mt-1 truncate text-xs text-white/35">{ticket.sender_name} · {ticket.sender_email}</p>
                </div>

                <div className="text-xs text-white/30 sm:text-end">
                  <p>{formatDate(ticket.last_message_at || ticket.created_at, isArabic)}</p>
                  <p className="mt-1">{ticket.category}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      </AdminPageContainer>
    </div>
  );
}

function Filter({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${
        active
          ? "border-gold/30 bg-gold/[0.1] text-gold"
          : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-gold/20 hover:text-gold"
      }`}
    >
      {label}
    </Link>
  );
}
