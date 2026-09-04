import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };
function statusLabel(value:string|null,ar:boolean){if(!value)return "—";const m:Record<string,[string,string]>={draft:["مسودة","Draft"],pending:["بانتظار الاعتماد","Pending approval"],approved:["معتمدة","Approved"],active:["نشطة","Active"],paused:["متوقفة مؤقتًا","Paused"],completed:["مكتملة","Completed"],ready:["جاهز","Ready"],review:["مراجعة","Review"],approval:["بانتظار قرار","Waiting approval"],published:["منشور","Published"],measured:["تم القياس","Measured"],failed:["فشل","Failed"],scheduled:["مجدول","Scheduled"],waiting_approval:["بانتظار الاعتماد","Waiting approval"]};return m[value]?.[ar?0:1]??value.replaceAll("_"," ");}

export default async function CampaignWorkspacePage({params,searchParams}:PageProps){
  await requireAdminAccess();
  const [{id},{lang}]=await Promise.all([params,searchParams]);
  const campaignId=Number(id);
  if(!Number.isInteger(campaignId)||campaignId<=0)notFound();
  const language=getAdminLanguage(lang);
  const ar=language==="ar";
  const db=createAdminClient();
  const [campaignResult,contentResult,creativesResult,tasksResult]=await Promise.all([
    db.from("marketing_campaigns").select("id,name,objective,status,start_at,end_at,budget,channels,owner,utm_campaign,created_at").eq("id",campaignId).maybeSingle(),
    db.from("marketing_content").select("id,title,hook,caption,channel,status,content_type,scheduled_at,published_at,created_at").eq("campaign_id",campaignId).order("created_at",{ascending:false}).limit(100),
    db.from("marketing_creatives").select("id,content_id,type,platform,aspect_ratio,status,preview_path,storage_path,version,created_at").eq("campaign_id",campaignId).order("created_at",{ascending:false}).limit(100),
    db.from("marketing_tasks").select("id,title,status,agent_id,channel,approval_status,metadata,created_at").eq("campaign_id",campaignId).order("created_at",{ascending:false}).limit(100),
  ]);
  const campaign=campaignResult.data;
  if(!campaign)notFound();
  const contents=contentResult.data??[];
  const creatives=creativesResult.data??[];
  const tasks=tasksResult.data??[];
  const contentIds=contents.map(item=>item.id);
  const jobsResult=contentIds.length?await db.from("marketing_channel_jobs").select("id,content_id,channel,status,scheduled_at,published_at,last_error,created_at").in("content_id",contentIds).order("created_at",{ascending:false}):{data:[],error:null};
  const jobs=jobsResult.data??[];

  const attributionKey=campaign.utm_campaign?.trim()||null;
  async function eventCount(eventName:string){
    if(!attributionKey)return 0;
    const result=await db.from("marketing_events").select("id",{count:"exact",head:true}).eq("campaign",attributionKey).eq("event_name",eventName);
    return result.count??0;
  }
  const [visits,registrations,applications,briefs]=await Promise.all([eventCount("page_view"),eventCount("registration_completed"),eventCount("application_submitted"),eventCount("brief_received")]);

  const readyCreatives=creatives.filter(item=>["ready","approved","published"].includes(item.status)&&Boolean(item.preview_path||item.storage_path)).length;
  const publishedJobs=jobs.filter(item=>item.status==="published").length;
  const failedJobs=jobs.filter(item=>item.status==="failed").length;
  const waitingContent=contents.filter(item=>item.status==="approval").length;
  const pendingTasks=tasks.filter(item=>item.approval_status==="pending").length;
  const contentWithCreative=new Set(creatives.filter(item=>["ready","approved","published"].includes(item.status)&&Boolean(item.preview_path||item.storage_path)).map(item=>item.content_id).filter(Boolean));
  const visualTypes=new Set(["post","reel","story","carousel","video"]);
  const missingCreative=contents.filter(item=>visualTypes.has((item.content_type??"").toLowerCase())&&!contentWithCreative.has(item.id)&&!["published","measured"].includes(item.status)).length;
  const overdueTasks=tasks.filter(task=>{
    const metadata=task.metadata&&typeof task.metadata==="object"&&!Array.isArray(task.metadata)?task.metadata as Record<string,unknown>:{};
    const contract=metadata.operational_contract&&typeof metadata.operational_contract==="object"&&!Array.isArray(metadata.operational_contract)?metadata.operational_contract as Record<string,unknown>:{};
    const dueAt=typeof contract.due_at==="string"?new Date(contract.due_at).getTime():null;
    return Boolean(dueAt&&dueAt<Date.now()&&!["completed","cancelled"].includes(task.status));
  }).length;
  const attentionJobs=failedJobs+waitingContent+pendingTasks+missingCreative+overdueTasks;
  const registrationRate=visits>0?Math.round(registrations/visits*100):0;
  const applicationRate=registrations>0?Math.round(applications/registrations*100):0;

  const nextAction=missingCreative>0
    ? ar?`أكمل ${missingCreative} كرياتيف ناقص قبل إرسال المحتوى للاعتماد.`:`Complete ${missingCreative} missing creative asset(s) before approval.`
    : failedJobs>0
      ? ar?`راجع ${failedJobs} عملية نشر فاشلة قبل إضافة محتوى جديد.`:`Review ${failedJobs} failed publishing job(s) before adding more content.`
      : waitingContent+pendingTasks>0
        ? ar?`يوجد ${waitingContent+pendingTasks} قرار/اعتماد ينتظر الحسم.`:`${waitingContent+pendingTasks} approval item(s) need a decision.`
        : overdueTasks>0
          ? ar?`عالج ${overdueTasks} مهمة تجاوزت SLA داخل الحملة.`:`Resolve ${overdueTasks} task(s) that exceeded SLA.`
          : publishedJobs===0&&contents.length>0
            ? ar?"المحتوى موجود لكن لا يوجد نشر مكتمل بعد؛ جهّز أقرب عنصر للجدولة.":"Content exists but nothing is published yet; move the nearest item to scheduling."
            : ar?"الحملة مستقرة تشغيليًا؛ راقب الأداء وكرر أفضل ما يثبت نجاحه.":"Campaign operations are stable; monitor results and repeat what proves effective.";

  return <AdminPageContainer>
    <div className="mb-4"><Link href={`/admin/marketing/campaigns?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{ar?"← العودة إلى الحملات":"← Back to campaigns"}</Link></div>
    <AdminPageHeader eyebrow={ar?"MLAMH · مساحة عمل الحملة":"MLAMH · CAMPAIGN WORKSPACE"} title={campaign.name} description={campaign.objective??(ar?"مساحة تشغيل موحدة للحملة: المحتوى والكرياتيف والاعتماد وحالة النشر والنتائج في شاشة واحدة.":"Unified campaign operations: content, creative, approvals, publishing and results in one workspace.")} />

    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={ar?"المحتوى":"Content"} value={contents.length}/><AdminStatCard label={ar?"كرياتيف جاهز":"Creative ready"} value={readyCreatives}/><AdminStatCard label={ar?"يحتاج انتباه":"Needs attention"} value={attentionJobs}/><AdminStatCard label={ar?"منشور":"Published jobs"} value={publishedJobs}/></AdminGrid>

    <AdminCard className={`mb-6 border ${attentionJobs>0?"border-amber-300/15 bg-amber-300/[0.035]":"border-emerald-300/15 bg-emerald-300/[0.03]"} p-5`}><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar?"الخطوة التالية":"NEXT ACTION"}</p><p className="mt-2 text-sm leading-7 text-white/75">{nextAction}</p></AdminCard>

    <AdminCard className="mb-6 p-5"><div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><AdminBadge variant="gold">{statusLabel(campaign.status,ar)}</AdminBadge>{Number(campaign.budget??0)===0?<AdminBadge variant="success">Zero-Budget</AdminBadge>:null}{attributionKey?<AdminBadge variant="muted">UTM · {attributionKey}</AdminBadge>:<AdminBadge variant="warning">{ar?"بدون UTM":"No UTM"}</AdminBadge>}</div><div className="mt-4 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-5"><div><p className="text-white/30">{ar?"المالك":"Owner"}</p><p className="mt-1 text-white/70">{campaign.owner??"—"}</p></div><div><p className="text-white/30">{ar?"القنوات":"Channels"}</p><p className="mt-1 text-white/70">{(campaign.channels??[]).join(" · ")||"—"}</p></div><div><p className="text-white/30">{ar?"الميزانية":"Budget"}</p><p className="mt-1 text-white/70">{campaign.budget??"—"}</p></div><div><p className="text-white/30">{ar?"كرياتيف ناقص":"Missing creative"}</p><p className={`mt-1 ${missingCreative>0?"text-amber-200":"text-emerald-200"}`}>{missingCreative}</p></div><div><p className="text-white/30">{ar?"SLA متأخر":"SLA overdue"}</p><p className={`mt-1 ${overdueTasks>0?"text-red-200":"text-emerald-200"}`}>{overdueTasks}</p></div></div></div><div className="grid w-full gap-2 sm:grid-cols-2 xl:w-72 xl:grid-cols-1"><Link href={`/admin/marketing/content?lang=${language}&campaign_id=${campaign.id}`} className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center text-sm font-medium text-gold">{ar?"محتوى الحملة":"Campaign content"}</Link><Link href={`/admin/marketing/creative?lang=${language}&campaign_id=${campaign.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65">{ar?"كرياتيف الحملة":"Campaign creative"}</Link><Link href={`/admin/marketing/social?lang=${language}&campaign_id=${campaign.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65">{ar?"الجدولة والنشر":"Scheduling & publishing"}</Link><Link href={`/admin/marketing/analytics?lang=${language}${attributionKey?`&campaign=${encodeURIComponent(attributionKey)}`:""}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65">{ar?"قياس الحملة":"Campaign analytics"}</Link></div></div></AdminCard>

    <AdminCard className="mb-6 overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{ar?"الإسناد والنتائج":"ATTRIBUTION & RESULTS"}</p><h2 className="mt-1 text-base text-white">{ar?"من الوصول إلى الطلب":"From reach to demand"}</h2></div>{attributionKey?<div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-6"><Metric label={ar?"زيارات":"Visits"} value={visits}/><Metric label={ar?"تسجيلات":"Registrations"} value={registrations}/><Metric label={ar?"زيارة ← تسجيل":"Visit → Reg"} value={`${registrationRate}%`}/><Metric label={ar?"طلبات تقديم":"Applications"} value={applications}/><Metric label={ar?"تسجيل ← تقديم":"Reg → App"} value={`${applicationRate}%`}/><Metric label="Briefs" value={briefs} gold/></div>:<div className="p-5 text-sm leading-7 text-amber-100/70">{ar?"الحملة لا تحتوي utm_campaign؛ لا يمكن إسناد النتائج إليها بدقة حتى يتم اعتماد معرف تتبع واضح.":"This campaign has no utm_campaign, so results cannot be attributed reliably until tracking is defined."}</div>}</AdminCard>

    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"المحتوى":"Content"}</h2><Link href={`/admin/marketing/content?lang=${language}&campaign_id=${campaign.id}`} className="text-xs text-gold/70">{ar?"كل محتوى الحملة ←":"Campaign content →"}</Link></div><div className="divide-y divide-white/[0.06]">{contents.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا يوجد محتوى مرتبط بهذه الحملة بعد.":"No content linked to this campaign yet."}</div>:contents.map(item=><div key={item.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white/75">{item.title??item.hook??`Content #${item.id}`}</p><p className="mt-1 text-xs text-white/35">{item.content_type??"—"} · {item.channel??"—"}</p></div><div className="flex items-center gap-2">{visualTypes.has((item.content_type??"").toLowerCase())&&!contentWithCreative.has(item.id)&&!["published","measured"].includes(item.status)?<AdminBadge variant="warning">{ar?"بانتظار التصميم":"Needs creative"}</AdminBadge>:null}<AdminBadge variant={["published","measured"].includes(item.status)?"success":item.status==="approval"?"warning":"muted"}>{statusLabel(item.status,ar)}</AdminBadge></div></div></div>)}</div></AdminCard>
      <AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"الكرياتيف":"Creative"}</h2><Link href={`/admin/marketing/creative?lang=${language}&campaign_id=${campaign.id}`} className="text-xs text-gold/70">{ar?"كل كرياتيف الحملة ←":"Campaign creative →"}</Link></div><div className="divide-y divide-white/[0.06]">{creatives.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا توجد أصول إبداعية مرتبطة بهذه الحملة بعد.":"No creative assets linked to this campaign yet."}</div>:creatives.map(item=><Link key={item.id} href={`/admin/marketing/creative/${item.id}?lang=${language}`} className="block p-4 transition hover:bg-white/[0.02]"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white/75">{item.type} · {item.platform??"—"}</p><p className="mt-1 text-xs text-white/35">{item.aspect_ratio??"—"} · v{item.version}</p></div><AdminBadge variant={["ready","approved","published"].includes(item.status)&&Boolean(item.preview_path||item.storage_path)?"success":"muted"}>{statusLabel(item.status,ar)}</AdminBadge></div></Link>)}</div></AdminCard>
    </div>

    <div className="grid gap-5 xl:grid-cols-2"><AdminCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"مهام الفريق":"Team tasks"}</h2></div><div className="divide-y divide-white/[0.06]">{tasks.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا توجد مهام مرتبطة بالحملة.":"No campaign tasks."}</div>:tasks.slice(0,12).map(task=><div key={task.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-white/75">{task.title}</p><p className="mt-1 text-xs text-white/35">{task.agent_id??"—"} · {task.channel??"internal"}</p></div><span className="text-xs text-gold/70">{statusLabel(task.status,ar)}</span></div></div>)}</div></AdminCard><AdminCard className="overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar?"التنفيذ الاجتماعي":"Social execution"}</h2><Link href={`/admin/marketing/social?lang=${language}&campaign_id=${campaign.id}`} className="text-xs text-gold/70">{ar?"فتح المجدول ←":"Open scheduler →"}</Link></div><div className="divide-y divide-white/[0.06]">{jobs.length===0?<div className="p-5 text-sm text-white/35">{ar?"لا توجد عمليات نشر مرتبطة بالحملة.":"No publishing jobs for this campaign."}</div>:jobs.slice(0,12).map(job=><div key={job.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-white/75">{contents.find(item=>item.id===job.content_id)?.title??`Content #${job.content_id}`}</p><p className="mt-1 text-xs text-white/35">{job.channel}</p>{job.last_error?<p className="mt-1 text-xs text-red-200/70">{job.last_error}</p>:null}</div><span className="text-xs text-gold/70">{statusLabel(job.status,ar)}</span></div></div>)}</div></AdminCard></div>
  </AdminPageContainer>;
}

function Metric({label,value,gold=false}:{label:string;value:string|number;gold?:boolean}){return <div className="bg-black/20 p-4"><p className="text-[10px] text-white/35">{label}</p><p className={`mt-2 text-2xl ${gold?"text-gold":"text-white"}`}>{value}</p></div>}
