import Link from "next/link";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "MLAMH Marketing Hub — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type PeriodKey = "today" | "yesterday" | "7d" | "30d";
type PageProps = { searchParams: Promise<{ lang?: string; period?: string }> };

type Window = { start: Date; end: Date; previousStart: Date; previousEnd: Date };

function startOfRiyadhDay(date = new Date()) {
  const riyadh = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const utcMidnight = Date.UTC(riyadh.getUTCFullYear(), riyadh.getUTCMonth(), riyadh.getUTCDate());
  return new Date(utcMidnight - 3 * 60 * 60 * 1000);
}

function getWindow(period: PeriodKey): Window {
  const now = new Date();
  if (period === "today") {
    const start = startOfRiyadhDay(now);
    const duration = now.getTime() - start.getTime();
    return { start, end: now, previousStart: new Date(start.getTime() - duration), previousEnd: start };
  }
  if (period === "yesterday") {
    const todayStart = startOfRiyadhDay(now);
    const start = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const previousStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    return { start, end: todayStart, previousStart, previousEnd: start };
  }
  const days = period === "30d" ? 30 : 7;
  const duration = days * 24 * 60 * 60 * 1000;
  const start = new Date(now.getTime() - duration);
  return { start, end: now, previousStart: new Date(start.getTime() - duration), previousEnd: start };
}

