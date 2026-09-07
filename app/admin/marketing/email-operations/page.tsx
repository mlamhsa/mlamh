import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getEmailFeedbackSnapshot, type EmailFeedbackDiagnosis } from "@/lib/marketing/analytics/email-feedback";
import { getExternalExecutionSettings } from "@/lib/marketing/channels/controlled-execution";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

const diagnosisCopy: Record<EmailFeedbackDiagnosis, { tone: string; ar: string; en: string }> = {
  insufficient_sample: {
    tone: "amber",
    ar: "العينة ما زالت صغيرة. نعرض الإشارات التشغيلية فقط ولا نتخذ استنتاجات قوية قبل وجود حجم بيانات كافٍ.",
    en: "The sample is still small. Operational signals are visible, but no strong conclusion should be made yet.",
  },
  deliverability_attention: {
    tone: "red",
    ar: "معدل الارتداد يحتاج مراجعة قبل تحسين الرسائل أو زيادة الإرسال.",
    en: "Bounce rate needs attention before messaging optimization or higher send volume.",
  },
  messaging_or_targeting_attention: {
    tone: "amber",
    ar: "قابلية التسليم مقبولة لكن الردود البشرية منخفضة نسبيًا؛ راجع الاستهداف وصياغة الرسالة قبل التوسع.",
    en: "Deliverability is acceptable, but observed human replies are low; review targeting and message quality before scaling.",
  },
  review_followups: {
    tone: "amber",
    ar: "هناك متابعات مستحقة للمراجعة. جميعها تبقى خاضعة للاعتماد ولا تُرسل تلقائيًا.",
    en: "Governed follow-ups are due for review. They remain approval-required and are never auto-sent.",
  },
  healthy_observation: {
    tone: "green",
    ar: "لا توجد إشارة تشغيلية حرجة ضمن العينة الحالية. استمر بالمراقبة مع إبقاء الاعتمادات كما هي.",
    en: "No critical operational signal is present in the current sample. Continue observation with approvals unchanged.",
  },
};

function eventLabel(name: string, isArabic: boolean) {
  const map: Record<string, { ar: string; en: string }> = {
    email_bounce_detected: { ar: "Bounce مسجل", en: "Bounce detected" },
    email_auto_reply_detected: { ar: "رد آلي مسجل", en: "Auto-reply detected" },
    email_follow_up_due: { ar: "متابعة أصبحت مستحقة", en: "Follow-up became due" },
    email_inbound_classified: { ar: "رسالة واردة تم تصنيفها", en: "Inbound email classified" },
  };
  const item = map[name];
  return item ? (isArabic ? item.ar : item.en) : name.replaceAll("_", " ");
}

function statusPill(active: boolean) {
  return active
    ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100/80"
    : "border-white/10 bg-white/[0.03] text-white/45";
}

