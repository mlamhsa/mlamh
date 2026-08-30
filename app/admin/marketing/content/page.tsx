import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingContentAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function ContentStudioPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [{ data, error }, campaignsResult] = await Promise.all([
    db.from("marketing_content").select("id,title,hook,content_type,channel,objective,language,status,scheduled_at,published_at,agent_id,created_at").order("created_at", { ascending: false }).limit(150),
    db.from("marketing_campaigns").select("id,name,status").in("status", ["draft","active","paused"]).order("created_at", { ascending: false }).limit(100),
  ]);
  const items = data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const drafts = items.filter((item) => ["idea","draft","review"].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === "approval").length;
  const scheduled = items.filter((item) => item.status === "scheduled").length;
  const published = items.filter((item) => ["published","measured"].includes(item.status)).length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "استوديو المحتوى" : "Content Studio"} description={isArabic ? "Pipeline حقيقي للفكرة والمسودة والمراجعة والاعتماد والجدولة والنشر والقياس." : "Real pipeline for ideas, drafts, review, approval, scheduling, publishing, and measurement."} />
    <AdminCard className="mb-5 p-5"><form action={createMarketingContentAction} className="grid gap-3 lg:grid-cols-3"><input name="title" placeholder={isArabic ? "عنوان المحتوى" : "Content title"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="hook" placeholder="Hook" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="content_type" defaultValue="post" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="post">Post</option><option value="reel">Reel</option><option value="story">Story</option><option value="carousel">Carousel</option><option value="linkedin_post">LinkedIn Post</option><option value="email">Email</option><option value="whatsapp_campaign">WhatsApp Campaign</option></select><input name="channel" placeholder="channel" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="objective" placeholder={isArabic ? "الهدف" : "Objective"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><select name="language" defaultValue="ar" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="ar">العربية</option><option value="en">English</option></select><select name="campaign_id" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="">{isArabic ? "بدون حملة" : "No campaign"}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select><select name="agent_id" defaultValue="reem" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="reem">Reem</option><option value="sarah">Sarah</option><option value="faisal">Faisal</option><option value="nora">Nora</option></select><input name="cta" placeholder="CTA" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><input name="caption" placeholder="Caption" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white lg:col-span-2"/><input name="body" placeholder={isArabic ? "النص" : "Body"} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"/><button className="rounded-xl bg-gold px-4 py-2 text-sm text-black lg:col-span-3">{isArabic ? "إنشاء مسودة" : "Create draft"}</button></form></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "Content Studio جاهز معماريًا لكن الجداول غير مفعلة بعد." : "Content Studio architecture is ready, but tables are not active yet."}</AdminCard> : null}
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={isArabic ? "تحت الإعداد" : "In progress"} value={drafts} /><AdminStatCard label={isArabic ? "بانتظار اعتماد" : "Waiting approval"} value={waiting} /><AdminStatCard label={isArabic ? "مجدول" : "Scheduled"} value={scheduled} /><AdminStatCard label={isArabic ? "منشور" : "Published"} value={published} /></AdminGrid>
    <AdminCard className="overflow-hidden"><div className="divide-y divide-white/[0.07]">{items.length === 0 ? <div className="p-6 text-sm text-white/40">{isArabic ? "لا يوجد محتوى حقيقي بعد." : "No real content records yet."}</div> : items.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.6fr_.8fr_.8fr_.8fr_.8fr]"><div><div className="text-sm text-white">{item.title ?? item.hook ?? `#${item.id}`}</div><div className="mt-1 text-xs text-white/35">{item.objective ?? "—"}</div></div><div className="text-xs text-white/55">{item.content_type}</div><div className="text-xs text-white/55">{item.channel ?? "—"}</div><div className="text-xs text-white/55">{item.agent_id ?? "—"} · {item.language}</div><div className="text-xs text-gold">{item.status}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
