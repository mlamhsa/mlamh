import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function OutreachPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_outreach").select("id,lead_id,template_key,channel,approval_id,send_status,reply_status,next_follow_up_at,outcome,created_at").order("created_at", { ascending: false }).limit(150);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "Outreach Engine" : "Outreach Engine"} description={isArabic ? "تواصل B2B مستهدف فقط، مع Approval قبل أول تواصل خارجي حسب قواعد الحوكمة." : "Targeted B2B outreach only, with approval before first external contact according to governance rules."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Outreach غير مفعلة بعد." : "Outreach tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد محاولات Outreach حقيقية بعد." : "No real outreach attempts yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_.8fr_.8fr_.8fr_1fr]"><div className="text-sm text-white">Lead #{item.lead_id}</div><div className="text-xs text-white/55">{item.channel}</div><div className="text-xs text-gold">{item.send_status}</div><div className="text-xs text-white/55">{item.reply_status}</div><div className="text-xs text-white/35">{item.next_follow_up_at ? new Date(item.next_follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
