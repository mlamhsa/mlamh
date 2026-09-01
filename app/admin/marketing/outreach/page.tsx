import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingOutreachAction, sendApprovedOutreachNowAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function OutreachPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data, error }, leadsResult] = await Promise.all([
    db.from("marketing_outreach").select("id,lead_id,template_key,channel,approval_id,send_status,reply_status,next_follow_up_at,outcome,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_leads").select("id,organization,stage").in("stage", ["new","contacted","replied","qualified","brief_received"]).order("created_at", { ascending: false }).limit(150),
  ]);
  const rows = data ?? [];
  const leads = leadsResult.data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title="Outreach Engine" description={isArabic ? "Qualified targeted B2B فقط. إنشاء أول رسالة يفتح Approval، والاعتماد لا يرسل الرسالة؛ الإرسال يحتاج Send now مستقل." : "Qualified targeted B2B only. Creating a first message opens approval; approval does not send it. Sending requires a separate Send now action."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingOutreachAction} className="grid gap-3 lg:grid-cols-3"><select name="lead_id" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "اختر Lead" : "Select lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select><select name="channel" required defaultValue="email" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option></select><input name="template_key" placeholder="template_key" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="subject" placeholder={isArabic ? "عنوان البريد — مطلوب لقناة Email" : "Email subject — required for Email"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-3"/><textarea name="message" required placeholder={isArabic ? "معاينة الرسالة المقترحة" : "Proposed message preview"} className="min-h-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-3"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "إرسال للاعتماد" : "Request approval"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Outreach غير مفعلة بعد." : "Outreach tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد محاولات Outreach حقيقية بعد." : "No real outreach attempts yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_.8fr_.8fr_.8fr_1.3fr]"><div className="text-sm text-white">Lead #{item.lead_id}</div><div className="text-xs text-white/55">{item.channel}</div><div className="text-xs text-gold">{item.send_status}</div><div className="text-xs text-white/55">{item.reply_status}</div><div className="space-y-2 text-xs text-white/35"><div>Approval #{item.approval_id ?? "—"}</div><div>{item.next_follow_up_at ? new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div>{item.channel === "email" && ["approved","failed"].includes(item.send_status) ? <form action={sendApprovedOutreachNowAction}><input type="hidden" name="outreach_id" value={item.id}/><button className="rounded-lg border border-gold/35 bg-gold/10 px-3 py-2 text-[11px] text-gold">{isArabic ? "إرسال الآن" : "Send now"}</button></form> : null}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
