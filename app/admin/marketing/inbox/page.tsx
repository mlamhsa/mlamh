import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingInboxPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_conversations").select("id,channel,assigned_agent_id,status,stage,last_message_at,unread_count,priority,tags,lead_id,publisher_id,talent_id").order("last_message_at", { ascending: false, nullsFirst: false }).limit(150);
  const conversations = data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "صندوق الوارد الموحد" : "Unified Inbox"} description={isArabic ? "محادثات القنوات الخارجية تحت Customer/Lead موحد قدر الإمكان، منفصلة عن محادثات Publisher↔Talent الحالية." : "External-channel conversations unified around a customer/lead where possible, separate from existing Publisher↔Talent messaging."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "بنية Inbox جاهزة ولكن جداول Marketing Hub غير مفعلة بعد." : "Inbox architecture is ready, but Marketing Hub tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{conversations.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد محادثات تسويقية حقيقية بعد." : "No real marketing conversations yet."}</div> : conversations.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_1fr_.8fr_.8fr_.7fr]"><div><div className="text-sm text-gold">{item.channel}</div><div className="text-[11px] text-white/35">#{item.id}</div></div><div className="text-sm text-white">{item.stage}<div className="mt-1 text-xs text-white/35">Agent: {item.assigned_agent_id ?? "—"}</div></div><div className="text-xs text-white/55">{item.priority}</div><div className="text-xs text-white/55">Unread: {item.unread_count}</div><div className="text-xs text-white/35">{item.last_message_at ? new Date(item.last_message_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
