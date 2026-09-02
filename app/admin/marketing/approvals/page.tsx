import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { EmailAdapter, WhatsAppAdapter } from "@/lib/marketing/channels/adapters";
import { buildDanaChannelDrafts, buildDanaExecutiveSummary, detectDanaClientLanguage } from "@/lib/marketing/dana/client-response";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveMarketingApproval, cancelMarketingApproval, editMarketingApproval, rejectMarketingApproval, scheduleMarketingApproval } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };
type JsonRecord = Record<string, unknown>;
type SupportContext = { subject: string; message: string };
type ChannelReadiness = { email: boolean; whatsapp: boolean };

function asRecord(value: unknown): JsonRecord { return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {}; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function numberValue(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function isExternalReply(value: unknown) { return asRecord(value).kind === "external_reply"; }
function sourceTicketNumber(action: unknown) {
  const ref = text(asRecord(action).source_reference);
  return ref.startsWith("support-ticket:") ? ref.slice("support-ticket:".length) : null;
}
function reasonValue(reasons: string[], prefix: string) { return reasons.find((reason) => reason.startsWith(prefix))?.slice(prefix.length) ?? null; }

function ExternalReplyPreview({ action, isArabic, support, readiness }: { action: unknown; isArabic: boolean; support?: SupportContext; readiness: ChannelReadiness }) {
  const proposed = asRecord(action);
  const recipient = asRecord(proposed.recipient);
  const shortlist = asRecord(proposed.shortlist);
  const gap = asRecord(shortlist.supplyGap ?? proposed.talent_supply_gap);
  const matches = Array.isArray(shortlist.matches) ? shortlist.matches : [];
  const firstMatch = asRecord(matches[0]);
  const reasons = Array.isArray(firstMatch.reasons) ? firstMatch.reasons.filter((v): v is string => typeof v === "string") : [];
  const language = detectDanaClientLanguage(support?.subject, support?.message || text(proposed.content));
  const sourceText = `${support?.subject ?? ""} ${support?.message ?? ""}`;
  const city = reasonValue(reasons, "city:");
  const talentType = reasonValue(reasons, "role:");
  const recurring = /شهري|شهريا|مستمر|monthly|recurring/i.test(sourceText);
  const socialContent = /ريلز|reels|سوشيال|social|فيديو|video/i.test(sourceText);
  const alternativesRequested = /بدائل|أخريات|اخرين|أخرى|مقارنت|خيارات|alternatives?|compare|comparison|other profiles?/i.test(sourceText);
  const matchNames = matches.map((match) => text(asRecord(match).talentName)).filter(Boolean);
  const missing = numberValue(gap.missing) ?? 0;
  const needed = numberValue(gap.needed) ?? 1;
  const executiveSummary = buildDanaExecutiveSummary({ language, talentType, talentCount: needed, city, recurring, socialContent, compensation: null, matchCount: matches.length, supplyMissing: missing, alternativesRequested });
  const drafts = buildDanaChannelDrafts({ language, senderName: text(recipient.name), talentType, city, matchNames, supplyMissing: missing, alternativesRequested });
  const sourceReference = text(proposed.source_reference);
  const hasEmail = Boolean(text(recipient.email));
  const hasPhone = Boolean(text(recipient.phone));
  const emailReady = hasEmail && readiness.email;
  const whatsappReady = hasPhone && readiness.whatsapp;
  const anyReady = emailReady || whatsappReady;

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-gold/15 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gold">{isArabic ? "قرار تجاري جاهز لمراجعة CEO" : "Commercial decision ready for CEO review"}</p>
          <p className="mt-1 text-[11px] text-white/35">{sourceReference || "—"} · {language === "ar" ? "العربية" : "English"}</p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[10px] text-amber-200">{isArabic ? "لا يوجد إرسال تلقائي" : "No automatic send"}</span>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
        <p className="text-[10px] text-white/35">{isArabic ? "ماذا طلب العميل؟" : "What did the client ask for?"}</p>
        <p className="mt-2 text-sm font-medium text-white/85">{support?.subject || (isArabic ? "طلب تجاري" : "Commercial request")}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/60">{support?.message || (isArabic ? "تعذر تحميل الرسالة الأصلية؛ راجع مرجع المصدر." : "Original message unavailable; review the source reference.")}</p>
      </div>

      <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.035] p-4">
        <p className="text-[10px] text-emerald-200/70">{isArabic ? "ملخص Dana التنفيذي" : "Dana executive summary"}</p>
        <p className="mt-2 text-sm leading-7 text-emerald-50/85">{executiveSummary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">{isArabic ? "المستلم" : "Recipient"}</p><p className="mt-1 text-sm text-white/75">{text(recipient.name) || "—"}</p></div>
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">Email · {emailReady ? (isArabic ? "متصل" : "Connected") : (isArabic ? "غير جاهز" : "Not ready")}</p><p dir="ltr" className="mt-1 break-all text-sm text-white/75">{text(recipient.email) || "—"}</p></div>
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">WhatsApp · {whatsappReady ? (isArabic ? "متصل" : "Connected") : (isArabic ? "غير متصل" : "Not connected")}</p><p dir="ltr" className="mt-1 text-sm text-white/75">{text(recipient.phone) || "—"}</p></div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">{isArabic ? "المواهب المطابقة" : "Matched"}</p><p className="mt-1 text-lg text-white/80">{matches.length}</p></div>
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">{isArabic ? "المطلوب" : "Needed"}</p><p className="mt-1 text-lg text-white/80">{needed}</p></div>
        <div className="rounded-xl border border-white/[0.07] p-3"><p className="text-[10px] text-white/35">{isArabic ? "العجز الأساسي" : "Core supply gap"}</p><p className="mt-1 text-lg text-white/80">{missing}</p></div>
      </div>

      {matches.length > 0 ? <div className="space-y-2">{matches.map((match, index) => { const row = asRecord(match); return <div key={`${text(row.talentName)}-${index}`} className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm text-emerald-100">{text(row.talentName) || `#${numberValue(row.talentId) ?? index + 1}`}</p><p className="text-xs text-emerald-200/70">Match {numberValue(row.score) ?? "—"}%</p></div></div>; })}</div> : null}

      <form action={approveMarketingApproval} className="space-y-4 rounded-xl border border-gold/15 bg-gold/[0.025] p-4">
        <input type="hidden" name="approval_id" value={Number(proposed.approval_id) || ""} />
        <input type="hidden" name="client_language" value={language} />
        <input type="hidden" name="executive_summary" value={executiveSummary} />
        <input type="hidden" name="email_draft" value={drafts.email} />
        <input type="hidden" name="whatsapp_draft" value={drafts.whatsapp} />
        <p className="text-xs text-gold">{isArabic ? "اختر قنوات الرد الجاهزة" : "Choose ready reply channels"}</p>
        <div className="flex flex-wrap gap-4 text-xs text-white/70">
          <label className="flex items-center gap-2"><input type="checkbox" name="delivery_channels" value="email" defaultChecked={emailReady} disabled={!emailReady} /> Email {emailReady ? "" : isArabic ? "(غير جاهز)" : "(not ready)"}</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="delivery_channels" value="whatsapp" defaultChecked={whatsappReady} disabled={!whatsappReady} /> WhatsApp {whatsappReady ? "" : isArabic ? "(غير متصل)" : "(not connected)"}</label>
        </div>
        {hasEmail ? <div><p className="mb-2 text-[10px] text-white/35">Email draft</p><div className="whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-black/20 p-3 text-sm leading-7 text-white/70">{drafts.email}</div></div> : null}
        {hasPhone ? <div><p className="mb-2 text-[10px] text-white/35">WhatsApp draft</p><div className="whitespace-pre-wrap rounded-xl border border-white/[0.07] bg-black/20 p-3 text-sm leading-7 text-white/70">{drafts.whatsapp}</div></div> : null}
        <p className="text-[10px] text-amber-200/70">{isArabic ? "لن تُنشأ مهمة تنفيذ إلا لقناة متصلة فعليًا. ويبقى حاجز التنفيذ الخارجي مقفلًا حتى تفعيله بشكل منفصل." : "An execution job is created only for a connected channel. The external execution kill switch remains separately controlled."}</p>
        <button disabled={!anyReady} className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-medium text-gold disabled:cursor-not-allowed disabled:opacity-40">{anyReady ? (isArabic ? "اعتماد الرد وتجهيز القنوات" : "Approve reply & prepare channels") : (isArabic ? "اربط قناة إرسال أولًا" : "Connect a delivery channel first")}</button>
      </form>
    </div>
  );
}

export default async function MarketingApprovalsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data, error }, emailStatus, whatsappStatus] = await Promise.all([
    db.from("marketing_approvals").select("id,task_id,requested_by_agent_id,approval_level,status,reason,proposed_action,preview,channel,risk_level,expires_at,execute_after,created_at").order("created_at", { ascending: false }).limit(100),
    EmailAdapter.getStatus(),
    WhatsAppAdapter.getStatus(),
  ]);
  const approvals = data ?? [];
  const readiness: ChannelReadiness = { email: emailStatus === "connected", whatsapp: whatsappStatus === "connected" };

  const ticketNumbers = approvals.map((item) => sourceTicketNumber(item.proposed_action)).filter((value): value is string => Boolean(value));
  const supportContexts = new Map<string, SupportContext>();
  if (ticketNumbers.length > 0) {
    const { data: tickets } = await db.from("support_tickets").select("id,ticket_number,subject").in("ticket_number", ticketNumbers);
    const ticketRows = tickets ?? [];
    const ids = ticketRows.map((ticket) => ticket.id);
    const { data: messages } = ids.length ? await db.from("support_messages").select("ticket_id,sender_type,message,created_at").in("ticket_id", ids).neq("sender_type", "admin").order("created_at", { ascending: true }) : { data: [] };
    for (const ticket of ticketRows) {
      const first = (messages ?? []).find((message) => message.ticket_id === ticket.id);
      supportContexts.set(ticket.ticket_number, { subject: ticket.subject ?? "", message: first?.message ?? "" });
    }
  }

  const pending = approvals.filter((item) => item.status === "pending").length;
  const ceoOnly = approvals.filter((item) => item.status === "pending" && item.approval_level === "ceo_only").length;
  const highRisk = approvals.filter((item) => item.status === "pending" && ["high", "critical"].includes(item.risk_level)).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "مركز الاعتمادات" : "Approvals Center"} description={isArabic ? "راجع طلب العميل، تحليل Dana، الترشيحات، ونص الرد قبل تجهيز أي قناة تنفيذ." : "Review the client request, Dana analysis, shortlist and reply before preparing any execution channel."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل بيانات Marketing Hub." : "Unable to load Marketing Hub data."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-3"><AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Pending"} value={pending} /><AdminStatCard label={isArabic ? "CEO فقط" : "CEO Only"} value={ceoOnly} /><AdminStatCard label={isArabic ? "مخاطر مرتفعة" : "High Risk"} value={highRisk} /></AdminGrid>
    <div className="space-y-4">{approvals.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد طلبات اعتماد حاليًا." : "No approval requests."}</AdminCard> : approvals.map((item) => {
      const externalReply = isExternalReply(item.proposed_action);
      const ticket = sourceTicketNumber(item.proposed_action);
      const action = externalReply ? { ...asRecord(item.proposed_action), approval_id: item.id } : item.proposed_action;
      return <AdminCard key={item.id} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-sm text-white">#{item.id} · Task #{item.task_id} · {item.requested_by_agent_id ?? "system"}</div><div className="mt-1 text-xs text-white/40">{item.reason ?? "—"}</div></div><div className="text-end"><div className="text-xs text-gold">{item.status}</div><div className="mt-1 text-[11px] text-white/35">{item.approval_level} · {item.risk_level} · {item.channel ?? "internal"}</div></div></div>
        {externalReply ? <ExternalReplyPreview action={action} isArabic={isArabic} support={ticket ? supportContexts.get(ticket) : undefined} readiness={readiness} /> : null}
        {item.status === "pending" && !externalReply ? <div className="mt-5 space-y-3"><form action={editMarketingApproval} className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]"><input type="hidden" name="approval_id" value={item.id} /><input name="reason" defaultValue={item.reason ?? ""} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><input name="preview_json" defaultValue={JSON.stringify(item.preview ?? {})} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/65">{isArabic ? "تعديل" : "Edit"}</button></form><div className="flex gap-2"><form action={approveMarketingApproval}><input type="hidden" name="approval_id" value={item.id} /><button className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">{isArabic ? "اعتماد" : "Approve"}</button></form><form action={rejectMarketingApproval}><input type="hidden" name="approval_id" value={item.id} /><button className="rounded-xl border border-red-400/20 px-4 py-2 text-xs text-red-300">{isArabic ? "رفض" : "Reject"}</button></form><form action={cancelMarketingApproval}><input type="hidden" name="approval_id" value={item.id} /><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50">{isArabic ? "إلغاء" : "Cancel"}</button></form></div><form action={scheduleMarketingApproval} className="flex gap-2"><input type="hidden" name="approval_id" value={item.id} /><input type="datetime-local" name="execute_after" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><button className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">{isArabic ? "اعتماد مع جدولة" : "Approve with schedule"}</button></form></div> : null}
      </AdminCard>;
    })}</div>
  </AdminPageContainer>;
}