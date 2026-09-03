import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingLeadAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string; stage?: string }> };

function stageLabel(value: string, isArabic: boolean) {
  if (!isArabic) return value.replaceAll("_", " ");
  const labels: Record<string, string> = {
    new: "جديد",
    discovered: "مكتشف",
    contacted: "تم التواصل",
    engaged: "متفاعل",
    qualified: "مؤهل",
    brief_requested: "بانتظار البريف",
    brief_received: "البريف مستلم",
    opportunity_created: "تحول إلى فرصة",
    won: "تم كسبه",
    lost: "مغلق",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function briefLabel(value: string | null, isArabic: boolean) {
  if (!value) return "—";
  if (!isArabic) return value.replaceAll("_", " ");
  const labels: Record<string, string> = { missing: "غير موجود", requested: "مطلوب", partial: "جزئي", complete: "مكتمل" };
  return labels[value] ?? value.replaceAll("_", " ");
}

export default async function MarketingLeadsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang, stage } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();
  let query = db.from("marketing_leads").select("id,organization,source,channel,owner,stage,lead_score,demand_signal,opportunity_type,city,last_contact_at,next_action_at,brief_status,tags,created_at").order("created_at", { ascending: false }).limit(200);
  if (stage) query = query.eq("stage", stage);
  const { data, error } = await query;
  const leads = data ?? [];
  const qualified = leads.filter((lead) => lead.stage === "qualified").length;
  const briefs = leads.filter((lead) => lead.brief_status === "complete").length;
  const active = leads.filter((lead) => !["won", "lost"].includes(lead.stage)).length;
  const highIntent = leads.filter((lead) => (lead.lead_score ?? 0) >= 70 && !["won", "lost"].includes(lead.stage)).length;

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={isArabic ? "MLAMH · نمو الطلب" : "MLAMH · DEMAND GROWTH"}
      title={isArabic ? "العملاء المحتملون" : "Demand Leads"}
      description={isArabic ? "تابع الجهات التي يمكن أن تتحول إلى فرص حقيقية على ملامح، وما الخطوة التالية لكل جهة." : "Track organizations that can convert into real MLAMH opportunities and the next action for each one."}
    />

    {error ? <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm text-amber-100/80">{isArabic ? "بيانات العملاء المحتملين غير متاحة حاليًا." : "Lead data is currently unavailable."}</AdminCard> : null}

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={isArabic ? "قيد المتابعة" : "Active"} value={active} />
      <AdminStatCard label={isArabic ? "أولوية مرتفعة" : "High intent"} value={highIntent} />
      <AdminStatCard label={isArabic ? "مؤهلة" : "Qualified"} value={qualified} />
      <AdminStatCard label={isArabic ? "بريف مكتمل" : "Complete briefs"} value={briefs} />
    </AdminGrid>

    <AdminCard className="mb-6 overflow-hidden border-gold/15 bg-gradient-to-br from-gold/[0.055] via-white/[0.02] to-transparent">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden">
          <div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "إضافة يدوية" : "MANUAL ENTRY"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "إضافة عميل محتمل" : "Add a demand lead"}</h2><p className="mt-1 text-xs text-white/35">{isArabic ? "استخدمها فقط عندما لا يأتي العميل من الاكتشاف الآلي." : "Use this only when the lead did not come through automated discovery."}</p></div>
          <span className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/50 transition group-open:rotate-45">+</span>
        </summary>
        <div className="border-t border-white/[0.07] p-5">
          <form action={createMarketingLeadAction} className="grid gap-3 lg:grid-cols-3">
            <input name="organization" required placeholder={isArabic ? "الجهة / الشركة" : "Organization"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="contact_name" placeholder={isArabic ? "اسم جهة التواصل" : "Contact name"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="email" type="email" placeholder={isArabic ? "البريد الإلكتروني" : "Email"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="phone" placeholder={isArabic ? "الجوال" : "Phone"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="website" placeholder={isArabic ? "الموقع الإلكتروني" : "Website"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="city" placeholder={isArabic ? "المدينة" : "City"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="source" placeholder={isArabic ? "المصدر" : "Source"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="channel" placeholder={isArabic ? "قناة الوصول" : "Channel"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <select name="owner" defaultValue="nora" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"><option value="nora">Nora</option><option value="salman">Salman</option><option value="layan">Layan</option><option value="ceo">CEO</option></select>
            <input name="lead_score" type="number" min="0" max="100" placeholder={isArabic ? "درجة الأولوية 0–100" : "Lead score 0–100"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="demand_signal" placeholder={isArabic ? "إشارة الطلب" : "Demand signal"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="opportunity_type" placeholder={isArabic ? "نوع الفرصة المتوقعة" : "Opportunity type"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <input name="tags" placeholder={isArabic ? "وسوم مفصولة بفواصل" : "Tags, comma separated"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white lg:col-span-2"/>
            <input name="notes" placeholder={isArabic ? "ملاحظات" : "Notes"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"/>
            <button className="rounded-xl bg-gold px-4 py-2.5 text-sm font-medium text-black lg:col-span-3">{isArabic ? "إضافة العميل المحتمل" : "Add lead"}</button>
          </form>
        </div>
      </details>
    </AdminCard>

    <AdminCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] p-5"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "خط الطلب" : "DEMAND PIPELINE"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "من يحتاج متابعة الآن؟" : "Who needs attention now?"}</h2></div><span className="text-xs tabular-nums text-white/30">{leads.length}</span></div>
      <div className="divide-y divide-white/[0.07]">{leads.length === 0 ? <div className="p-8 text-center text-sm text-white/40">{isArabic ? "لا توجد جهات في مسار الطلب حتى الآن." : "No demand leads yet."}</div> : leads.map((lead) => <div key={lead.id} className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.02] lg:grid-cols-[1.5fr_.8fr_.7fr_.6fr_.8fr] lg:items-center">
        <div><div className="text-sm font-medium text-white">{lead.organization}</div><div className="mt-1 text-xs text-white/35">{lead.city ?? "—"} · {lead.opportunity_type ?? (isArabic ? "نوع غير محدد" : "Type not set")}</div>{lead.demand_signal ? <p className="mt-2 line-clamp-1 text-xs text-white/30">{lead.demand_signal}</p> : null}</div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">{isArabic ? "المرحلة" : "Stage"}</p><p className="mt-1 text-xs text-white/65">{stageLabel(lead.stage, isArabic)}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">{isArabic ? "المسؤول" : "Owner"}</p><p className="mt-1 text-xs text-white/65">{lead.owner ?? "—"}</p><p className="mt-1 text-[10px] text-white/30">{lead.channel ?? lead.source ?? "—"}</p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">{isArabic ? "الأولوية" : "Score"}</p><p className={`mt-1 text-lg ${Number(lead.lead_score ?? 0) >= 70 ? "text-gold" : "text-white/70"}`}>{lead.lead_score ?? "—"}<span className="text-xs text-white/25">/100</span></p></div>
        <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">{isArabic ? "البريف" : "Brief"}</p><p className="mt-1 text-xs text-white/65">{briefLabel(lead.brief_status, isArabic)}</p>{lead.next_action_at ? <p className="mt-2 text-[10px] text-gold/60">{isArabic ? "متابعة مجدولة" : "Follow-up scheduled"}</p> : null}</div>
      </div>)}</div>
    </AdminCard>
  </AdminPageContainer>;
}
