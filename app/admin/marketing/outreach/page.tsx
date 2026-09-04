import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingOutreachAction, markLinkedInOutreachSentAction, recordLinkedInReplyAction, sendApprovedOutreachNowAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function statusVariant(status: string) {
  if (status === "sent") return "success" as const;
  if (status === "waiting_approval") return "warning" as const;
  if (status === "approved" || status === "scheduled") return "gold" as const;
  if (status === "failed") return "danger" as const;
  return "muted" as const;
}

export default async function OutreachPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();
  const [{ data, error }, leadsResult] = await Promise.all([
    db.from("marketing_outreach").select("id,lead_id,template_key,personalization,metadata,channel,approval_id,send_status,reply_status,next_follow_up_at,outcome,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_leads").select("id,organization,stage").in("stage", ["new","contacted","replied","qualified","brief_received"]).order("created_at", { ascending: false }).limit(150),
  ]);
  const rows = data ?? [];
  const leads = leadsResult.data ?? [];
  const organizations = new Map(leads.map((lead) => [lead.id, lead.organization]));
  const waiting = rows.filter((row) => row.send_status === "waiting_approval").length;
  const ready = rows.filter((row) => ["approved","scheduled"].includes(row.send_status)).length;
  const sent = rows.filter((row) => row.send_status === "sent").length;
  const replied = rows.filter((row) => row.reply_status !== "none").length;
  const linkedinReady = rows.filter((row) => row.channel === "linkedin" && ["approved","scheduled"].includes(row.send_status)).length;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow="MLAMH OUTBOUND OPS"
      title={isArabic ? "محرك التواصل الخارجي" : "Outreach Engine"}
      description={isArabic ? "البريد ينفذ عبر القنوات المعتمدة. LinkedIn يعمل حاليًا بوضع آمن: AI + اعتماد + إرسال يدوي من الحساب المعتمد، ثم متابعة تلقائية داخل ملامح." : "Email executes through approved channels. LinkedIn currently uses safe mode: AI draft + approval + manual send from the approved account, followed by automated follow-up tracking inside MLAMH."}
    />

    <AdminGrid className="mb-6 md:grid-cols-5">
      <AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Awaiting approval"} value={waiting} />
      <AdminStatCard label={isArabic ? "جاهز للتنفيذ" : "Ready"} value={ready} />
      <AdminStatCard label={isArabic ? "LinkedIn جاهز" : "LinkedIn ready"} value={linkedinReady} />
      <AdminStatCard label={isArabic ? "تم الإرسال" : "Sent"} value={sent} />
      <AdminStatCard label={isArabic ? "ردود" : "Replies"} value={replied} />
    </AdminGrid>

    <AdminCard className="mb-5 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><AdminBadge variant="gold">DANA · AI OUTREACH</AdminBadge><AdminBadge variant="success">ZOHO CONNECTED</AdminBadge><AdminBadge variant="muted">LINKEDIN · SAFE MANUAL</AdminBadge></div>
          <h2 className="mt-3 text-lg font-medium text-white">{isArabic ? "LinkedIn بدون Browser Bot أو إرسال آلي غير مصرح" : "LinkedIn without browser bots or unauthorized auto-send"}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-white/40">{isArabic ? "المسودة تدخل الاعتماد، ثم تُفتح صفحة الشخص لسوسن وترسل الرسالة يدويًا. بعد تعليمها كمرسلة ينشئ ملامح متابعة بعد 3 أيام تلقائيًا، ويمكن تسجيل الرد وتحويله إلى بريف من نفس المسار." : "The draft enters approval, then Sawsan opens the recipient profile and sends manually. Once marked sent, MLAMH schedules a three-day follow-up and lets the team record the reply outcome from the same flow."}</p>
        </div>
        <details className="group shrink-0">
          <summary className="cursor-pointer select-none rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 py-2.5 text-xs text-white/60 outline-none transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold active:translate-y-[1px]">{isArabic ? "+ رسالة يدوية" : "+ Manual outreach"}</summary>
          <div className="mt-3 md:absolute md:end-8 md:z-20 md:w-[min(760px,calc(100vw-4rem))]">
            <AdminCard className="p-5 shadow-2xl">
              <form action={createMarketingOutreachAction} className="grid gap-3 lg:grid-cols-3">
                <select name="lead_id" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="">{isArabic ? "اختر Lead" : "Select lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select>
                <select name="channel" required defaultValue="email" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option></select>
                <input name="template_key" placeholder="template_key" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
                <input name="profile_url" placeholder={isArabic ? "رابط LinkedIn — مطلوب لقناة LinkedIn" : "LinkedIn profile URL — required for LinkedIn"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35 lg:col-span-2"/>
                <select name="sender_profile" defaultValue="sawsan" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="sawsan">Sawsan · Business Development</option><option value="ceo">CEO · Osama</option></select>
                <input name="subject" placeholder={isArabic ? "عنوان البريد — مطلوب لقناة Email" : "Email subject — required for Email"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35 lg:col-span-3"/>
                <textarea name="message" required placeholder={isArabic ? "معاينة الرسالة المقترحة" : "Proposed message preview"} className="min-h-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35 lg:col-span-3"/>
                <button className="rounded-xl border border-gold/30 bg-gold px-4 py-2.5 text-sm font-medium text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(212,175,55,0.18)] active:translate-y-[1px] active:scale-[0.99] lg:col-span-3">{isArabic ? "إرسال للاعتماد" : "Request approval"}</button>
              </form>
            </AdminCard>
          </div>
        </details>
      </div>
    </AdminCard>

    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر قراءة Outreach Engine." : "Could not read Outreach Engine."}</AdminCard> : null}

    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">OUTBOUND PIPELINE</p><h2 className="mt-1 text-lg text-white">{isArabic ? "المراسلات" : "Outreach queue"}</h2></div><p className="text-xs tabular-nums text-white/30">{rows.length}</p></div>
      <div className="divide-y divide-white/[0.06]">
        {rows.length === 0 ? <div className="p-8 text-center text-sm text-white/40">{isArabic ? "لا توجد محاولات Outreach حقيقية بعد." : "No real outreach attempts yet."}</div> : rows.map((item) => {
          const personalization = asRecord(item.personalization);
          const metadata = asRecord(item.metadata);
          const subject = typeof personalization.subject === "string" ? personalization.subject : null;
          const profileUrl = typeof personalization.linkedin_profile_url === "string" ? personalization.linkedin_profile_url : null;
          const senderProfile = typeof personalization.sender_profile === "string" ? personalization.sender_profile : null;
          const ai = metadata.source === "marketing_ai";
          const linkedinExecutable = item.channel === "linkedin" && ["approved","scheduled"].includes(item.send_status) && profileUrl;
          const linkedinAwaitingReply = item.channel === "linkedin" && item.send_status === "sent" && item.reply_status === "none";
          return <div key={item.id} className="group grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018] lg:grid-cols-[minmax(0,1.5fr)_.6fr_.7fr_minmax(280px,1fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white/85">{organizations.get(item.lead_id) ?? `Lead #${item.lead_id}`}</p>{ai ? <AdminBadge variant="gold" className="px-2 py-0.5 tracking-[0.12em]">AI</AdminBadge> : null}<AdminBadge variant={statusVariant(item.send_status)} className="px-2 py-0.5 tracking-[0.12em]">{item.send_status}</AdminBadge>{item.channel === "linkedin" ? <AdminBadge variant="muted" className="px-2 py-0.5">{senderProfile ?? "sawsan"}</AdminBadge> : null}</div>
              <p className="mt-1 truncate text-xs text-white/40">{subject ?? item.template_key ?? (isArabic ? "مسودة تواصل" : "Outreach draft")}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-white/25"><span>#{item.id}</span><span>Lead #{item.lead_id}</span><span>{item.reply_status}</span>{item.outcome ? <span className="text-gold/60">{item.outcome}</span> : null}</div>
            </div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Channel</p><p className="mt-1 text-xs text-white/60">{item.channel}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Approval</p><p className="mt-1 text-xs text-white/60">#{item.approval_id ?? "—"}</p></div>
            <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
              {item.channel === "email" && ["approved","failed"].includes(item.send_status) ? <form action={sendApprovedOutreachNowAction}><input type="hidden" name="outreach_id" value={item.id}/><button className="w-full rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[11px] font-medium text-gold transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/[0.14] active:translate-y-[1px] active:scale-[0.99]">{isArabic ? "تنفيذ الإرسال المعتمد" : "Execute approved send"}</button></form> : linkedinExecutable ? <div className="grid gap-2"><a href={profileUrl} target="_blank" rel="noreferrer" className="block w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-[11px] text-white/70 transition hover:border-gold/30 hover:text-gold">{isArabic ? "فتح بروفايل LinkedIn" : "Open LinkedIn profile"}</a><form action={markLinkedInOutreachSentAction}><input type="hidden" name="outreach_id" value={item.id}/><button className="w-full rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[11px] font-medium text-gold transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/[0.14] active:translate-y-[1px] active:scale-[0.99]">{isArabic ? "تم الإرسال يدويًا" : "Mark as sent manually"}</button></form><p className="text-[10px] leading-4 text-white/25">{isArabic ? "يُنشئ متابعة بعد 3 أيام؛ لا ينفذ LinkedIn تلقائيًا." : "Schedules a 3-day follow-up; does not automate LinkedIn."}</p></div> : linkedinAwaitingReply ? <div className="grid gap-2"><p className="text-[10px] text-white/35">{isArabic ? "إذا وصل رد، سجّل نتيجته هنا لإيقاف المتابعة الحالية وتحديث الـLead." : "When a reply arrives, record the outcome here to stop the current follow-up and update the lead."}</p><div className="grid grid-cols-3 gap-1.5"><form action={recordLinkedInReplyAction}><input type="hidden" name="outreach_id" value={item.id}/><input type="hidden" name="outcome" value="interested"/><button className="w-full rounded-lg border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-2 text-[10px] text-emerald-200">{isArabic ? "مهتم" : "Interested"}</button></form><form action={recordLinkedInReplyAction}><input type="hidden" name="outreach_id" value={item.id}/><input type="hidden" name="outcome" value="not_now"/><button className="w-full rounded-lg border border-amber-300/25 bg-amber-300/[0.07] px-2 py-2 text-[10px] text-amber-100">{isArabic ? "ليس الآن" : "Not now"}</button></form><form action={recordLinkedInReplyAction}><input type="hidden" name="outreach_id" value={item.id}/><input type="hidden" name="outcome" value="not_interested"/><button className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-[10px] text-white/55">{isArabic ? "غير مهتم" : "Not interested"}</button></form></div>{item.next_follow_up_at ? <p className="text-[10px] text-gold/55">{isArabic ? "المتابعة الحالية: " : "Current follow-up: "}{new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US")}</p> : null}</div> : <div className="text-xs text-white/35">{item.send_status === "waiting_approval" ? (isArabic ? "بانتظار قرار الاعتماد" : "Awaiting approval") : item.reply_status !== "none" ? (isArabic ? `تم تسجيل الرد: ${item.outcome ?? item.reply_status}` : `Reply recorded: ${item.outcome ?? item.reply_status}`) : item.send_status === "sent" ? (item.next_follow_up_at ? `${isArabic ? "المتابعة: " : "Follow-up: "}${new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US")}` : (isArabic ? "تم الإرسال وتسجيل النتيجة" : "Sent and recorded")) : item.next_follow_up_at ? new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : (isArabic ? "لا يوجد إجراء يدوي مطلوب" : "No manual action required")}</div>}
            </div>
          </div>;
        })}
      </div>
    </AdminCard>
  </AdminPageContainer>;
}
