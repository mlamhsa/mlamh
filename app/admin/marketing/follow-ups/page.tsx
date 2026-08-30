import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function FollowUpsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_followups").select("id,lead_id,conversation_id,follow_up_at,reason,channel,owner,sequence_step,status,next_action").order("follow_up_at", { ascending: true }).limit(150);
  const rows = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "Follow-up Engine" : "Follow-up Engine"} description={isArabic ? "متابعة منظمة بدون Mass Spam، مع إبقاء المتابعات الحساسة أو التجارية خلف Approval." : "Structured follow-up without mass spam, keeping sensitive or commercial follow-up behind approval."} />
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول المتابعة غير مفعلة بعد." : "Follow-up tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد متابعات مجدولة حقيقية بعد." : "No real scheduled follow-ups yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_.8fr_.8fr_.7fr_1.4fr]"><div className="text-sm text-white">Lead #{item.lead_id ?? "—"}</div><div className="text-xs text-white/55">{item.owner ?? "—"} · {item.channel ?? "—"}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/55">Step {item.sequence_step}</div><div className="text-xs text-white/40">{item.follow_up_at ? new Date(item.follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}<div className="mt-1">{item.next_action ?? item.reason ?? "—"}</div></div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
