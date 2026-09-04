import Link from "next/link";

import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingFollowUpAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; lead_id?: string }> };

function statusLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "غير محددة" : "Unknown";
  if (!isArabic) return value.replaceAll("_", " ");
  const map: Record<string, string> = { scheduled: "مجدولة", pending: "بانتظار التنفيذ", completed: "مكتملة", sent: "تمت", cancelled: "ملغاة", failed: "تحتاج مراجعة" };
  return map[value.toLowerCase()] ?? value.replaceAll("_", " ");
}

function channelLabel(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "غير محددة" : "Not set";
  if (!isArabic) return value;
  return ({ email: "البريد", linkedin: "LinkedIn", whatsapp: "واتساب", instagram: "إنستغرام", facebook: "فيسبوك", internal: "داخلي" } as Record<string, string>)[value.toLowerCase()] ?? value;
}

export default async function FollowUpsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, lead_id: requestedLeadId } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const requestedId = Number(requestedLeadId);
  const selectedLeadId = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : null;
  const db = createAdminClient();
  const [{ data, error }, leadsResult] = await Promise.all([
    db.from("marketing_followups").select("id,lead_id,conversation_id,follow_up_at,reason,channel,owner,sequence_step,status,next_action").order("follow_up_at", { ascending: true }).limit(150),
    db.from("marketing_leads").select("id,organization,stage").not("stage", "in", "(won,lost)").order("created_at", { ascending: false }).limit(150),
  ]);
  const rows = data ?? [];
  const leads = leadsResult.data ?? [];
  const leadNames = new Map(leads.map((lead) => [lead.id, lead.organization]));
  const selectedLead = selectedLeadId ? leads.find((lead) => lead.id === selectedLeadId) ?? null : null;
  const visibleRows = selectedLeadId ? rows.filter((item) => item.lead_id === selectedLeadId) : rows;
  const now = Date.now();
  const overdue = visibleRows.filter((item) => item.follow_up_at && new Date(item.follow_up_at).getTime() < now && !["completed", "sent", "cancelled"].includes((item.status ?? "").toLowerCase())).length;
  const scheduled = visibleRows.filter((item) => ["scheduled", "pending"].includes((item.status ?? "").toLowerCase())).length;
  const unowned = visibleRows.filter((item) => !item.owner).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "متابعات الطلب" : "Demand Follow-ups"} description={isArabic ? "اعرف ما الذي يجب متابعته الآن، من المسؤول، وما الخطوة التالية — بدون إغراقك بتفاصيل التشغيل." : "See what needs follow-up now, who owns it, and the next action without operational clutter."} />

    {selectedLead ? <AdminCard className="mb-5 border-gold/20 bg-gold/[0.05] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gold/60">{isArabic ? "متابعات العميل المحدد" : "SELECTED LEAD FOLLOW-UPS"}</p><p className="mt-1 text-sm font-medium text-white">{selectedLead.organization}</p></div><div className="flex gap-2"><Link href={`/admin/marketing/leads/${selectedLead.id}?lang=${language}`} className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold">{isArabic ? "مساحة العميل" : "Lead workspace"}</Link><Link href={`/admin/marketing/follow-ups?lang=${language}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">{isArabic ? "عرض الكل" : "Show all"}</Link></div></div></AdminCard> : null}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "مجدولة" : "Scheduled"}</div><div className="mt-2 text-2xl font-semibold text-white">{scheduled}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "متأخرة" : "Overdue"}</div><div className={`mt-2 text-2xl font-semibold ${overdue > 0 ? "text-red-200" : "text-emerald-200"}`}>{overdue}</div></AdminCard>
      <AdminCard className="p-4"><div className="text-xs text-white/40">{isArabic ? "بدون مسؤول" : "Unassigned"}</div><div className={`mt-2 text-2xl font-semibold ${unowned > 0 ? "text-amber-200" : "text-emerald-200"}`}>{unowned}</div></AdminCard>
    </div>

    <AdminCard className="mb-6 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.05] via-white/[0.02] to-transparent"><details open={Boolean(selectedLead)}><summary className="cursor-pointer list-none p-5"><div className="flex items-center justify-between gap-4"><div><div className="text-xs text-gold/60">{isArabic ? "جدولة جديدة" : "NEW FOLLOW-UP"}</div><div className="mt-1 text-base text-white">{isArabic ? "إضافة متابعة" : "Schedule follow-up"}</div><div className="mt-1 text-xs text-white/35">{isArabic ? "التنفيذ الخارجي يبقى خاضعًا للاعتماد والحوكمة." : "External execution remains approval-governed."}</div></div><span className="text-gold">+</span></div></summary><div className="border-t border-white/[0.07] p-5"><form action={createMarketingFollowUpAction} className="grid gap-3 lg:grid-cols-3"><select name="lead_id" defaultValue={selectedLeadId ? String(selectedLeadId) : ""} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون عميل مرتبط" : "No linked lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.organization}</option>)}</select><input name="follow_up_at" type="datetime-local" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="owner" defaultValue="layan" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="layan">Layan</option><option value="salman">Salman</option><option value="nora">Nora</option><option value="ceo">CEO</option></select><input name="channel" placeholder={isArabic ? "القناة" : "Channel"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="sequence_step" type="number" min="1" defaultValue="1" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="reason" placeholder={isArabic ? "لماذا نتابع؟" : "Why follow up?"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="next_action" placeholder={isArabic ? "ما الإجراء التالي؟" : "What is the next action?"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-3"/><button className="rounded-xl bg-gold px-4 py-2 text-sm font-medium text-black lg:col-span-3">{isArabic ? "حفظ المتابعة" : "Save follow-up"}</button></form></div></details></AdminCard>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول المتابعة غير مفعلة بعد." : "Follow-up tables are not active yet."}</AdminCard> : null}
    <div className="grid gap-3">{visibleRows.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{selectedLead ? (isArabic ? "لا توجد متابعات لهذا العميل بعد." : "No follow-ups for this lead yet.") : (isArabic ? "لا توجد متابعات مجدولة حقيقية بعد." : "No real scheduled follow-ups yet.")}</AdminCard> : visibleRows.map((item) => { const isOverdue = Boolean(item.follow_up_at) && new Date(item.follow_up_at).getTime() < now && !["completed", "sent", "cancelled"].includes((item.status ?? "").toLowerCase()); return <AdminCard key={item.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-white">{item.next_action ?? item.reason ?? (isArabic ? "متابعة بدون وصف" : "Follow-up without description")}</span><span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/45">{channelLabel(item.channel, isArabic)}</span></div><div className="mt-2 text-xs text-white/45">{item.lead_id ? <><Link href={`/admin/marketing/leads/${item.lead_id}?lang=${language}`} className="text-gold/70 hover:text-gold">{leadNames.get(item.lead_id) ?? `Lead #${item.lead_id}`}</Link><span> · </span></> : null}{isArabic ? "المسؤول" : "Owner"}: <span className="text-white/70">{item.owner ?? (isArabic ? "لم يُعيّن" : "Unassigned")}</span>{item.sequence_step ? ` · ${isArabic ? "الخطوة" : "Step"} ${item.sequence_step}` : ""}</div></div><div className="shrink-0 text-start lg:text-end"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${isOverdue ? "border-red-300/20 bg-red-300/10 text-red-200" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}`}>{isOverdue ? (isArabic ? "متأخرة" : "Overdue") : statusLabel(item.status, isArabic)}</span><div className="mt-2 text-xs text-white/35">{item.follow_up_at ? new Date(item.follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div></div></AdminCard>; })}</div>
  </AdminPageContainer>;
}