export default async function EmailOperationsPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const language = getAdminLanguage(lang);
  const isArabic = language === "ar";
  const db = createAdminClient();

  const [feedback, execution, eventsResult, followUpsResult, integrationsResult] = await Promise.all([
    getEmailFeedbackSnapshot({ days: 30 }),
    getExternalExecutionSettings(),
    db.from("marketing_events")
      .select("id,event_name,entity_type,entity_id,metadata,occurred_at")
      .in("event_name", ["email_bounce_detected", "email_auto_reply_detected", "email_follow_up_due", "email_inbound_classified"])
      .order("occurred_at", { ascending: false })
      .limit(20),
    db.from("marketing_tasks")
      .select("id,title,status,approval_level,conversation_id,lead_id,metadata,created_at")
      .contains("metadata", { email_follow_up: true })
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("marketing_integrations")
      .select("provider,status,last_sync_at,last_success_at,last_error,metadata")
      .in("provider", ["email", "buffer", "linkedin"]),
  ]);

  const events = eventsResult.data ?? [];
  const followUps = followUpsResult.data ?? [];
  const integrations = integrationsResult.data ?? [];
  const integrationMap = new Map(integrations.map((item) => [item.provider, item]));
  const emailIntegration = integrationMap.get("email");
  const bufferIntegration = integrationMap.get("buffer");
  const linkedInIntegration = integrationMap.get("linkedin");
  const pendingFollowUps = followUps.filter((item) => !["completed", "cancelled", "failed"].includes((item.status ?? "").toLowerCase()));
  const diagnosis = diagnosisCopy[feedback.diagnosis];
  const emailProductionEnabled = execution.productionEnabled && execution.productionChannels.includes("email");
  const bufferProductionEnabled = execution.productionEnabled && execution.productionChannels.includes("buffer");

  return <AdminPageContainer>
    <AdminPageHeader
      eyebrow={isArabic ? "MLAMH · EMAIL OPERATIONS" : "MLAMH · EMAIL OPERATIONS"}
      title={isArabic ? "تشغيل البريد" : "Email Operations"}
      description={isArabic ? "رؤية تشغيلية لمسار البريد: الإرسال، الردود البشرية، الارتداد، الردود الآلية، المتابعات والتوجيه — بدون إرسال تلقائي." : "Operational visibility across sending, human replies, bounces, auto-replies, follow-ups and routing — with no automatic external send."}
    />

    <AdminCard className="mb-6 overflow-hidden border-gold/15">
      <div className="border-b border-white/[0.07] p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "حالة التنفيذ الفعلية" : "LIVE EXECUTION STATE"}</p>
        <h2 className="mt-1 text-lg text-white">{isArabic ? "القنوات والقيود الحالية" : "Channels and controls"}</h2>
      </div>
      <div className="grid gap-px bg-white/[0.06] md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs text-white/40">Email Production</p><span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusPill(emailProductionEnabled)}`}>{emailProductionEnabled ? "ON" : "OFF"}</span></div><p className="mt-3 text-sm text-white/65">{emailIntegration?.status ?? "unknown"}</p><p className="mt-1 text-xs text-white/30">{isArabic ? `الحد اليومي: ${execution.dailyEmailLimit}` : `Daily limit: ${execution.dailyEmailLimit}`}</p></div>
        <div className="bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs text-white/40">Buffer Production</p><span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusPill(bufferProductionEnabled)}`}>{bufferProductionEnabled ? "ON" : "OFF"}</span></div><p className="mt-3 text-sm text-white/65">{bufferIntegration?.status ?? "unknown"}</p><p className="mt-1 text-xs text-white/30">{isArabic ? "الاتصال لا يعني السماح بالنشر" : "Connected does not mean publishing is enabled"}</p></div>
        <div className="bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs text-white/40">LinkedIn</p><span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusPill(linkedInIntegration?.status === "connected")}`}>{linkedInIntegration?.status === "connected" ? "CONNECTED" : "MANUAL"}</span></div><p className="mt-3 text-sm text-white/65">{linkedInIntegration?.status ?? "setup_required"}</p><p className="mt-1 text-xs text-white/30">{isArabic ? "لا يوجد إرسال تلقائي" : "No automatic sending"}</p></div>
        <div className="bg-black/20 p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs text-white/40">Test Mode</p><span className={`rounded-full border px-2.5 py-1 text-[11px] ${statusPill(execution.testMode.enabled)}`}>{execution.testMode.enabled ? "ON" : "OFF"}</span></div><p className="mt-3 text-sm text-white/65">{execution.testMode.emailAllowlist.length} email allowlist</p><p className="mt-1 text-xs text-white/30">{execution.testMode.bufferTargets.join(", ") || "—"}</p></div>
      </div>
      <div className="border-t border-white/[0.06] px-5 py-3 text-xs text-white/30">{isArabic ? "هذه الحالة تُقرأ مباشرة من إعدادات Production والتكاملات، وليست وصفًا ثابتًا في الواجهة." : "This state is read directly from Production execution settings and integrations, not hard-coded UI copy."}</div>
    </AdminCard>

    <AdminGrid className="mb-6 md:grid-cols-4">
      <AdminStatCard label={isArabic ? "رسائل منشورة · 30 يوم" : "Published · 30d"} value={feedback.published} />
      <AdminStatCard label={isArabic ? "ردود بشرية مرصودة" : "Observed human inbound"} value={feedback.humanInbound} />
      <AdminStatCard label={isArabic ? "معدل الرد المرصود" : "Observed reply rate"} value={`${feedback.observedReplyRate}%`} />
      <AdminStatCard label={isArabic ? "معدل الارتداد المرصود" : "Observed bounce rate"} value={`${feedback.observedBounceRate}%`} />
    </AdminGrid>

    <AdminCard className={`mb-6 border ${diagnosis.tone === "red" ? "border-red-300/20 bg-red-300/[0.04]" : diagnosis.tone === "green" ? "border-emerald-300/15 bg-emerald-300/[0.03]" : "border-amber-300/15 bg-amber-300/[0.04]"} p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "التشخيص التشغيلي" : "OPERATIONAL DIAGNOSIS"}</p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/75">{isArabic ? diagnosis.ar : diagnosis.en}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50">{feedback.diagnosis.replaceAll("_", " ")}</span>
      </div>
    </AdminCard>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <AdminCard className="p-4"><p className="text-xs text-white/40">Bounce</p><p className="mt-2 text-2xl text-white">{feedback.bounces}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs text-white/40">{isArabic ? "ردود آلية" : "Auto-replies"}</p><p className="mt-2 text-2xl text-white">{feedback.autoReplies}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs text-white/40">{isArabic ? "متابعات مستحقة" : "Follow-ups due"}</p><p className="mt-2 text-2xl text-white">{feedback.followUpsDue}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs text-white/40">{isArabic ? "مصنفة" : "Classified"}</p><p className="mt-2 text-2xl text-white">{feedback.classified}</p></AdminCard>
      <AdminCard className="p-4"><p className="text-xs text-white/40">CEO routing</p><p className="mt-2 text-2xl text-white">{feedback.ceoRouted}</p></AdminCard>
    </div>

    <AdminCard className="mb-6 border-gold/15 bg-gold/[0.03] p-5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "قواعد الحوكمة الحالية" : "ACTIVE GOVERNANCE"}</p>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-white/60 md:grid-cols-2">
        <p>{isArabic ? "• Follow-up بعد 72 ساعة فقط، محاولة واحدة، Approval-required." : "• Follow-up only after 72 hours, one attempt, approval-required."}</p>
        <p>{isArabic ? "• أي رد أحدث يوقف المتابعة تلقائيًا." : "• Any newer inbound reply automatically blocks the follow-up."}</p>
        <p>{isArabic ? "• Bounce / Auto-reply لا ينشئ Dana task ولا ردًا خارجيًا." : "• Bounce / auto-reply creates no Dana task and no external reply."}</p>
        <p>{isArabic ? "• السعر والعقود والشراكات والرعاية والالتزامات تذهب إلى CEO review." : "• Pricing, contracts, partnerships, sponsorships and commitments route to CEO review."}</p>
      </div>
    </AdminCard>

    <div className="mb-6 grid gap-5 xl:grid-cols-2">
      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "المتابعات المحكومة" : "GOVERNED FOLLOW-UPS"}</p><h2 className="mt-1 text-lg text-white">{isArabic ? "قائمة المراجعة" : "Review queue"}</h2></div><Link href={`/admin/marketing/follow-ups?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{isArabic ? "فتح المتابعات" : "Open follow-ups"}</Link></div></div>
        <div className="divide-y divide-white/[0.06]">{pendingFollowUps.length === 0 ? <p className="p-5 text-sm text-white/40">{isArabic ? "لا توجد متابعة بريد محكومة بانتظار الإجراء الآن." : "No governed email follow-up is waiting for action."}</p> : pendingFollowUps.map((item) => <div key={item.id} className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-white/75">{item.title}</p><p className="mt-1 text-xs text-white/35">Task #{item.id} · {item.approval_level ?? "approval_required"}</p></div><span className="rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2.5 py-1 text-xs text-amber-100/70">{item.status}</span></div></div>)}</div>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">{isArabic ? "أحدث إشارات البريد" : "RECENT EMAIL SIGNALS"}</p><h2 className="mt-1 text-lg text-white">Telemetry</h2></div><Link href={`/admin/marketing/analytics?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">{isArabic ? "التحليلات" : "Analytics"}</Link></div></div>
        <div className="divide-y divide-white/[0.06]">{events.length === 0 ? <p className="p-5 text-sm text-white/40">{isArabic ? "لا توجد إشارات جديدة منذ تفعيل النظام." : "No new email telemetry has been recorded since activation."}</p> : events.map((event) => <div key={event.id} className="p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-white/70">{eventLabel(event.event_name, isArabic)}</p><p className="mt-1 text-xs text-white/30">{event.entity_type ?? "marketing"}{event.entity_id ? ` · #${event.entity_id}` : ""}</p></div><time className="shrink-0 text-xs text-white/30">{event.occurred_at ? new Date(event.occurred_at).toLocaleString(isArabic ? "ar-SA" : "en-US") : "—"}</time></div></div>)}</div>
      </AdminCard>
    </div>

    <p className="text-xs leading-6 text-white/30">{isArabic ? "المعدلات أعلاه مؤشرات تشغيلية من الرسائل والوظائف المسجلة وليست Attribution صارمة للحملات." : feedback.note}</p>
  </AdminPageContainer>;
}
