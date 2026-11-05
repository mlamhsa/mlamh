import Link from "next/link";
import { AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "MLAMH AI Requests — Admin", robots: { index: false, follow: false } };
type PageProps = { searchParams: Promise<{lang?:string}> };
type Ticket = {id:number;ticket_number:string;sender_name:string;sender_email:string;sender_phone:string|null;status:string;created_at:string};
export default async function AIProductionAdminPage({searchParams}:PageProps){
 await requireAdminAccess();
 const {lang}=await searchParams;
 const ar=lang!=="en";
 const admin=createAdminClient();
 const {data,error}=await admin.from("support_tickets")
  .select("id,ticket_number,sender_name,sender_email,sender_phone,status,created_at")
  .eq("subject","MLAMH AI production request")
  .order("created_at",{ascending:false}).limit(100);
 if(error)throw new Error("Unable to load MLAMH AI requests");
 const tickets=(data??[]) as Ticket[];
 const pending=tickets.filter(t=>["new","open","in_progress","pending_user"].includes(t.status)).length;
 return <div dir={ar?"rtl":"ltr"}><AdminPageContainer>
 <AdminPageHeader eyebrow="MLAMH AI" title={ar?"طلبات الإنتاج بالذكاء الاصطناعي":"AI Production Requests"} description={ar?"طلبات العملاء الواردة من نموذج MLAMH AI، مع فتح كل طلب في نظام الدعم لإدارته والرد عليه.":"Client briefs received through MLAMH AI. Open any request in Support to manage and reply."}/>
 <section className="grid grid-cols-2 gap-3"><AdminStatCard label={ar?"إجمالي الطلبات":"Total requests"} value={tickets.length}/><AdminStatCard label={ar?"قيد المتابعة":"Active"} value={pending} active={pending>0}/></section>
 <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
 {tickets.length===0?<p className="p-8 text-center text-sm text-white/50">{ar?"لا توجد طلبات MLAMH AI حتى الآن.":"No MLAMH AI requests yet."}</p>:<div className="divide-y divide-white/10">{tickets.map(t=><Link key={t.id} href={`/admin/support/${t.id}?lang=${ar?"ar":"en"}`} className="block px-4 py-4 transition hover:bg-white/5 sm:px-6">
 <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-xs text-amber-400" dir="ltr">{t.ticket_number}</span><span className="text-xs text-white/45">{new Intl.DateTimeFormat(ar?"ar-SA":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(t.created_at))}</span></div>
 <div className="mt-2 flex flex-wrap items-center gap-2"><strong className="text-sm text-white">{t.sender_name}</strong><span className="rounded-full border border-amber-400/20 px-2 py-0.5 text-xs text-amber-300">{t.status}</span></div>
 <p className="mt-1 text-xs text-white/50" dir="ltr">{t.sender_email}{t.sender_phone?` · ${t.sender_phone}`:""}</p>
 </Link>)}</div>}
 </section>
 </AdminPageContainer></div>;
}