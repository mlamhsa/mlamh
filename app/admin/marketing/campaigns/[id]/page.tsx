import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };
function statusLabel(value:string|null,ar:boolean){if(!value)return "—";const m:Record<string,[string,string]>={draft:["مسودة","Draft"],pending:["بانتظار الاعتماد","Pending approval"],approved:["معتمدة","Approved"],active:["نشطة","Active"],paused:["متوقفة مؤقتًا","Paused"],completed:["مكتملة","Completed"],ready:["جاهز","Ready"],published:["منشور","Published"],failed:["فشل","Failed"],scheduled:["مجدول","Scheduled"],waiting_approval:["بانتظار الاعتماد","Waiting approval"]};return m[value]?.[ar?0:1]??value.replaceAll("_"," ");}

export default async function CampaignWorkspacePage({params,searchParams}:PageProps){
  await requireAdminAccess();
  const [{id},{lang}]=await Promise.all([params,searchParams]);
  const campaignId=Number(id);
  if(!Number.isInteger(campaignId)||campaignId<=0)notFound();
  const language=getAdminLanguage(lang);
  const ar=language==="ar";
  const db=createAdminClient();
  const campaignResult=await db.from("marketing_campaigns").select("id,name,objective,status,start_at,end_at,budget,channels,owner,utm_campaign,created_at").eq("id",campaignId).maybeSingle();
  const campaign=campaignResult.data;
  if(!campaign)notFound();
  const creativesResult=await db.from("marketing_creatives").select("id,content_id,type,platform,aspect_ratio,status,preview_path,version,created_at").eq("campaign_id",campaignId).order("created_at",{ascending:false}).limit(100);
  const creatives=creativesResult.data??[];
  const contentIds=[...new Set(creatives.map(item=>item.content_id).filter((value):value is number=>typeof value==="number"))];
  const [contentResult,jobsResult]=await Promise.all([
    contentIds.length?db.from("marketing_content").select("id,title,hook,caption,channel,status,content_type,scheduled_at,published_at,created_at").in("id",contentIds).order("created_at",{ascending:false}):Promise.resolve({data:[],error:null}),
    contentIds.length?db.from("marketing_channel_jobs").select("id,content_id,channel,status,scheduled_at,published_at,last_error,created_at").in("content_id",contentIds).order("created_at",{ascending:false}):Promise.resolve({data:[],error:null}),
  ]);
  const contents=contentResult.data??[];
  const jobs=jobsResult.data??[];
  const readyCreatives=creatives.filter(item=>["ready","approved"].includes(item.status)).length;
  const publishedJobs=jobs.filter(item=>item.status==="published").length;
  const attentionJobs=jobs.filter(item=>["failed","waiting_approval"].includes(item.status)).length;

  return <AdminPageContainer>
    <div className="mb-4"><Link href={`/admin/marketing/campaigns?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{ar?"← العودة إلى الحملات":"← Back to campaigns"}</Link></div>
    <AdminPageHeader eyebrow={ar?"MLAMH · مساحة عمل الحملة":"MLAMH · CAMPAIGN WORKSPACE"} title={campaign.name} description={campaign.objective??(ar?"مساحة تشغيل موحدة للحملة: الكرياتيف والمحتوى وحالة النشر في شاشة واحدة.":"Unified campaign operations: creative, content, and publishing status in one workspace.")} />
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={ar?"حالة الحملة":"Campaign status"} value={statusLabel(campaign.status,ar)}/><AdminStatCard label={ar?"الأصول الإبداعية":"Creative assets"} value={creatives.length}/><AdminStatCard label={ar?"جاهز للمراجعة":"Ready creative"} value={readyCreatives}/><AdminStatCard label={ar?"منشور":"Published jobs"} value={publishedJobs}/></AdminGrid>
    <AdminCard className="mb-6 p-5"><div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-5"><div><p className="text-white/30">{ar?"المالك":"Owner"}</p><p className="mt-1 text-white/70">{campaign.owner??"—"}</p></div><div><p className="text-white/30">{ar?"القنوات":"Channels"}</p><p className="mt-1 text-white/70">{(campaign.channels??[]).join(" · ")||"—"}</p></div><div><p className="text-white/30">{ar?"الميزانية":"Budget"}</p><p className="mt-1 text-white/70">{campaign.budget??"—"}</p></div><div><p className="text-white/30">{ar?"التتبع":"Tracking"}</p><p className="mt-1 text-white/70">{campaign.utm_campaign??"—"}</p></div><div><p className="text-white/30">{ar?"يحتاج انتباه":"Needs attention"}</p><p className={`mt-1 ${attentionJobs>0?"text-amber-200":"text-emerald-200"}`}>{attentionJobs}</p></div></div></AdminCard>
    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"الكرياتيف":"Creative"}</h2><Link href={`/admin/marketing/creative?lang=${language}`} className="text-xs text-gold/70">{ar?"كل الكرياتيف ←":"All creative →"}</Link></div><div className="divide-y divide-white/[0.06]">{creatives.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا توجد أصول إبداعية مرتبطة بهذه الحملة بعد.":"No creative assets linked to this campaign yet."}</div>:creatives.map(item=><div key={item.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white/75">{item.type} · {item.platform??"—"}</p><p className="mt-1 text-xs text-white/35">{item.aspect_ratio??"—"} · v{item.version}</p></div><AdminBadge variant={["ready","approved","published"].includes(item.status)?"success":"muted"}>{statusLabel(item.status,ar)}</AdminBadge></div></div>)}</div></AdminCard>
      <AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"المحتوى":"Content"}</h2><Link href={`/admin/marketing/content?lang=${language}`} className="text-xs text-gold/70">{ar?"استوديو المحتوى ←":"Content Studio →"}</Link></div><div className="divide-y divide-white/[0.06]">{contents.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا يوجد محتوى مربوط بكرياتيف هذه الحملة بعد.":"No content linked through this campaign's creative assets yet."}</div>:contents.map(item=><div key={item.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white/75">{item.title??item.hook??`Content #${item.id}`}</p><p className="mt-1 text-xs text-white/35">{item.content_type??"—"} · {item.channel??"—"}</p></div><AdminBadge variant={["published","measured"].includes(item.status)?"success":item.status==="approval"?"warning":"muted"}>{statusLabel(item.status,ar)}</AdminBadge></div></div>)}</div></AdminCard>
    </div>
    <AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-gold/60">{ar?"التنفيذ الاجتماعي":"SOCIAL EXECUTION"}</p><h2 className="mt-1 text-base text-white">{ar?"حالة النشر":"Publishing status"}</h2></div><Link href={`/admin/marketing/social?lang=${language}`} className="text-xs text-gold/70">{ar?"فتح المجدول ←":"Open scheduler →"}</Link></div><div className="divide-y divide-white/[0.06]">{jobs.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا توجد مهام نشر مرتبطة بمحتوى الحملة بعد.":"No publishing jobs linked to campaign content yet."}</div>:jobs.map(job=><div key={job.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.4fr_.7fr_.8fr]"><div><p className="text-sm text-white/75">{contents.find(item=>item.id===job.content_id)?.title??`Content #${job.content_id}`}</p><p className="mt-1 text-xs text-white/30">{job.channel}</p></div><div className="text-xs text-gold/70">{statusLabel(job.status,ar)}</div><div className="text-xs text-white/35">{job.scheduled_at??job.published_at??(ar?"بدون موعد":"No date")}{job.last_error?<p className="mt-1 text-red-200/70">{job.last_error}</p>:null}</div></div>)}</div></AdminCard>
  </AdminPageContainer>;
}
