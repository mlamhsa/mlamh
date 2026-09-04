import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeScheduledChannelJobAction, publishChannelJobNowAction } from "./actions";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };
function stateLabel(status:string,ar:boolean){const m:Record<string,[string,string]>={approved:["جاهز للنشر","Ready to publish"],scheduled:["مجدول","Scheduled"],publishing:["جاري النشر","Publishing"],published:["منشور","Published"],failed:["فشل — يحتاج مراجعة","Failed — review"],waiting_approval:["بانتظار الاعتماد","Waiting approval"],draft:["مسودة","Draft"]};return m[status]?.[ar?0:1]??status.replaceAll("_"," ");}
function channelLabel(value:string,ar:boolean){if(!ar)return value;return({instagram:"Instagram",facebook:"Facebook",buffer:"Buffer"}as Record<string,string>)[value]??value;}

export default async function SocialPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language=getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();
  const { data, error } = await db.from("marketing_channel_jobs").select("id,content_id,task_id,approval_id,channel,status,scheduled_at,published_at,external_post_id,retry_count,last_error,payload,created_at").order("created_at", { ascending: false }).limit(150);
  const rows = data ?? [];
  const contentIds=[...new Set(rows.map(item=>item.content_id).filter((value):value is number=>typeof value==="number"))];
  const contentResult=contentIds.length?await db.from("marketing_content").select("id,title,hook,channel,status,content_type").in("id",contentIds):{data:[],error:null};
  const contentMap=new Map((contentResult.data??[]).map(item=>[item.id,item]));
  const waiting=rows.filter(item=>item.status==="waiting_approval").length;
  const ready=rows.filter(item=>item.status==="approved").length;
  const scheduled=rows.filter(item=>item.status==="scheduled").length;
  const attention=rows.filter(item=>item.status==="failed").length;

  return <AdminPageContainer>
    <AdminPageHeader title={isArabic?"جدولة السوشيال":"Social Scheduler"} description={isArabic?"شاشة تشغيل واضحة: ماذا سينشر، على أي قناة، ما حالته، وما الإجراء المطلوب. التفاصيل التقنية مخفية عند الحاجة فقط.":"Operator view of what will publish, where, its status, and the required action. Technical details stay secondary."} />
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={isArabic?"بانتظار الاعتماد":"Waiting approval"} value={waiting}/><AdminStatCard label={isArabic?"جاهز للنشر":"Ready"} value={ready}/><AdminStatCard label={isArabic?"مجدول":"Scheduled"} value={scheduled}/><AdminStatCard label={isArabic?"يحتاج مراجعة":"Needs review"} value={attention}/></AdminGrid>
    <AdminCard className="mb-5 p-4"><p className="text-sm text-white/65">{isArabic?"المسار: محتوى → اعتماد → جاهز للنشر أو مجدول → تنفيذ → منشور. الاعتماد وحده لا يعني النشر التلقائي.":"Flow: Content → Approval → Ready or Scheduled → Execute → Published. Approval alone does not auto-publish."}</p></AdminCard>
    {error ? <AdminCard className="mb-5 p-5 text-sm text-amber-200">{isArabic ? "تعذر تحميل جدولة السوشيال." : "Social Scheduler is unavailable."}</AdminCard> : null}
    <div className="grid gap-4">{rows.length===0?<AdminCard className="p-6 text-sm text-white/40">{isArabic?"لا توجد منشورات في مسار الجدولة بعد.":"No social publishing jobs yet."}</AdminCard>:rows.map(item=>{const payload=item.payload&&typeof item.payload==="object"&&!Array.isArray(item.payload)?item.payload as Record<string,unknown>:{};const target=typeof payload.target==="string"?payload.target:item.channel;const content=item.content_id?contentMap.get(item.content_id):null;return <AdminCard key={item.id} className="p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-white">{content?.title??content?.hook??(isArabic?"محتوى تسويقي":"Marketing content")}</p><span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55">{channelLabel(String(target),isArabic)}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] ${item.status==="failed"?"border-red-300/20 bg-red-300/10 text-red-200":item.status==="published"?"border-emerald-300/20 bg-emerald-300/10 text-emerald-200":"border-gold/20 bg-gold/[0.06] text-gold"}`}>{stateLabel(item.status,isArabic)}</span></div><p className="mt-2 text-xs text-white/40">{item.scheduled_at?(isArabic?`موعد النشر: ${new Date(item.scheduled_at).toLocaleString("ar-SA")}`:`Scheduled: ${new Date(item.scheduled_at).toLocaleString("en-US")}`):item.published_at?(isArabic?`نُشر: ${new Date(item.published_at).toLocaleString("ar-SA")}`:`Published: ${new Date(item.published_at).toLocaleString("en-US")}`):(isArabic?"لا يوجد موعد محدد":"No scheduled time")}</p>{item.last_error?<p className="mt-2 text-xs text-red-200/75">{item.last_error}</p>:null}<details className="mt-3 text-[10px] text-white/30"><summary className="cursor-pointer">{isArabic?"التفاصيل التقنية":"Technical details"}</summary><p className="mt-2">Job #{item.id} · Content #{item.content_id??"—"} · Approval #{item.approval_id??"—"} · Retry {item.retry_count}</p>{item.external_post_id?<p className="mt-1 break-all">{item.external_post_id}</p>:null}</details></div><div className="flex w-full flex-wrap gap-2 xl:w-auto">{item.status==="approved"||item.status==="failed"?<form action={publishChannelJobNowAction}><input type="hidden" name="job_id" value={item.id}/><button className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">{isArabic?"نشر الآن":"Publish now"}</button></form>:null}{item.status==="scheduled"?<form action={executeScheduledChannelJobAction}><input type="hidden" name="job_id" value={item.id}/><button className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60">{isArabic?"تنفيذ الموعد":"Execute schedule"}</button></form>:null}<Link href={`/admin/marketing/content?lang=${language}`} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/55 hover:border-gold/25 hover:text-gold">{isArabic?"فتح المحتوى":"Open content"}</Link></div></div></AdminCard>;})}</div>
  </AdminPageContainer>;
}
