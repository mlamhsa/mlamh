import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> };
function stageLabel(value: string | null, ar: boolean) { if (!value) return "—"; if (!ar) return value.replaceAll("_", " "); return ({ new: "جديد", contacted: "تم التواصل", replied: "تم الرد", qualified: "مؤهل", brief_received: "البريف مستلم", opportunity: "تحول إلى فرصة", won: "تم كسبه", lost: "مغلق" } as Record<string, string>)[value] ?? value.replaceAll("_", " "); }
function briefLabel(value: string | null, ar: boolean) { if (!value) return ar ? "غير مطلوب" : "Not requested"; if (!ar) return value.replaceAll("_", " "); return ({ not_requested: "غير مطلوب", requested: "مطلوب", partial: "جزئي", complete: "مكتمل" } as Record<string, string>)[value] ?? value.replaceAll("_", " "); }
function contactRole(metadata: unknown) { if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null; const row = metadata as Record<string, unknown>; const value = row.job_title ?? row.role ?? row.title; return typeof value === "string" && value.trim() ? value.trim() : null; }
function taskStatusLabel(value: string | null, ar: boolean) { if (!value) return "—"; if (!ar) return value.replaceAll("_", " "); return ({ queued: "في قائمة العمل", scheduled: "مجدولة", running: "يعمل عليها الفريق", waiting_approval: "بانتظار اعتماد", completed: "مكتملة", failed: "تحتاج مراجعة", cancelled: "ملغاة" } as Record<string, string>)[value] ?? value.replaceAll("_", " "); }

