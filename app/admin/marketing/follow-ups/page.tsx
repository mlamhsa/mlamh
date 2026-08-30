import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingFollowUpAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function FollowUpsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data, error }, leadsResult] = await Promise.all([
    db.from("marketing_followups").select("id,lead_id,conversation_id,follow_up_at,reason,channel,owner,sequence_step,status,next_action").order("follow_up_at", { ascending: true }).limit(150),
    db.from("marketing_leads").select("id,organization,stage").not("stage", "in", "(won,lost)").order("created_at", { ascending: false }).limit(150),
  ]);
  const rows = data ?? [];
  const leads = leadsResult.data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title="Follow-up Engine" description={isArabic ? "جدولة Routine Follow-ups بشكل منظم؛ التنفيذ الخارجي يبقى خاضعًا لقواعد Approval." : "Schedule routine follow-ups cleanly; external execution remains governed by approval rules."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingFollowUpAction} className="grid gap-3 lg:grid-cols-3"><select name="lead_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون Lead" : "No lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select><input name="follow_up_at" type="datetime-local" required className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="owner" defaultValue="layan" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="layan">Layan</option><option value="salman">Salman</option><option value="nora">Nora</option><option value="ceo">CEO</option></select><input name="channel" placeholder="channel" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="sequence_step" type="number" min="1" defaultValue="1" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="reason" placeholder={isArabic ? "سبب المتابعة" : "Reason"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="next_action" placeholder={isArabic ? "الإجراء التالي" : "Next action"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-3"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "جدولة المتابعة" : "Schedule follow-up"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول المتابعة غير مفعلة بعد." : "Follow-up tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{rows.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد متابعات مجدولة حقيقية بعد." : "No real scheduled follow-ups yet."}</div> : rows.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[.8fr_.8fr_.8fr_.7fr_1.4fr]"><div className="text-sm text-white">Lead #{item.lead_id ?? "—"}</div><div className="text-xs text-white/55">{item.owner ?? "—"} · {item.channel ?? "—"}</div><div className="text-xs text-gold">{item.status}</div><div className="text-xs text-white/55">Step {item.sequence_step}</div><div className="text-xs text-white/40">{item.follow_up_at ? new Date(item.follow_up_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}<div className="mt-1">{item.next_action ?? item.reason ?? "—"}</div></div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
