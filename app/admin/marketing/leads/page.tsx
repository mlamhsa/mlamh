import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingLeadAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; stage?: string }> };

export default async function MarketingLeadsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, stage } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  let query = db.from("marketing_leads").select("id,organization,source,channel,owner,stage,lead_score,demand_signal,opportunity_type,city,last_contact_at,next_action_at,brief_status,tags,created_at").order("created_at", { ascending: false }).limit(200);
  if (stage) query = query.eq("stage", stage);
  const { data, error } = await query;
  const leads = data ?? [];
  const qualified = leads.filter((lead) => lead.stage === "qualified").length;
  const briefs = leads.filter((lead) => lead.brief_status === "complete").length;
  const active = leads.filter((lead) => !["won", "lost"].includes(lead.stage)).length;

  return <AdminPageContainer>
    <AdminPageHeader title="Leads CRM" description={isArabic ? "إدارة طلب السوق من الاكتشاف حتى البريف والفرصة، مع تسجيل المصدر والمالك وإشارة الطلب." : "Manage demand from discovery through brief and opportunity, including source, owner, and demand signal."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingLeadAction} className="grid gap-3 lg:grid-cols-3"><input name="organization" required placeholder={isArabic ? "الجهة / الشركة" : "Organization"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="contact_name" placeholder={isArabic ? "اسم التواصل" : "Contact name"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="email" type="email" placeholder="Email" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="phone" placeholder={isArabic ? "الجوال" : "Phone"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="website" placeholder="Website" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="city" placeholder={isArabic ? "المدينة" : "City"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="source" placeholder="source" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="channel" placeholder="channel" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="owner" defaultValue="nora" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="nora">Nora</option><option value="salman">Salman</option><option value="layan">Layan</option><option value="ceo">CEO</option></select><input name="lead_score" type="number" min="0" max="100" placeholder="Lead score" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="demand_signal" placeholder="Demand signal" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="opportunity_type" placeholder="Opportunity type" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="tags" placeholder="tags, comma, separated" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-2"/><input name="notes" placeholder={isArabic ? "ملاحظات" : "Notes"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "إضافة Lead" : "Add lead"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول Growth Operations غير مفعلة بعد." : "Growth Operations tables are not active yet."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-3"><AdminStatCard label={isArabic ? "نشطة" : "Active"} value={active} /><AdminStatCard label={isArabic ? "مؤهلة" : "Qualified"} value={qualified} /><AdminStatCard label={isArabic ? "Brief مكتمل" : "Complete Briefs"} value={briefs} /></AdminGrid>
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{leads.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا توجد Leads حقيقية حتى الآن." : "No real leads yet."}</div> : leads.map((lead) => <div key={lead.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr_.8fr]"><div><div className="text-sm text-white">{lead.organization}</div><div className="mt-1 text-xs text-white/35">{lead.city ?? "—"} · {lead.opportunity_type ?? "—"}</div></div><div className="text-xs text-white/55">{lead.stage}</div><div className="text-xs text-white/55">{lead.owner ?? "—"}<div className="mt-1 text-white/30">{lead.channel ?? lead.source ?? "—"}</div></div><div className="text-xs text-gold">{lead.lead_score ?? "—"}/100</div><div className="text-xs text-white/55">Brief: {lead.brief_status}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
