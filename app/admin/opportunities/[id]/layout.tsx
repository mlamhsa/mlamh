import Link from "next/link";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminOpportunityDetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  const { id } = await params;
  const opportunityId = Number(id);
  let editableManagedDraft = false;

  if (Number.isInteger(opportunityId) && opportunityId > 0) {
    const db = createAdminClient();
    const { data } = await db.from("opportunities").select("status,published,role_requirements").eq("id", opportunityId).maybeSingle();
    const requirements = data?.role_requirements && typeof data.role_requirements === "object" && !Array.isArray(data.role_requirements)
      ? data.role_requirements as Record<string, unknown>
      : {};
    editableManagedDraft = Boolean(data && !data.published && ["draft", "needs_changes"].includes(data.status) && requirements.managed_by === "mlamh");
  }

  return (
    <>
      {children}
      {editableManagedDraft ? (
        <div className="fixed bottom-6 end-6 z-50 max-w-sm rounded-2xl border border-gold/30 bg-[#171717]/95 p-3 shadow-2xl backdrop-blur">
          <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-gold/60">MLAMH MANAGED DRAFT</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-xs leading-5 text-white/55">المسودة قابلة للتعديل قبل النشر.</p>
            <Link href={`/admin/opportunities/${opportunityId}/edit?lang=ar`} className="shrink-0 rounded-full bg-gold px-4 py-2 text-xs font-medium text-black transition hover:opacity-90">تعديل ومراجعة</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
