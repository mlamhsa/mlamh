import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { MarketingLiveRefresh } from "@/components/admin/marketing/MarketingLiveRefresh";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };
type Agent = { id:string; name:string; role:string; status:string; autonomy_level:string; assigned_channels:string[]|null; current_task_id:number|null; last_action_at:string|null; next_scheduled_task_at:string|null; tasks_completed:number; tasks_failed:number; };
type Activity = { id:number; agent_id:string|null; task_id:number|null; action:string; reason:string|null; channel:string|null; error:string|null; result:Record<string,unknown>|null; created_at:string; };

const statusLabel: Record<string,{ar:string;en:string}> = {
  idle:{ar:"جاهز",en:"Ready"}, working:{ar:"يعمل الآن",en:"Working"}, waiting_approval:{ar:"ينتظر قرارًا",en:"Waiting approval"}, scheduled:{ar:"مجدول",en:"Scheduled"}, paused:{ar:"متوقف",en:"Paused"}, error:{ar:"يحتاج مراجعة",en:"Needs review"}
};
const activityLabel: Record<string,{ar:string;en:string}> = {
  task_created:{ar:"بدأ مهمة جديدة",en:"Task created"}, task_completed:{ar:"أكمل المهمة",en:"Task completed"}, task_retry_queued:{ar:"أعاد المهمة للمحاولة",en:"Queued for retry"}, task_failed:{ar:"تعذر إكمال المهمة",en:"Task failed"}, resolved:{ar:"حدد جهة الاتصال",en:"Contact resolved"}, lead:{ar:"جهز عميلاً محتملاً",en:"Lead prepared"}, brief:{ar:"جهز موجز العمل",en:"Brief prepared"}, matched:{ar:"طابق المواهب",en:"Talent matched"}, draft_prepared:{ar:"جهز المسودة",en:"Draft prepared"}, approval_requested:{ar:"طلب قرارك",en:"Approval requested"}, deduplicated:{ar:"منع تنفيذًا مكررًا",en:"Duplicate prevented"}
};
const roleAr: Record<string,string> = {
  "AI Community & Talent Growth": "نمو مجتمع المواهب",
  "AI Partnerships & Client Success Manager": "الشراكات ونجاح العملاء",
  "AI Content Strategist": "استراتيجية المحتوى",
  "AI Growth Strategist": "استراتيجية النمو",
  "AI Demand Generation": "توليد الطلب",
  "AI Performance Analyst": "تحليل الأداء",
  "AI Creative Strategist": "الإبداع التسويقي",
  "AI CRM & Lifecycle": "العلاقات ودورة العميل",
};
function formatTime(value:string,ar:boolean){return new Intl.DateTimeFormat(ar?"ar-SA":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}
function summary(a:Activity,ar:boolean){const l=activityLabel[a.action]??{ar:a.action,en:a.action};return `${ar?l.ar:l.en}${a.task_id?` · #${a.task_id}`:""}`;}
function roleLabel(role:string,ar:boolean){return ar?(roleAr[role]??role):role;}

export default async function MarketingAiTeamPage({searchParams}:PageProps){
 await requireAdminAccess(); const {lang}=await searchParams; const language=getAdminLanguage(lang); const ar=language==="ar"; const db=createAdminClient();
 const [{data:agents,error},{count:queued},{count:running},{count:approvals},activityResult]=await Promise.all([
  db.from("marketing_agents").select("id,name,role,status,autonomy_level,assigned_channels,current_task_id,last_action_at,next_scheduled_task_at,tasks_completed,tasks_failed").eq("is_active",true).order("id"),
  db.from("marketing_tasks").select("id",{count:"exact",head:true}).in("status",["queued","scheduled"]),
  db.from("marketing_tasks").select("id",{count:"exact",head:true}).eq("status","running"),
  db.from("marketing_approvals").select("id",{count:"exact",head:true}).eq("status","pending"),
  db.from("marketing_agent_activity").select("id,agent_id,task_id,action,reason,channel,error,result,created_at").order("created_at",{ascending:false}).limit(12)
 ]);
 if(error) console.error("[MarketingAiTeamPage]",error); const team=(agents??[]) as Agent[]; const activity=(activityResult.data??[]) as Activity[]; const names=new Map(team.map(a=>[a.id,a.name]);
 const totalCompleted=team.reduce((sum,a)=>sum+(a.tasks_completed??0),0); const totalFailed=team.reduce((sum,a)=>sum+(a.tasks_failed??0),0); const working=team.filter(a=>a.status==="working").length;
 return <AdminPageContainer><MarketingLiveRefresh intervalMs={5000}/><AdminPageHeader eyebrow={ar?"MLAMH · غرفة عمليات الفريق":"MLAMH · TEAM OPERATIONS"} title={ar?"فريق التسويق بالذكاء الاصطناعي":"AI Marketing Team"} description={ar?"اعرف من يعمل الآن، ماذا أنجز الفريق، وما الذي ينتظر قرارًا — دون الدخول في تفاصيل تقنية غير ضرورية.":"See who is working, what the team delivered, and what needs a decision without unnecessary technical noise."}/>
 {error?<AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm text-amber-100/80">{ar?"تعذر تحميل حالة الفريق الآن.":"Could not load team state."}</AdminCard>:null}
 <AdminGrid className="mb-5 md:grid-cols-4"><AdminStatCard label={ar?"يعمل الآن":"Working now"} value={working}/><AdminStatCard label={ar?"في الانتظار":"Queued"} value={queued??0}/><AdminStatCard label={ar?"تحتاج قرارك":"Needs approval"} value={approvals??0}/><AdminStatCard label={ar?"أنجزها الفريق":"Completed"} value={totalCompleted}/></AdminGrid>
 <AdminCard className="mb-8 overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${(running??0)>0?"animate-pulse bg-gold":"bg-emerald-400"}`}/><h2 className="text-sm font-medium text-white">{ar?"آخر تحركات الفريق":"Latest team moves"}</h2></div><p className="mt-1 text-xs text-white/35">{ar?"يتحدث تلقائيًا أثناء وجود عمل نشط.":"Refreshes automatically while work is active."}</p></div>{activity[0]&&<p className="text-[10px] text-white/30">{ar?"آخر تحديث":"Last update"}: {formatTime(activity[0].created_at,ar)}</p>}</div>
 <div className="divide-y divide-white/[0.06]">{activity.length===0?<p className="p-6 text-sm text-white/35">{ar?"لا توجد حركة حديثة.":"No recent activity."}</p>:activity.map(a=><div key={a.id} className="group flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.error?"bg-amber-300":"bg-emerald-400"}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-medium text-white/80">{a.agent_id?names.get(a.agent_id)??a.agent_id:"Marketing AI"}</p><p className="text-[10px] text-white/25">{formatTime(a.created_at,ar)}</p></div><p className="mt-1 text-sm text-white/55">{summary(a,ar)}</p>{a.reason&&<p className="mt-1 line-clamp-2 text-xs leading-5 text-white/30">{a.reason}</p>}</div></div>)}</div></AdminCard>
 <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{ar?"أعضاء الفريق":"TEAM FLOOR"}</p><h2 className="mt-1 text-xl text-white">{ar?"من يفعل ماذا؟":"Who owns what?"}</h2></div><p className="text-xs text-white/30">{team.length} {ar?"أعضاء نشطون":"active agents"}</p></div>
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{team.map(agent=>{const s=statusLabel[agent.status]??{ar:agent.status,en:agent.status};return <AdminCard key={agent.id} className="group p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-medium text-white">{agent.name}</p><p className="mt-1 text-xs leading-5 text-white/35">{roleLabel(agent.role,ar)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] ${agent.status==="working"?"border-gold/35 bg-gold/10 text-gold":agent.status==="error"?"border-amber-400/30 bg-amber-400/10 text-amber-200":"border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"}`}>{ar?s.ar:s.en}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-[9px] text-white/25">{ar?"مكتملة":"Completed"}</p><p className="mt-1 text-xl text-white/80">{agent.tasks_completed}</p></div><div className="rounded-xl border border-white/[0.06] bg-black/20 p-3"><p className="text-[9px] text-white/25">{ar?"تحتاج مراجعة":"Failed"}</p><p className="mt-1 text-xl text-white/80">{agent.tasks_failed}</p></div></div>{agent.current_task_id?<p className="mt-4 text-xs text-gold/70">{ar?"المهمة الحالية":"Current task"} · #{agent.current_task_id}</p>:<p className="mt-4 text-xs text-white/25">{ar?"لا توجد مهمة نشطة الآن":"No active assignment"}</p>}</AdminCard>})}</div>
 {totalFailed>0?<p className="mt-5 text-xs text-white/25">{ar?`هناك ${totalFailed} محاولات سابقة احتاجت مراجعة؛ الرقم تراكمي ولا يعني وجود عطل حالي.`:`${totalFailed} historical attempts required review; this is cumulative and does not imply a current outage.`}</p>:null}
 </AdminPageContainer>;
}
