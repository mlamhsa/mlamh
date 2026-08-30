import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingOutreachAction } from "./actions";

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
    <AdminPageHeader title="Outreach Engine" description={isArabic ? "Qualified targeted B2B فقط. إنشاء أول رسالة يفتح Approval ولا يرسل شيئًا خارجيًا مباشرة." : "Qualified targeted B2B only. Creating a first message opens approval and sends nothing externally by itself."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingOutreachAction} className="grid gap-3 lg:grid-cols-3"><select name="lead_id" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "اختر Lead" : "Select lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select><select name="channel" required defaultValue="email" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="email">Email</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option></select><input name="template_key" placeholder="template_key" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><textarea name="message" required placeholder={isArabic ? "معاينة الرسالة المقترحة" : "Proposed message preview"} className="min-h-24 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-3"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "إرسال للاعتماد" : "Request approval"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Outreach غير مفعلة بعد." : "Outreach tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد محاولات Outreach حقيقية بعد." : "No real outreach attempts yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_.8fr_.8fr_.8fr_1fr]"><div className="text-sm text-white">Lead #{item.lead_id}</div><div className="text-xs text-white/55">{item.channel}</div><div className="text-xs text-gold">{item.send_status}</div><div className="text-xs text-white/55">{item.reply_status}</div><div className="text-xs text-white/35">Approval #{item.approval_id ?? "—"}<div>{item.next_follow_up_at ? new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
