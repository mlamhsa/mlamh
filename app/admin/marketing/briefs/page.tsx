import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingBriefAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function MarketingBriefsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data, error }, leadsResult] = await Promise.all([
    db.from("marketing_briefs").select("id,project_type,talent_type,talent_count,city,shoot_date,compensation,budget,lead_id,conversation_id,opportunity_id,status,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_leads").select("id,organization,stage").not("stage", "in", "(won,lost)").order("created_at", { ascending: false }).limit(100),
  ]);
  const briefs = data ?? [];
  const leads = leadsResult.data ?? [];

  return <AdminPageContainer>
    <AdminPageHeader title="Brief Engine" description={isArabic ? "تحويل المحادثات الجادة إلى احتياج منظم Actor/Model يمكن لاحقًا ربطه بفرصة." : "Convert serious conversations into structured Actor/Model demand that can later link to an opportunity."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingBriefAction} className="grid gap-3 lg:grid-cols-3"><select name="lead_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون Lead مرتبط" : "No linked lead"}</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>#{lead.id} — {lead.organization}</option>)}</select><input name="project_type" placeholder={isArabic ? "نوع المشروع" : "Project type"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="talent_type" defaultValue="actor" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="actor">Actor</option><option value="model">Model</option><option value="mixed">Actor + Model</option></select><input name="talent_count" type="number" min="1" placeholder={isArabic ? "عدد المواهب" : "Talent count"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="city" placeholder={isArabic ? "المدينة" : "City"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="shoot_date" type="date" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="time_window" placeholder={isArabic ? "الفترة الزمنية" : "Time window"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="compensation" placeholder={isArabic ? "المقابل" : "Compensation"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="budget" type="number" min="0" step="0.01" placeholder={isArabic ? "الميزانية" : "Budget"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="location_notes" placeholder={isArabic ? "ملاحظات الموقع" : "Location notes"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="requirements" placeholder={isArabic ? "المتطلبات" : "Requirements"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="status" defaultValue="draft" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="draft">draft</option><option value="partial">partial</option><option value="complete">complete</option></select><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "حفظ البريف" : "Save brief"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Brief Engine غير مفعلة بعد." : "Brief Engine tables are not active yet."}</AdminCard> : null}
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{briefs.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Briefs حقيقية حتى الآن." : "No real briefs yet."}</div> : briefs.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_.7fr_.7fr_.8fr_.7fr]"><div><div className="text-sm text-white">{item.project_type ?? "—"}</div><div className="mt-1 text-xs text-white/35">#{item.id} · Lead {item.lead_id ?? "—"}</div></div><div className="text-xs text-white/55">{item.talent_type ?? "—"} · {item.talent_count ?? "—"}</div><div className="text-xs text-white/55">{item.city ?? "—"}</div><div className="text-xs text-white/55">{item.shoot_date ?? "—"}<div className="mt-1 text-white/35">{item.budget ?? "—"}</div></div><div className="text-xs text-gold">{item.status}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
