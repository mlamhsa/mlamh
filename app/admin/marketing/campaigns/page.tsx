import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingCampaignAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function CampaignsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_campaigns").select("id,name,objective,status,start_at,end_at,budget,channels,owner,utm_campaign,created_at").order("created_at", { ascending: false }).limit(100);
  const campaigns = data ?? [];
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "الحملات" : "Campaigns"} description={isArabic ? "الحملة تنشأ Draft ثم تمر بالاعتماد قبل التفعيل، مع دعم Zero-Budget وPaid مستقبلًا." : "Campaigns start as drafts and pass approval before activation, supporting zero-budget now and paid later."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingCampaignAction} className="grid gap-3 lg:grid-cols-3"><input name="name" required placeholder={isArabic ? "اسم الحملة" : "Campaign name"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="goal" placeholder={isArabic ? "المؤشر المستهدف" : "Goal"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="channels" placeholder="instagram,facebook,linkedin" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="owner" defaultValue="nora" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="nora">Nora</option><option value="reem">Reem</option><option value="faisal">Faisal</option><option value="ceo">CEO</option></select><input name="budget" type="number" min="0" step="0.01" placeholder={isArabic ? "الميزانية (0 مسموح)" : "Budget (0 allowed)"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="start_at" type="datetime-local" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="end_at" type="datetime-local" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="utm_campaign" placeholder="utm_campaign" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "إنشاء وإرسال للاعتماد" : "Create & request approval"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "جداول الحملات غير مفعلة بعد." : "Campaign tables are not active yet."}</AdminCard> : null}
    <div className="grid gap-4">{campaigns.length === 0 ? <AdminCard className="p-6 text-sm text-white/40">{isArabic ? "لا توجد حملات حقيقية بعد." : "No real campaigns yet."}</AdminCard> : campaigns.map((item) => <AdminCard key={item.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-base text-white">{item.name}</div><div className="mt-1 text-sm text-white/45">{item.objective ?? "—"}</div></div><span className="text-xs text-gold">{item.status}</span></div><div className="mt-4 grid gap-3 text-xs text-white/45 sm:grid-cols-4"><div>{isArabic ? "المالك" : "Owner"}<div className="mt-1 text-white/70">{item.owner ?? "—"}</div></div><div>{isArabic ? "القنوات" : "Channels"}<div className="mt-1 text-white/70">{(item.channels ?? []).join(", ") || "—"}</div></div><div>{isArabic ? "الميزانية" : "Budget"}<div className="mt-1 text-white/70">{item.budget ?? 0}</div></div><div>UTM<div className="mt-1 text-white/70">{item.utm_campaign ?? "—"}</div></div></div></AdminCard>)}</div>
  </AdminPageContainer>;
}
