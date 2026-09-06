import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCard, AdminPageContainer, AdminPageHeader } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePendingSocialApprovalContentAction } from "./actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function EditSocialApprovalContentPage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const approvalId = Number(id);
  if (!Number.isInteger(approvalId) || approvalId <= 0) notFound();
  const language = getAdminLanguage(lang);
  const ar = language === "ar";
  const db = createAdminClient();

  const { data: approval } = await db
    .from("marketing_approvals")
    .select("id,task_id,status,proposed_action")
    .eq("id", approvalId)
    .maybeSingle();
  if (!approval || approval.status !== "pending") notFound();

  const { data: task } = await db
    .from("marketing_tasks")
    .select("id,task_type,content_id,input")
    .eq("id", approval.task_id)
    .maybeSingle();
  if (!task || task.task_type !== "social_publish" || !task.content_id) notFound();

  const { data: content } = await db
    .from("marketing_content")
    .select("id,title,caption,body,cta,content_type,channel,status")
    .eq("id", task.content_id)
    .maybeSingle();
  if (!content) notFound();

  const action = asRecord(approval.proposed_action);
  const input = asRecord(task.input);
  const currentCaption = stringValue(action.text) || stringValue(action.caption) || stringValue(input.text) || content.caption || content.body || "";
  const currentCta = stringValue(action.cta) || stringValue(input.cta) || content.cta || "";

  return <AdminPageContainer>
    <div className="mb-4">
      <Link href={`/admin/marketing/approvals/social/${approvalId}?lang=${language}`} className="text-xs text-gold/70 hover:text-gold">
        {ar ? "← العودة إلى المراجعة" : "← Back to review"}
      </Link>
    </div>
    <AdminPageHeader
      eyebrow={ar ? "MLAMH · تعديل قبل الاعتماد" : "MLAMH · EDIT BEFORE APPROVAL"}
      title={ar ? "تعديل المحتوى قبل الموافقة" : "Edit content before approval"}
      description={ar ? "عدّل العنوان أو النص أو CTA ثم ارجع للمراجعة. يبقى القرار بانتظار موافقتك ولا يتم أي نشر أثناء التعديل." : "Edit the title, copy, or CTA, then return to review. The approval remains pending and nothing is published while editing."}
    />

    <AdminCard className="max-w-4xl p-5 md:p-6">
      <div className="mb-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm leading-7 text-amber-100/75">
        {ar ? "أي تعديل هنا يحدّث نسخة المحتوى التي ستُراجع وتُنشر لاحقًا، ويُسجل في سجل نشاط فريق التسويق." : "Changes here update the exact content that will be reviewed and published later, and are recorded in marketing activity."}
      </div>

      <form action={updatePendingSocialApprovalContentAction} className="space-y-5">
        <input type="hidden" name="approval_id" value={approvalId}/>
        <input type="hidden" name="lang" value={language}/>

        <label className="block">
          <span className="text-sm text-white/60">{ar ? "العنوان" : "Title"}</span>
          <input name="title" defaultValue={content.title ?? ""} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/35"/>
        </label>

        <label className="block">
          <span className="text-sm text-white/60">{ar ? "النص / Caption" : "Copy / Caption"}</span>
          <textarea name="caption" required rows={10} defaultValue={currentCaption} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none focus:border-gold/35"/>
        </label>

        <label className="block">
          <span className="text-sm text-white/60">CTA</span>
          <input name="cta" defaultValue={currentCta} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-gold/35"/>
        </label>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <Link href={`/admin/marketing/approvals/social/${approvalId}?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60">
            {ar ? "إلغاء" : "Cancel"}
          </Link>
          <button className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-medium text-gold hover:bg-gold/15">
            {ar ? "حفظ التعديل والعودة للمراجعة" : "Save changes & return to review"}
          </button>
        </div>
      </form>
    </AdminCard>
  </AdminPageContainer>;
}
