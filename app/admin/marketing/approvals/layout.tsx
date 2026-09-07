import Link from "next/link";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export default async function MarketingApprovalsLayout({ children }: { children: React.ReactNode }) {
  await requireMarketingAdminAccess("marketing.view");
  const db = createAdminClient();
  const { data: approvals } = await db.from("marketing_approvals").select("id,task_id,proposed_action,status").eq("status", "pending").limit(150);
  const rows = approvals ?? [];
  const taskIds = rows.map((row) => row.task_id);
  const { data: tasks } = taskIds.length ? await db.from("marketing_tasks").select("id,task_type").in("id", taskIds) : { data: [] };
  const taskTypes = new Map((tasks ?? []).map((task) => [task.id, task.task_type]));
  const editableCount = rows.filter((row) => taskTypes.get(row.task_id) === "first_outreach" || record(row.proposed_action).kind === "external_reply").length;

  return (
    <>
      <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.035] p-4">
          <div>
            <p className="text-xs font-medium text-gold">CEO Decision Queue</p>
            <p className="mt-1 text-[11px] text-white/45">شاهد فقط القرارات الخارجية والتجارية التي تحتاج تدخلك. أعمال الفريق الداخلية لا تُعرض كمهام CEO.</p>
          </div>
          <Link href="/admin/marketing/approvals/ceo?lang=ar" className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-medium text-gold">فتح قائمة قرارات CEO</Link>
        </div>
      </div>
      {editableCount > 0 ? (
        <div className="mx-auto mt-3 max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-300/15 bg-blue-300/[0.035] p-4">
            <div><p className="text-xs font-medium text-blue-100">{editableCount} رسالة قابلة للتعديل قبل الموافقة</p><p className="mt-1 text-[11px] text-blue-100/45">عدّل Outreach أو الرد البشري ثم اعتمد النسخة النهائية فقط.</p></div>
            <Link href="/admin/marketing/approvals/editable?lang=ar" className="rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-2.5 text-xs font-medium text-gold">فتح محرر الرسائل</Link>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
