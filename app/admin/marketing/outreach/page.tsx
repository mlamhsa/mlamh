import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingOutreachAction, sendApprovedOutreachNowAction } from "./actions";

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

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow="MLAMH OUTBOUND OPS"
      title={isArabic ? "محرك التواصل الخارجي" : "Outreach Engine"}
      description={isArabic ? "مسار احترافي من Lead مؤهل إلى مسودة Dana ثم الاعتماد والتنفيذ عبر Zoho. البريد الخارجي يبقى محكومًا بالاعتماد ومفتاح التنفيذ العام." : "A professional path from qualified lead to Dana draft, approval and Zoho execution. External email remains controlled by approval and the global execution switch."}
    />

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={isArabic ? "بانتظار الاعتماد" : "Awaiting approval"} value={waiting} />
      <AdminStatCard label={isArabic ? "جاهز للتنفيذ" : "Ready"} value={ready} />
      <AdminStatCard label={isArabic ? "تم الإرسال" : "Sent"} value={sent} />
      <AdminStatCard label={isArabic ? "ردود" : "Replies"} value={replied} />
    </AdminGrid>

    <AdminCard className="mb-5 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent">
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><AdminBadge variant="gold">DANA · AI OUTREACH</AdminBadge><AdminBadge variant="success">ZOHO CONNECTED</AdminBadge></div>
          <h2 className="mt-3 text-lg font-medium text-white">{isArabic ? "المسودات المؤهلة تدخل مسار الاعتماد تلقائيًا" : "Qualified drafts enter the approval pipeline automatically"}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/40">{isArabic ? "الذكاء الاصطناعي لا يرى البريد أو الهاتف أثناء التحليل؛ المطابقة مع عنوان البريد تتم داخل الخادم عند تجهيز التنفيذ." : "AI does not receive email addresses or phone numbers during analysis; recipient resolution happens server-side when execution is prepared."}</p>
        </div>
        <details className="group shrink-0">
          <summary className="cursor-pointer select-none rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 py-2.5 text-xs text-white/60 outline-none transition-all hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold active:translate-y-[1px]">{isArabic ? "+ رسالة يدوية" : "+ Manual outreach"}</summary>
          <div className="mt-3 md:absolute md:end-8 md:z-20 md:w-[min(760px,calc(100vw-4rem))]">
            <AdminCard className="p-5 shadow-2xl">
              <form action={createMarketingOutreachAction} className="grid gap-3 lg:grid-cols-3">
                <select name="lead_id" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="">{isArabic ? "اختر Lead" : "Select lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select>
                <select name="channel" required defaultValue="email" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option></select>
                <input name="template_key" placeholder="template_key" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition focus:border-gold/35"/>
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
          const ai = metadata.source === "marketing_ai";
          return <div key={item.id} className="group grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.018] lg:grid-cols-[minmax(0,1.5fr)_.6fr_.7fr_minmax(240px,1fr)] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-white/85">{organizations.get(item.lead_id) ?? `Lead #${item.lead_id}`}</p>{ai ? <AdminBadge variant="gold" className="px-2 py-0.5 tracking-[0.12em]">AI</AdminBadge> : null}<AdminBadge variant={statusVariant(item.send_status)} className="px-2 py-0.5 tracking-[0.12em]">{item.send_status}</AdminBadge></div>
              <p className="mt-1 truncate text-xs text-white/40">{subject ?? item.template_key ?? (isArabic ? "مسودة تواصل" : "Outreach draft")}</p>
              <div className="mt-2 flex gap-3 text-[10px] text-white/25"><span>#{item.id}</span><span>Lead #{item.lead_id}</span><span>{item.reply_status}</span></div>
            </div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Channel</p><p className="mt-1 text-xs text-white/60">{item.channel}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.16em] text-white/25">Approval</p><p className="mt-1 text-xs text-white/60">#{item.approval_id ?? "—"}</p></div>
            <div className="rounded-xl border border-white/[0.06] bg-black/15 p-3">
              {item.channel === "email" && ["approved","failed"].includes(item.send_status) ? <form action={sendApprovedOutreachNowAction}><input type="hidden" name="outreach_id" value={item.id}/><button className="w-full rounded-lg border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[11px] font-medium text-gold transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/[0.14] active:translate-y-[1px] active:scale-[0.99]">{isArabic ? "تنفيذ الإرسال المعتمد" : "Execute approved send"}</button></form> : <div className="text-xs text-white/35">{item.send_status === "waiting_approval" ? (isArabic ? "بانتظار قرار الاعتماد" : "Awaiting approval") : item.send_status === "sent" ? (isArabic ? "تم الإرسال وتسجيل النتيجة" : "Sent and recorded") : item.next_follow_up_at ? new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : (isArabic ? "لا يوجد إجراء يدوي مطلوب" : "No manual action required")}</div>}
            </div>
          </div>;
        })}
      </div>
    </AdminCard>
  </AdminPageContainer>;
}
