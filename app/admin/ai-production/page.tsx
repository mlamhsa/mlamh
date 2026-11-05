import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight, ClipboardList, Clock3, Inbox, Sparkles } from "lucide-react";
import { AIRequestsLiveRefresh } from "@/components/admin/AIRequestsLiveRefresh";
import { AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "MLAMH AI Requests — Admin", robots: { index: false, follow: false } };
type PageProps = { searchParams: Promise<{ lang?: string; status?: string }> };
type Ticket = { id: number; ticket_number: string; sender_name: string; sender_email: string; sender_phone: string | null; status: string; created_at: string };
const activeStatuses = new Set(["new", "open", "in_progress", "pending_user"]);
const statuses: Record<string, { ar: string; en: string; style: string }> = {
  new: { ar: "جديد", en: "New", style: "border-amber-400/25 bg-amber-400/10 text-amber-300" },
  open: { ar: "مفتوح", en: "Open", style: "border-blue-400/25 bg-blue-400/10 text-blue-300" },
  in_progress: { ar: "قيد التنفيذ", en: "In progress", style: "border-blue-400/25 bg-blue-400/10 text-blue-300" },
  pending_user: { ar: "بانتظار العميل", en: "Waiting for client", style: "border-orange-400/25 bg-orange-400/10 text-orange-300" },
  resolved: { ar: "مكتمل", en: "Resolved", style: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  closed: { ar: "مغلق", en: "Closed", style: "border-white/10 bg-white/5 text-white/50" },
};
function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Inbox }) {
  return <div className="rounded-2xl border border-white/[.085] bg-white/[.025] p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3"><span className="text-xs text-white/45 sm:text-sm">{label}</span><Icon className="h-4 w-4 shrink-0 text-[#c5a468]" aria-hidden="true" /></div>
    <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
  </div>;
}
export default async function AIProductionAdminPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, status } = await searchParams;
  const ar = lang !== "en";
  const filter = status === "active" || status === "closed" ? status : "all";
  const admin = createAdminClient();
  const { data, error } = await admin.from("support_tickets")
    .select("id,ticket_number,sender_name,sender_email,sender_phone,status,created_at")
    .eq("subject", "MLAMH AI production request")
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Unable to load MLAMH AI requests");
  const tickets = (data ?? []) as Ticket[];
  const active = tickets.filter(t => activeStatuses.has(t.status)).length;
  const newCount = tickets.filter(t => t.status === "new").length;
  const finished = tickets.length - active;
  const visible = tickets.filter(t => filter === "all" || (filter === "active" ? activeStatuses.has(t.status) : !activeStatuses.has(t.status)));
  const tabs = [
    { key: "all", label: ar ? "جميع الطلبات" : "All requests", count: tickets.length },
    { key: "active", label: ar ? "قيد المتابعة" : "Active", count: active },
    { key: "closed", label: ar ? "المكتملة والمغلقة" : "Completed & closed", count: finished },
  ];
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  return <div dir={ar ? "rtl" : "ltr"}><AdminPageContainer>
    <AdminPageHeader eyebrow="MLAMH AI" title={ar ? "طلبات الإنتاج بالذكاء الاصطناعي" : "AI Production Requests"}
      description={ar ? "متابعة طلبات العملاء وإدارتها من مكان واحد." : "Review and manage client production briefs in one place."} />
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.018] px-4 py-3">
      <AIRequestsLiveRefresh isArabic={ar} />
      <span className="text-xs text-white/35">{ar ? "اضغط على أي طلب لعرض تفاصيل المشروع والرد على العميل" : "Open a request to review its brief and respond"}</span>
    </div>
    <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={ar ? "إحصاءات الطلبات" : "Request statistics"}>
      <Stat label={ar ? "إجمالي الطلبات" : "Total requests"} value={tickets.length} icon={ClipboardList} />
      <Stat label={ar ? "طلبات جديدة" : "New requests"} value={newCount} icon={Sparkles} />
      <Stat label={ar ? "قيد المتابعة" : "Active"} value={active} icon={Clock3} />
      <Stat label={ar ? "مكتملة ومغلقة" : "Completed & closed"} value={finished} icon={Inbox} />
    </section>
    <section className="mt-7 overflow-hidden rounded-2xl border border-white/[.085] bg-[#0b0b0b]">
      <div className="flex flex-col gap-4 border-b border-white/[.075] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white sm:text-lg">{ar ? "صندوق طلبات الإنتاج" : "Production inbox"}</h2>
          <span className="text-xs tabular-nums text-white/40">{visible.length} {ar ? "طلب" : "requests"}</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label={ar ? "تصفية الطلبات" : "Filter requests"}>
          {tabs.map(tab => <Link key={tab.key} href={`/admin/ai-production?lang=${ar ? "ar" : "en"}&status=${tab.key}`}
            aria-current={filter === tab.key ? "page" : undefined}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs transition sm:text-sm ${filter === tab.key ? "border-[#c5a468]/35 bg-[#c5a468]/10 text-[#e1c68d]" : "border-white/[.09] text-white/45 hover:border-white/20 hover:text-white"}`}>
            {tab.label} <span className="ms-1 tabular-nums opacity-70">{tab.count}</span>
          </Link>)}
        </nav>
      </div>
      {visible.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Inbox className="h-6 w-6 text-[#c5a468]" /></div>
        <p className="text-sm font-medium text-white/75">{ar ? "لا توجد طلبات في هذا القسم" : "No requests in this view"}</p>
        <p className="text-xs text-white/35">{ar ? "ستظهر الطلبات الجديدة هنا تلقائيًا دون إعادة تحميل الصفحة." : "New requests appear automatically without reloading the page."}</p>
      </div> : <div className="divide-y divide-white/[.07]">
        {visible.map(t => {
          const s = statuses[t.status];
          return <Link key={t.id} href={`/admin/support/${t.id}?lang=${ar ? "ar" : "en"}`}
            className="group flex flex-col gap-3 px-4 py-4 transition hover:bg-white/[.035] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-medium text-[#d6b474]" dir="ltr">{t.ticket_number}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${s?.style ?? "border-white/10 text-white/50"}`}>{s ? (ar ? s.ar : s.en) : t.status}</span>
              </div>
              <h3 className="mt-2 truncate text-sm font-semibold text-white/90 sm:text-base">{t.sender_name}</h3>
              <p className="mt-1 truncate text-xs text-white/45" dir="ltr">{t.sender_email}{t.sender_phone ? ` · ${t.sender_phone}` : ""}</p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
              <time className="text-xs text-white/40" dateTime={t.created_at}>{new Intl.DateTimeFormat(ar ? "ar-SA-u-ca-gregory-nu-latn" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(t.created_at))}</time>
              <span className="inline-flex items-center gap-1 text-xs text-[#d6b474]">{ar ? "عرض الطلب" : "View request"}<Arrow className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" /></span>
            </div>
          </Link>;
        })}
      </div>}
    </section>
  </AdminPageContainer></div>;
}