function delta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "0%" : "+100%";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value >= 0 ? "+" : ""}${value}%`;
}

async function getPeriodMetrics(period: PeriodKey) {
  const db = createAdminClient();
  const window = getWindow(period);
  const range = (query: any, column: string, start: Date, end: Date) => query.gte(column, start.toISOString()).lt(column, end.toISOString());

  const build = (start: Date, end: Date) => Promise.all([
    range(db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent"), "created_at", start, end),
    range(db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").not("profile_completed_at", "is", null), "profile_completed_at", start, end),
    range(db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "talent_approved"), "created_at", start, end),
    range(db.from("opportunity_applications").select("id", { count: "exact", head: true }), "created_at", start, end),
    range(db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "publisher"), "created_at", start, end),
    range(db.from("opportunities").select("id", { count: "exact", head: true }), "created_at", start, end),
    range(db.from("events").select("id", { count: "exact", head: true }).eq("event_type", "opportunity_published"), "created_at", start, end),
  ]);

  const [currentRows, previousRows] = await Promise.all([
    build(window.start, window.end),
    build(window.previousStart, window.previousEnd),
  ]);

  const values = (rows: typeof currentRows) => ({
    talentRegistrations: rows[0].count ?? 0,
    completedTalentProfiles: rows[1].count ?? 0,
    approvedTalents: rows[2].count ?? 0,
    talentApplications: rows[3].count ?? 0,
    publisherRegistrations: rows[4].count ?? 0,
    opportunitiesCreated: rows[5].count ?? 0,
    opportunitiesPublished: rows[6].count ?? 0,
  });

  return { current: values(currentRows), previous: values(previousRows) };
}

async function getMarketingOpsState() {
  const db = createAdminClient();
  const [approvals, alerts, integrations, leads, briefs] = await Promise.all([
    db.from("marketing_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("marketing_alerts").select("id,level,title,body,created_at").eq("status", "open").order("created_at", { ascending: false }).limit(5),
    db.from("marketing_integrations").select("provider,status,last_error").order("provider"),
    db.from("marketing_leads").select("id", { count: "exact", head: true }).eq("stage", "qualified"),
    db.from("marketing_briefs").select("id", { count: "exact", head: true }).eq("status", "complete"),
  ]);
  return {
    pendingApprovals: approvals.error ? null : approvals.count ?? 0,
    alerts: alerts.error ? [] : alerts.data ?? [],
    integrations: integrations.error ? [] : integrations.data ?? [],
    qualifiedLeads: leads.error ? null : leads.count ?? 0,
    completeBriefs: briefs.error ? null : briefs.count ?? 0,
  };
}

export default async function MarketingHubOverviewPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, period: rawPeriod } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const period: PeriodKey = rawPeriod === "today" || rawPeriod === "yesterday" || rawPeriod === "30d" ? rawPeriod : "7d";
  const [{ current, previous }, ops] = await Promise.all([getPeriodMetrics(period), getMarketingOpsState()]);
  const cards = [
    [isArabic ? "تسجيلات المواهب" : "Talent Registrations", current.talentRegistrations, previous.talentRegistrations],
    [isArabic ? "ملفات مكتملة" : "Completed Profiles", current.completedTalentProfiles, previous.completedTalentProfiles],
    [isArabic ? "مواهب معتمدة" : "Approved Talents", current.approvedTalents, previous.approvedTalents],
    [isArabic ? "طلبات المواهب" : "Talent Applications", current.talentApplications, previous.talentApplications],
    [isArabic ? "تسجيلات الناشرين" : "Publisher Registrations", current.publisherRegistrations, previous.publisherRegistrations],
    [isArabic ? "الفرص المنشأة" : "Opportunities Created", current.opportunitiesCreated, previous.opportunitiesCreated],
    [isArabic ? "الفرص المنشورة" : "Opportunities Published", current.opportunitiesPublished, previous.opportunitiesPublished],
  ] as const;

  return <AdminPageContainer>
    <AdminPageHeader title="MLAMH Marketing Hub" description={isArabic ? "مركز قيادة Growth Engine ببيانات حقيقية ومقارنة بالفترة السابقة. أي مصدر غير مفعّل يظهر كذلك ولا يتم اختراع أرقام." : "Growth Engine command center using real data with previous-period comparison. Unavailable sources stay explicitly unavailable."} />
    <div className="mb-6 flex flex-wrap gap-2">{(["today","yesterday","7d","30d"] as PeriodKey[]).map((key) => <Link key={key} href={`/admin/marketing?lang=${language}&period=${key}`} className={`rounded-xl border px-3 py-2 text-xs ${period === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}>{key === "today" ? (isArabic ? "اليوم" : "Today") : key === "yesterday" ? (isArabic ? "أمس" : "Yesterday") : key === "7d" ? (isArabic ? "7 أيام" : "7 Days") : (isArabic ? "30 يوم" : "30 Days")}</Link>)}</div>
    <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, previousValue]) => <AdminStatCard key={label} label={`${label} · ${delta(value, previousValue)}`} value={value} />)}<AdminStatCard label={isArabic ? "Qualified Demand Leads" : "Qualified Demand Leads"} value={ops.qualifiedLeads ?? "N/A"} /><AdminStatCard label={isArabic ? "Briefs مكتملة" : "Complete Briefs"} value={ops.completeBriefs ?? "N/A"} /><AdminStatCard label={isArabic ? "اعتمادات CEO معلقة" : "Pending Approvals"} value={ops.pendingApprovals ?? "N/A"} /></AdminGrid>
    <div className="grid gap-5 xl:grid-cols-3"><AdminCard className="p-5 xl:col-span-2"><p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">Sprint 001</p><h2 className="mt-2 text-xl font-light text-white">{isArabic ? "تقدم الفترة المحددة" : "Selected-period progress"}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{[[isArabic ? "تسجيلات المواهب" : "Talent registrations", current.talentRegistrations, 100],[isArabic ? "ملفات مكتملة" : "Complete profiles", current.completedTalentProfiles, 70],[isArabic ? "مواهب معتمدة" : "Approved talents", current.approvedTalents, 40],[isArabic ? "طلبات" : "Applications", current.talentApplications, 100]].map(([label, value, target]) => { const n = Number(value); const t = Number(target); const percentage = Math.min(100, Math.round((n / t) * 100)); return <div key={String(label)} className="rounded-2xl border border-white/[0.08] bg-black/25 p-4"><div className="flex items-center justify-between gap-3 text-sm"><span className="text-white/65">{label}</span><span className="tabular-nums text-gold">{n} / {t}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold" style={{ width: `${percentage}%` }}/></div></div>; })}</div></AdminCard><AdminCard className="p-5"><p className="text-[10px] uppercase tracking-[0.25em] text-gold/70">{isArabic ? "التكاملات" : "Integrations"}</p><div className="mt-4 space-y-2">{ops.integrations.length === 0 ? <div className="text-sm text-white/35">{isArabic ? "Setup Required / No Data" : "Setup Required / No Data"}</div> : ops.integrations.map((item) => <div key={item.provider} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="capitalize text-white/60">{item.provider}</span><span className="text-xs text-gold">{item.status}</span></div>)}</div></AdminCard></div>
    <AdminCard className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="text-lg text-white">{isArabic ? "Growth Alerts" : "Growth Alerts"}</h2><span className="text-xs text-white/35">{ops.alerts.length}</span></div><div className="mt-4 space-y-2">{ops.alerts.length === 0 ? <div className="text-sm text-white/35">{isArabic ? "لا توجد تنبيهات مفتوحة أو أن الوحدة غير مفعلة بعد." : "No open alerts, or the module is not active yet."}</div> : ops.alerts.map((alert) => <div key={alert.id} className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3"><div className="flex items-center justify-between gap-3"><span className="text-sm text-white">{alert.title}</span><span className="text-xs text-gold">{alert.level}</span></div>{alert.body ? <p className="mt-1 text-xs text-white/40">{alert.body}</p> : null}</div>)}</div></AdminCard>
  </AdminPageContainer>;
}
