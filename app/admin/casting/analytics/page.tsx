import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function num(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function money(value: number) { return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value); }

export default async function CastingAnalyticsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from("casting_projects")
    .select("id,status,commercial_status,package_code,quoted_amount,currency,opportunity_id")
    .eq("service_mode", "managed");
  if (error) console.error("[CastingAnalyticsPage projects]", error);

  const rows = projects ?? [];
  const projectIds = rows.map((item) => Number(item.id));
  const [{ data: roles }, { data: shortlist }, { data: payments }, { data: invitations }] = projectIds.length ? await Promise.all([
    admin.from("casting_roles").select("id,casting_project_id,opportunity_id,status").in("casting_project_id", projectIds),
    admin.from("casting_shortlist").select("id,casting_project_id,status").in("casting_project_id", projectIds),
    admin.from("casting_payments").select("id,casting_project_id,status,amount,currency").in("casting_project_id", projectIds),
    admin.from("managed_casting_invitations").select("id,casting_project_id,status").in("casting_project_id", projectIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const roleRows = roles ?? [];
  const shortlistRows = shortlist ?? [];
  const paymentRows = payments ?? [];
  const invitationRows = invitations ?? [];
  const opportunityIds = Array.from(new Set([
    ...rows.map((item) => Number(item.opportunity_id)).filter((id) => id > 0),
    ...roleRows.map((item) => Number(item.opportunity_id)).filter((id) => id > 0),
  ]));
  const { data: applications } = opportunityIds.length ? await admin.from("opportunity_applications").select("id,opportunity_id,status").in("opportunity_id", opportunityIds) : { data: [] };
  const appRows = applications ?? [];

  const activeStatuses = new Set(["active", "screening", "shortlist_ready", "client_review"]);
  const qualifiedStatuses = new Set(["qualified", "proposal", "awaiting_client", "active", "screening", "shortlist_ready", "client_review", "completed"]);
  const total = rows.length;
  const qualified = rows.filter((item) => qualifiedStatuses.has(item.status)).length;
  const active = rows.filter((item) => activeStatuses.has(item.status)).length;
  const completed = rows.filter((item) => item.status === "completed").length;
  const selected = shortlistRows.filter((item) => item.status === "selected").length;
  const shortlisted = shortlistRows.filter((item) => ["shortlisted", "presented", "reserved", "selected"].includes(item.status)).length;

  const invitesSent = invitationRows.length;
  const invitesViewed = invitationRows.filter((item) => ["viewed", "applied"].includes(item.status)).length;
  const invitesApplied = invitationRows.filter((item) => item.status === "applied").length;
  const inviteViewRate = invitesSent ? Math.round((invitesViewed / invitesSent) * 100) : 0;
  const inviteApplyRate = invitesSent ? Math.round((invitesApplied / invitesSent) * 100) : 0;

  const wonRows = rows.filter((item) => item.commercial_status === "won");
  const lostCount = rows.filter((item) => item.commercial_status === "lost").length;
  const decided = wonRows.length + lostCount;
  const winRate = decided ? Math.round((wonRows.length / decided) * 100) : 0;
  const quoted = rows.reduce((sum, item) => sum + num(item.quoted_amount), 0);
  const wonValue = wonRows.reduce((sum, item) => sum + num(item.quoted_amount), 0);
  const paid = paymentRows.filter((item) => item.status === "paid").reduce((sum, item) => sum + num(item.amount), 0);
  const refunded = paymentRows.filter((item) => item.status === "refunded").reduce((sum, item) => sum + num(item.amount), 0);
  const collected = Math.max(0, paid - refunded);
  const collectionRate = wonValue ? Math.min(100, Math.round((collected / wonValue) * 100)) : 0;

  const packages = [
    { code: "starter", label: "Managed Basic" },
    { code: "pro", label: "Managed Pro" },
    { code: "custom", label: "Managed Enterprise" },
  ].map((item) => ({ ...item, count: rows.filter((row) => row.package_code === item.code).length, quoted: rows.filter((row) => row.package_code === item.code).reduce((sum, row) => sum + num(row.quoted_amount), 0) }));

  return <div dir={ar ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <header className="border-b border-white/10 pb-6"><Link href={`/admin/casting?lang=${language}`} className="text-xs text-gold hover:underline">{ar ? "← العودة إلى Managed Casting" : "← Back to Managed Casting"}</Link><p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">MANAGED CASTING ANALYTICS</p><h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">{ar ? "الأداء التشغيلي والتجاري" : "Operational & Commercial Performance"}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">{ar ? "مؤشرات Managed Casting فقط، مع فصل واضح عن Self-Service وقياس رحلة الاستقطاب والفرز والتحصيل." : "Managed Casting only, isolated from Self-Service, with sourcing, screening, and collection metrics."}</p></header>

    <section className="mt-6"><p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">{ar ? "التشغيل" : "OPERATIONS"}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[[ar?"إجمالي المشاريع":"Projects",total],[ar?"مؤهلة":"Qualified",qualified],[ar?"نشطة":"Active",active],[ar?"مكتملة":"Completed",completed],[ar?"الطلبات":"Applications",appRows.length],[ar?"القائمة المختصرة":"Shortlisted",shortlisted],[ar?"المختارون":"Selected",selected],[ar?"الأدوار":"Roles",roleRows.length]].map(([label,value])=><div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-3 text-3xl font-light text-white">{value}</p></div>)}</div></section>

    <section className="mt-6"><p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">{ar ? "الاستقطاب الموجّه" : "TARGETED SOURCING"}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label={ar?"الدعوات":"Invitations"} value={String(invitesSent)}/><Metric label={ar?"تمت المشاهدة":"Viewed"} value={String(invitesViewed)} note={`${inviteViewRate}%`}/><Metric label={ar?"تحولت إلى طلب":"Applied"} value={String(invitesApplied)} note={`${inviteApplyRate}%`}/><Metric label={ar?"طلب ← اختيار":"Application → Selected"} value={`${appRows.length ? Math.round((selected/appRows.length)*100) : 0}%`}/></div></section>

    <section className="mt-6"><p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">{ar ? "التجاري والتحصيل" : "COMMERCIAL & COLLECTIONS"}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label={ar?"قيمة العروض":"Quoted pipeline"} value={`${money(quoted)} SAR`}/><Metric label={ar?"صفقات رابحة":"Won deals"} value={String(wonRows.length)} note={`${money(wonValue)} SAR`}/><Metric label={ar?"المحصّل الصافي":"Net collected"} value={`${money(collected)} SAR`} note={`${collectionRate}%`}/><Metric label={ar?"معدل الفوز":"Win rate"} value={`${winRate}%`}/></div></section>

    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-gold">SERVICE MIX</p><h2 className="mt-2 text-xl font-light text-white">{ar ? "مزيج خدمات Managed Casting" : "Managed Casting service mix"}</h2></div><Link href={`/admin/casting/commercial?lang=${language}`} className="text-xs text-gold">{ar ? "فتح المبيعات والتحصيل" : "Open commercial pipeline"}</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{packages.map((item)=><div key={item.code} className="rounded-xl border border-white/[0.07] bg-black/20 p-5"><p className="text-sm text-white/75">{item.label}</p><div className="mt-4 flex items-end justify-between"><p className="text-3xl font-light text-white">{item.count}</p><p className="text-xs text-white/35">{money(item.quoted)} SAR</p></div></div>)}</div></section>
  </div></div>;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-3 text-3xl font-light text-white">{value}</p>{note ? <p className="mt-2 text-xs text-gold/65">{note}</p> : null}</div>;
}