export default async function LeadWorkspacePage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const leadId = Number(id);
  if (!Number.isInteger(leadId) || leadId <= 0) notFound();
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const db = createAdminClient();
  const [leadResult, outreachResult, followupsResult, briefsResult, conversationsResult, prepTasksResult] = await Promise.all([
    db.from("marketing_leads").select("id,organization,contact_id,source,channel,owner,stage,lead_score,demand_signal,opportunity_type,city,last_contact_at,next_action_at,brief_status,tags,created_at").eq("id", leadId).maybeSingle(),
    db.from("marketing_outreach").select("id,channel,send_status,reply_status,outcome,created_at,next_follow_up_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(20),
    db.from("marketing_followups").select("id,follow_up_at,reason,channel,owner,status,next_action").eq("lead_id", leadId).order("follow_up_at", { ascending: true }).limit(20),
    db.from("marketing_briefs").select("id,project_type,status,opportunity_id,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(20),
    db.from("marketing_conversations").select("id,channel,status,stage,last_message_at,unread_count,priority").eq("lead_id", leadId).order("last_message_at", { ascending: false, nullsFirst: false }).limit(20),
    db.from("marketing_tasks").select("id,agent_id,task_type,title,status,created_at,completed_at").eq("lead_id", leadId).in("task_type", ["lead_enrichment", "outreach_preparation"]).order("created_at", { ascending: false }).limit(10),
  ]);
  const lead = leadResult.data;
  if (!lead) notFound();

  const contactResult = lead.contact_id
    ? await db.from("marketing_contacts").select("id,contact_name,email,phone,linkedin_url,website,metadata,updated_at").eq("id", lead.contact_id).maybeSingle()
    : { data: null };
  const contact = contactResult.data;
  const role = contactRole(contact?.metadata);
  const hasNamedContact = Boolean(contact?.contact_name?.trim());
  const hasLinkedIn = Boolean(contact?.linkedin_url?.trim());
  const hasEmail = Boolean(contact?.email?.trim());
  const outreachReady = hasNamedContact && (hasLinkedIn || hasEmail);
  const missingReadiness = [
    !hasNamedContact ? (ar ? "اسم الشخص المسؤول" : "named decision-maker") : null,
    !role ? (ar ? "المنصب" : "role/title") : null,
    !hasLinkedIn && !hasEmail ? (ar ? "قناة تواصل موثقة" : "verified outreach channel") : null,
  ].filter((item): item is string => Boolean(item));
  const prepTasks = prepTasksResult.data ?? [];
  const activePrepTask = prepTasks.find((item) => ["queued", "scheduled", "running", "waiting_approval"].includes(item.status)) ?? prepTasks[0] ?? null;

  const outreach = outreachResult.data ?? [];
  const followups = followupsResult.data ?? [];
  const briefs = briefsResult.data ?? [];
  const conversations = conversationsResult.data ?? [];
  const sent = outreach.filter((item) => item.send_status === "sent").length;
  const replies = outreach.filter((item) => item.reply_status && item.reply_status !== "none").length;
  const openFollowups = followups.filter((item) => !["completed", "cancelled", "sent"].includes(item.status ?? "")).length;
  const linked = (href: string) => `${href}?lang=${language}&lead_id=${lead.id}`;

  return <AdminPageContainer>
    <div className="mb-4"><Link href={`/admin/marketing/leads?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{ar ? "← العودة إلى العملاء المحتملين" : "← Back to leads"}</Link></div>
    <AdminPageHeader eyebrow={ar ? "MLAMH · مساحة عمل العميل" : "MLAMH · LEAD WORKSPACE"} title={lead.organization} description={ar ? "كل ما يتعلق بهذا العميل المحتمل في شاشة تشغيل واحدة: التجهيز، التواصل، الردود، المتابعات، البريف والتحويل إلى فرصة." : "One operational workspace for readiness, outreach, replies, follow-ups, briefs, and opportunity conversion."} />
    <AdminGrid className="mb-6 md:grid-cols-4"><AdminStatCard label={ar ? "الأولوية" : "Lead score"} value={`${lead.lead_score ?? "—"}/100`}/><AdminStatCard label={ar ? "تم الإرسال" : "Sent"} value={sent}/><AdminStatCard label={ar ? "الردود" : "Replies"} value={replies}/><AdminStatCard label={ar ? "متابعات مفتوحة" : "Open follow-ups"} value={openFollowups}/></AdminGrid>

    <AdminCard className={`mb-6 overflow-hidden ${outreachReady ? "border-emerald-400/20 bg-emerald-400/[0.035]" : "border-amber-300/20 bg-amber-300/[0.035]"}`}>
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><AdminBadge variant={outreachReady ? "success" : "warning"}>{outreachReady ? (ar ? "جاهز للتواصل" : "OUTREACH READY") : (ar ? "بانتظار تجهيز الفريق" : "RESEARCH REQUIRED")}</AdminBadge>{activePrepTask ? <AdminBadge variant="muted">{taskStatusLabel(activePrepTask.status, ar)}</AdminBadge> : null}</div>
            <h2 className="mt-3 text-lg font-medium text-white">{outreachReady ? (ar ? "بيانات الشخص المستهدف جاهزة للمراجعة والتواصل" : "Target contact is ready for review and outreach") : (ar ? "لن نطلب منك البحث عن بيانات العميل يدويًا" : "You should not have to research this lead manually")}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">{outreachReady ? (ar ? "يستطيع Layan تجهيز الرسالة والمتابعة، ثم يصل لك قرار الاعتماد فقط. الإرسال الخارجي يبقى خاضعًا للحوكمة." : "Layan can prepare the message and follow-up so only the approval decision reaches you. External sending remains governed.") : (ar ? `Salman مسؤول عن استكمال بيانات التواصل الموثقة قبل فتح Outreach. الناقص الآن: ${missingReadiness.join("، ") || "بيانات إضافية"}.` : `Salman owns verified contact enrichment before Outreach opens. Missing: ${missingReadiness.join(", ") || "additional data"}.`)}</p>
          </div>
          <div className="min-w-64 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-xs">
            <div className="grid gap-2"><div className="flex justify-between gap-3"><span className="text-white/30">{ar ? "الشخص" : "Contact"}</span><span className="text-white/75">{contact?.contact_name ?? "—"}</span></div><div className="flex justify-between gap-3"><span className="text-white/30">{ar ? "المنصب" : "Role"}</span><span className="text-white/75">{role ?? "—"}</span></div><div className="flex justify-between gap-3"><span className="text-white/30">LinkedIn</span><span className={hasLinkedIn ? "text-emerald-300" : "text-white/30"}>{hasLinkedIn ? (ar ? "متوفر" : "Available") : "—"}</span></div><div className="flex justify-between gap-3"><span className="text-white/30">Email</span><span className={hasEmail ? "text-emerald-300" : "text-white/30"}>{hasEmail ? (ar ? "متوفر" : "Available") : "—"}</span></div></div>
          </div>
        </div>
      </div>
    </AdminCard>

    <AdminCard className="mb-6 p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><AdminBadge variant="gold">{stageLabel(lead.stage, ar)}</AdminBadge><AdminBadge variant={lead.brief_status === "complete" ? "success" : "muted"}>{briefLabel(lead.brief_status, ar)}</AdminBadge>{lead.channel ? <AdminBadge variant="muted">{lead.channel}</AdminBadge> : null}</div><div className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-white/30">{ar ? "المدينة" : "City"}</p><p className="mt-1 text-white/70">{lead.city ?? "—"}</p></div><div><p className="text-white/30">{ar ? "نوع الطلب" : "Opportunity type"}</p><p className="mt-1 text-white/70">{lead.opportunity_type ?? "—"}</p></div><div><p className="text-white/30">{ar ? "المسؤول" : "Owner"}</p><p className="mt-1 text-white/70">{lead.owner ?? "—"}</p></div><div><p className="text-white/30">{ar ? "المصدر" : "Source"}</p><p className="mt-1 text-white/70">{lead.source ?? "—"}</p></div></div>{lead.demand_signal ? <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-6 text-white/55">{lead.demand_signal}</div> : null}</div><div className="grid w-full gap-2 sm:grid-cols-2 lg:w-72 lg:grid-cols-1">{outreachReady ? <Link href={`/admin/marketing/outreach/lead/${lead.id}?lang=${language}`} className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-center text-sm font-medium text-gold hover:bg-gold/[0.13]">{ar ? "مراجعة / متابعة التواصل" : "Review / continue outreach"}</Link> : <div className="cursor-not-allowed rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-center text-sm text-white/30">{ar ? "التواصل مقفل حتى يكتمل التجهيز" : "Outreach locked until research is ready"}</div>}<Link href={linked("/admin/marketing/follow-ups")} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65 hover:border-gold/20 hover:text-gold">{ar ? "جدولة متابعة" : "Schedule follow-up"}</Link><Link href={linked("/admin/marketing/briefs")} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65 hover:border-gold/20 hover:text-gold">{ar ? "إنشاء / استكمال البريف" : "Create / complete brief"}</Link><Link href={linked("/admin/marketing/inbox")} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/65 hover:border-gold/20 hover:text-gold">{ar ? "عرض المحادثات" : "View conversations"}</Link></div></div></AdminCard>
    <div className="grid gap-5 xl:grid-cols-2">
      <AdminCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar ? "التواصل" : "Outreach"}</h2></div><div className="divide-y divide-white/[0.06]">{outreach.length === 0 ? <div className="p-5 text-sm text-white/35">{ar ? "لا توجد محاولة تواصل بعد." : "No outreach yet."}</div> : outreach.map((item) => <div key={item.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-white/70">{item.channel}</span><span className="text-gold/70">{item.send_status}</span></div><div className="mt-2 text-white/35">{item.reply_status}{item.outcome ? ` · ${item.outcome}` : ""}</div></div>)}</div></AdminCard>
      <AdminCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar ? "المتابعات" : "Follow-ups"}</h2></div><div className="divide-y divide-white/[0.06]">{followups.length === 0 ? <div className="p-5 text-sm text-white/35">{ar ? "لا توجد متابعة مجدولة." : "No follow-up scheduled."}</div> : followups.map((item) => <div key={item.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-white/70">{item.next_action ?? item.reason ?? "—"}</span><span className="text-gold/70">{item.status}</span></div><div className="mt-2 text-white/35">{item.follow_up_at ? new Date(item.follow_up_at).toLocaleString(ar ? "ar-SA" : "en-US") : "—"}</div></div>)}</div></AdminCard>
      <AdminCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar ? "البريفات" : "Briefs"}</h2></div><div className="divide-y divide-white/[0.06]">{briefs.length === 0 ? <div className="p-5 text-sm text-white/35">{ar ? "لا يوجد بريف مرتبط." : "No linked brief."}</div> : briefs.map((item) => <div key={item.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-white/70">{item.project_type ?? `Brief #${item.id}`}</span><span className="text-gold/70">{item.status}</span></div>{item.status === "complete" && !item.opportunity_id ? <Link href={`/admin/opportunities/new?brief_id=${item.id}`} className="mt-3 inline-block text-gold hover:underline">{ar ? "تحويل إلى فرصة ←" : "Convert to opportunity →"}</Link> : item.opportunity_id ? <div className="mt-2 text-emerald-300/60">{ar ? "مرتبط بفرصة" : "Linked to opportunity"}</div> : null}</div>)}</div></AdminCard>
      <AdminCard className="overflow-hidden"><div className="border-b border-white/[0.07] px-5 py-4"><h2 className="text-base text-white">{ar ? "المحادثات" : "Conversations"}</h2></div><div className="divide-y divide-white/[0.06]">{conversations.length === 0 ? <div className="p-5 text-sm text-white/35">{ar ? "لا توجد محادثة مرتبطة." : "No linked conversation."}</div> : conversations.map((item) => <div key={item.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-3"><span className="text-white/70">{item.channel} · {item.stage}</span><span className="text-gold/70">{item.status}</span></div><div className="mt-2 text-white/35">{item.unread_count ?? 0} {ar ? "غير مقروء" : "unread"}</div></div>)}</div></AdminCard>
    </div>
  </AdminPageContainer>;
}
