import Link from "next/link";

import { AdminBadge, AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { EmailAdapter, WhatsAppAdapter } from "@/lib/marketing/channels/adapters";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveMarketingApproval, rejectMarketingApproval } from "../actions";
import { saveEditableApprovalMessageAction } from "./actions";

export const dynamic = "force-dynamic";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function text(value: unknown) { return typeof value === "string" ? value : ""; }

export default async function EditableApprovalsPage() {
  await requireMarketingAdminAccess("marketing.approve");
  const db = createAdminClient();
  const [{ data: approvals }, emailStatus, whatsappStatus] = await Promise.all([
    db.from("marketing_approvals").select("id,task_id,status,reason,proposed_action,channel,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(100),
    EmailAdapter.getStatus(),
    WhatsAppAdapter.getStatus(),
  ]);
  const rows = approvals ?? [];
  const taskIds = rows.map((item) => item.task_id);
  const { data: tasks } = taskIds.length
    ? await db.from("marketing_tasks").select("id,task_type,input,lead_id,channel,title").in("id", taskIds)
    : { data: [] };
  const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));

  const editable = rows.flatMap((approval) => {
    const task = taskMap.get(approval.task_id);
    if (!task) return [];
    const proposed = record(approval.proposed_action);
    if (task.task_type !== "first_outreach" && proposed.kind !== "external_reply") return [];
    return [{ approval, task, proposed }];
  });
  const outreachCount = editable.filter((item) => item.task.task_type === "first_outreach").length;
  const replyCount = editable.filter((item) => item.proposed.kind === "external_reply").length;

  return <AdminPageContainer>
    <div className="mb-4"><Link href="/admin/marketing/approvals?lang=ar" className="text-xs text-gold/70 hover:text-gold">← العودة إلى مركز القرارات</Link></div>
    <AdminPageHeader eyebrow="MLAMH · HUMAN EDIT LAYER" title="تعديل الرسائل قبل الموافقة" description="أي رسالة بشرية قابلة للتحرير يجب أن تصل لك بصيغة تستطيع تعديلها قبل الاعتماد. الحفظ لا يرسل شيئًا؛ التنفيذ يبقى خلف بوابة الموافقة." />

    <AdminGrid className="mb-6 md:grid-cols-3"><AdminStatCard label="رسائل قابلة للتعديل" value={editable.length}/><AdminStatCard label="Outreach" value={outreachCount}/><AdminStatCard label="ردود العملاء" value={replyCount}/></AdminGrid>

    <div className="space-y-5">
      {editable.length === 0 ? <AdminCard className="p-7 text-sm text-white/45">لا توجد رسائل Pending قابلة للتعديل الآن.</AdminCard> : editable.map(({ approval, task, proposed }) => {
        const input = record(task.input);
        const externalReply = proposed.kind === "external_reply";
        const channelDrafts = record(proposed.channel_drafts);
        const message = text(input.message) || text(proposed.message) || text(proposed.content);
        const subject = text(input.subject) || text(proposed.subject);
        const emailDraft = text(channelDrafts.email) || text(proposed.email_draft);
        const whatsappDraft = text(channelDrafts.whatsapp) || text(proposed.whatsapp_draft);
        const executiveSummary = text(proposed.executive_summary);
        const linkedinTarget = text(input.linkedin_profile_url);

        return <AdminCard key={approval.id} className="overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] p-5">
            <div><div className="flex flex-wrap gap-2"><AdminBadge variant="warning">بانتظار قرارك</AdminBadge><AdminBadge variant="muted">{externalReply ? "Client reply" : task.channel ?? "Outreach"}</AdminBadge></div><h2 className="mt-3 text-lg font-medium text-white">{task.title ?? approval.reason ?? `Approval #${approval.id}`}</h2><p className="mt-1 text-xs text-white/35">Approval #{approval.id} · Task #{task.id}{task.lead_id ? ` · Lead #${task.lead_id}` : ""}</p></div>
            {linkedinTarget ? <a href={linkedinTarget} target="_blank" rel="noreferrer" className="rounded-lg border border-blue-300/20 px-3 py-2 text-xs text-blue-200">فتح LinkedIn</a> : null}
          </div>

          <form action={saveEditableApprovalMessageAction} className="space-y-4 p-5">
            <input type="hidden" name="approval_id" value={approval.id}/>
            {externalReply ? <>
              <label className="block"><span className="text-xs text-white/45">Executive summary</span><textarea name="executive_summary" defaultValue={executiveSummary} rows={3} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/75 outline-none focus:border-gold/30"/></label>
              <label className="block"><span className="text-xs text-white/45">Email draft</span><textarea name="email_draft" defaultValue={emailDraft} rows={7} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-7 text-white/75 outline-none focus:border-gold/30"/></label>
              <label className="block"><span className="text-xs text-white/45">WhatsApp draft</span><textarea name="whatsapp_draft" defaultValue={whatsappDraft} rows={6} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-7 text-white/75 outline-none focus:border-gold/30"/></label>
            </> : <>
              {task.channel === "email" ? <label className="block"><span className="text-xs text-white/45">Subject</span><input name="subject" defaultValue={subject} required className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/75 outline-none focus:border-gold/30"/></label> : null}
              <label className="block"><span className="text-xs text-white/45">Message</span><textarea name="message" defaultValue={message} required rows={7} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-7 text-white/75 outline-none focus:border-gold/30"/></label>
            </>}
            <button className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs text-white/70 transition hover:border-gold/25 hover:text-gold">حفظ التعديل فقط</button>
          </form>

          <div className="border-t border-white/[0.07] p-5">
            {externalReply ? <form action={approveMarketingApproval} className="space-y-3">
              <input type="hidden" name="approval_id" value={approval.id}/><input type="hidden" name="executive_summary" value={executiveSummary}/><input type="hidden" name="email_draft" value={emailDraft}/><input type="hidden" name="whatsapp_draft" value={whatsappDraft}/>
              <p className="text-[11px] text-white/35">بعد حفظ أي تعديل، أعد تحميل الصفحة ثم اختر القناة واعتمد النسخة المحفوظة.</p>
              <div className="flex flex-wrap gap-4 text-xs text-white/65">
                <label className="flex items-center gap-2"><input type="checkbox" name="delivery_channels" value="email" disabled={emailStatus !== "connected" || !emailDraft}/><span>Email {emailStatus === "connected" ? "" : "· غير متصل"}</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="delivery_channels" value="whatsapp" disabled={whatsappStatus !== "connected" || !whatsappDraft}/><span>WhatsApp {whatsappStatus === "connected" ? "" : "· غير متصل"}</span></label>
              </div>
              <button className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-2.5 text-xs font-medium text-gold">اعتماد النسخة المختارة</button>
            </form> : <form action={approveMarketingApproval}><input type="hidden" name="approval_id" value={approval.id}/><button className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-2.5 text-xs font-medium text-gold">اعتماد الرسالة</button></form>}
            <form action={rejectMarketingApproval} className="mt-2"><input type="hidden" name="approval_id" value={approval.id}/><button className="rounded-xl border border-red-300/15 px-5 py-2.5 text-xs text-red-100/70">رفض</button></form>
          </div>
        </AdminCard>;
      })}
    </div>
  </AdminPageContainer>;
}