import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic="force-dynamic";
type PageProps={searchParams:Promise<{lang?:string;campaign_id?:string}>};
function statusLabel(value:string,ar:boolean){const m:Record<string,[string,string]>={draft:["مسودة","Draft"],ready:["جاهز للمراجعة","Ready for review"],approved:["معتمد","Approved"],published:["منشور","Published"],archived:["مؤرشف","Archived"]};return m[value]?.[ar?0:1]??value;}
function typeLabel(value:string,ar:boolean){const m:Record<string,[string,string]>={image:["صورة","Image"],video:["فيديو","Video"],story:["ستوري","Story"],reel:["ريلز","Reel"],carousel:["كاروسيل","Carousel"],post:["منشور","Post"]};return m[value]?.[ar?0:1]??value;}

export default async function CreativeStudioPage({searchParams}:PageProps){
  await requireAdminAccess();
  const {lang,campaign_id}=await searchParams;
  const language=getAdminLanguage(lang);
  const isArabic=language==="ar";
  const requestedCampaignId=Number(campaign_id);
  const selectedCampaignId=Number.isInteger(requestedCampaignId)&&requestedCampaignId>0?requestedCampaignId:null;
  const db=createAdminClient();
  let query=db.from("marketing_creatives").select("id,content_id,campaign_id,type,platform,aspect_ratio,status,storage_path,preview_path,created_by_agent_id,version,created_at").order("created_at",{ascending:false}).limit(150);
  if(selectedCampaignId)query=query.eq("campaign_id",selectedCampaignId);
  const [{data,error},campaignsResult]=await Promise.all([query,db.from("marketing_campaigns").select("id,name,status").order("created_at",{ascending:false}).limit(100)]);
  const rows=data??[];
  const campaigns=campaignsResult.data??[];
  const campaignNames=new Map(campaigns.map(item=>[item.id,item.name]));
  const selectedCampaign=selectedCampaignId?campaigns.find(item=>item.id===selectedCampaignId)??null:null;
  const ready=rows.filter(i=>["ready","approved"].includes(i.status)).length;
  const published=rows.filter(i=>i.status==="published").length;
  const drafts=rows.filter(i=>i.status==="draft").length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic?"Creative Studio":"Creative Studio"} description={isArabic?"مكتبة تشغيلية للكرياتيف: افتح الأصل، راجع سياقه، واربطه بالحملة والمحتوى وحالة النشر.":"An operational creative library: open each asset, review context, and follow campaign, content and publishing state."}/>
    {selectedCampaign?<AdminCard className="mb-5 border-gold/20 bg-gold/[0.05] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-gold/60">{isArabic?"كرياتيف الحملة المحددة":"SELECTED CAMPAIGN CREATIVE"}</p><p className="mt-1 text-sm font-medium text-white">{selectedCampaign.name}</p></div><div className="flex gap-2"><Link href={`/admin/marketing/campaigns/${selectedCampaign.id}?lang=${language}`} className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold">{isArabic?"مساحة الحملة":"Campaign workspace"}</Link><Link href={`/admin/marketing/creative?lang=${language}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">{isArabic?"عرض الكل":"Show all"}</Link></div></div></AdminCard>:null}
    <AdminGrid className="mb-6 md:grid-cols-3"><AdminStatCard label={isArabic?"مسودات":"Drafts"} value={drafts}/><AdminStatCard label={isArabic?"جاهز للمراجعة":"Ready"} value={ready}/><AdminStatCard label={isArabic?"منشور":"Published"} value={published}/></AdminGrid>
    {error?<AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic?"تعذر تحميل ملفات Creative Studio.":"Creative Studio data is unavailable."}</AdminCard>:null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.length===0?<AdminCard className="p-6 md:col-span-2 xl:col-span-3"><p className="text-sm text-white/60">{selectedCampaign?(isArabic?"لا توجد أصول إبداعية مرتبطة بهذه الحملة بعد.":"No creative assets linked to this campaign yet."):(isArabic?"لا توجد أصول إبداعية بعد.":"No creative assets yet.")}</p></AdminCard>:rows.map(item=><AdminCard key={item.id} className="overflow-hidden"><Link href={`/admin/marketing/creative/${item.id}?lang=${language}`} className="block"><div className="flex aspect-[16/8] items-center justify-center border-b border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-gold/[0.035]"><div className="text-center"><p className="text-2xl text-white/20">{item.aspect_ratio||"—"}</p><p className="mt-2 text-[10px] uppercase tracking-[.18em] text-white/25">{item.platform||"MLAMH"}</p></div></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white hover:text-gold">{typeLabel(item.type,isArabic)}</p><p className="mt-1 text-xs text-white/35">{item.platform||"—"} · {item.aspect_ratio||"—"}</p>{item.campaign_id?<p className="mt-2 text-[11px] text-gold/55">{campaignNames.get(item.campaign_id)??`Campaign #${item.campaign_id}`}</p>:null}</div><span className="rounded-full border border-gold/15 bg-gold/[0.05] px-2.5 py-1 text-[10px] text-gold">{statusLabel(item.status,isArabic)}</span></div><div className="mt-4 flex items-center justify-between text-[11px] text-white/30"><span>{isArabic?"الإصدار":"Version"} {item.version}</span><span className="text-gold/70">{isArabic?"فتح الأصل ←":"Open asset →"}</span></div></div></Link></AdminCard>)}</div>
  </AdminPageContainer>;
}
