import Link from "next/link";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Casting Intelligence — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CastingIntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const { lang = "ar" } = await searchParams;
  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const db = createAdminClient();
  const { data, error } = await db
    .from("casting_projects")
    .select("id,project_title,status,client_name,company_name,talent_type,required_count,city,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`[CastingIntelligencePage] ${error.message}`);
  const rows = data ?? [];
  const active = rows.filter((row) => ["active", "screening", "shortlist_ready", "client_review"].includes(row.status)).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "ذكاء الكاستينغ" : "Casting Intelligence"}
        description={
          isArabic
            ? "تحليل Read-only للـBriefs باستخدام محرك التأهيل والعرض الحالي في MLAMH. لا يتم إرسال أو قبول أو رفض أي طلب تلقائيًا."
            : "Read-only brief analysis using MLAMH's existing qualification and supply engines. No applications are sent, accepted, or rejected automatically."
        }
      />

      <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-xs text-white/50">
        <span className="font-semibold text-gold">SHADOW MODE</span>
        <span className="mx-2">·</span>
        {isArabic ? "السعودية فقط سوق تشغيلي حاليًا" : "Saudi Arabia is the only operational market"}
      </div>

      <AdminGrid className="mb-8 md:grid-cols-3">
        <AdminStatCard label={isArabic ? "إجمالي المشاريع" : "Total projects"} value={rows.length} />
        <AdminStatCard label={isArabic ? "مشاريع نشطة" : "Active projects"} value={active} />
        <AdminStatCard label={isArabic ? "محرك التحليل" : "Analysis engine"} value="LIVE" />
      </AdminGrid>

      <AdminCard>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Casting Briefs</p>
            <h2 className="mt-2 text-xl font-light text-white">{isArabic ? "اختر مشروعًا للتحليل" : "Choose a project to analyze"}</h2>
          </div>
          <Link href={`/admin/intelligence?lang=${language}`} className="text-xs text-gold hover:underline">
            {isArabic ? "العودة إلى Command Center" : "Back to Command Center"}
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/35">
            {isArabic ? "لا توجد مشاريع Casting حتى الآن." : "No casting projects yet."}
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((project) => (
              <Link
                key={project.id}
                href={`/admin/intelligence/casting/${project.id}?lang=${language}`}
                className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-gold/20 hover:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/80">{project.project_title}</p>
                  <p className="mt-1 text-xs text-white/35">
                    #{project.id} · {project.company_name || project.client_name || "—"} · {project.city || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-white/40">
                  <span>{project.talent_type || "—"}</span>
                  <span>× {project.required_count ?? 1}</span>
                  <span className="rounded-full border border-gold/20 px-2.5 py-1 text-gold">
                    {isArabic ? "تحليل" : "Analyze"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPageContainer>
  );
}
