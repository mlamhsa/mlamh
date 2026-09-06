import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildCastingProjectIntelligence } from "@/lib/intelligence/casting/project-intelligence";

export const dynamic = "force-dynamic";

export default async function CastingIntelligenceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdminAccess();
  const [{ id }, { lang = "ar" }] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const intelligence = await buildCastingProjectIntelligence(projectId);
  if (!intelligence) notFound();

  const totalNeeded = intelligence.roles.reduce((sum, role) => sum + role.needed, 0);
  const totalSendable = intelligence.roles.reduce((sum, role) => sum + role.sendable, 0);
  const totalMissing = intelligence.roles.reduce((sum, role) => sum + role.missing, 0);

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={intelligence.project.project_title}
        description={
          isArabic
            ? "Casting Intelligence · تحليل فعلي للعرض المؤهل والقابل للإرسال مقابل متطلبات الـBrief."
            : "Casting Intelligence · Live analysis of qualified and sendable supply against brief requirements."
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.05] px-4 py-3 text-xs">
        <div className="text-white/45">
          <span className="font-semibold text-gold">SHADOW MODE</span>
          <span className="mx-2">·</span>
          {isArabic ? "لا يوجد تنفيذ أو تواصل خارجي" : "No execution or external communication"}
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-white/45 hover:text-gold">
            {isArabic ? "المشروع التشغيلي" : "Operational project"}
          </Link>
          <Link href={`/admin/intelligence/casting?lang=${language}`} className="text-gold hover:underline">
            {isArabic ? "كل التحليلات" : "All analyses"}
          </Link>
        </div>
      </div>

      {!intelligence.marketOperational ? (
        <AdminCard>
          <p className="text-sm text-amber-200">
            {isArabic
              ? "هذا المشروع مرتبط بسوق غير مفعّل تشغيليًا. تم إيقاف تحليل العرض تلقائيًا لحماية حدود الأسواق."
              : "This project belongs to a market that is not operational. Supply analysis is intentionally disabled to preserve market boundaries."}
          </p>
        </AdminCard>
      ) : (
        <>
          <AdminGrid className="mb-8 md:grid-cols-3">
            <AdminStatCard label={isArabic ? "إجمالي المطلوب" : "Total needed"} value={totalNeeded} />
            <AdminStatCard label={isArabic ? "قابل للإرسال" : "Sendable"} value={totalSendable} />
            <AdminStatCard label={isArabic ? "فجوة العرض" : "Supply gap"} value={totalMissing} />
          </AdminGrid>

          <div className="space-y-6">
            {intelligence.roles.map((role) => (
              <AdminCard key={role.roleId ?? "project"}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">CASTING ROLE</p>
                    <h2 className="mt-2 text-xl font-light text-white">{role.title}</h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs ${role.missing > 0 ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-200" : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200"}`}>
                    {role.missing > 0
                      ? isArabic
                        ? `فجوة ${role.missing}`
                        : `Gap ${role.missing}`
                      : isArabic
                        ? "عرض كافٍ"
                        : "Supply sufficient"}
                  </span>
                </div>

                <AdminGrid className="mt-5 md:grid-cols-4">
                  <AdminStatCard label={isArabic ? "المطلوب" : "Needed"} value={role.needed} />
                  <AdminStatCard label={isArabic ? "مؤهل" : "Qualified"} value={role.qualified} />
                  <AdminStatCard label={isArabic ? "قابل للإرسال" : "Sendable"} value={role.sendable} />
                  <AdminStatCard label={isArabic ? "الناقص" : "Missing"} value={role.missing} />
                </AdminGrid>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-white/55">{isArabic ? "أهم أسباب الاستبعاد" : "Top blocking reasons"}</p>
                    <div className="mt-3 space-y-2">
                      {role.blockerCounts.length ? role.blockerCounts.map((item) => (
                        <div key={item.reason} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                          <span className="text-white/45">{item.reason}</span>
                          <span className="tabular-nums text-white/70">{item.count}</span>
                        </div>
                      )) : (
                        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/35">
                          {isArabic ? "لا توجد موانع مسجلة." : "No blocking reasons recorded."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-white/55">{isArabic ? "التوصية" : "Recommendation"}</p>
                    <div className="mt-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                      {role.recommendation ? (
                        <>
                          <p className="text-sm font-medium text-white/75">{role.recommendation.title}</p>
                          <p className="mt-2 text-xs leading-6 text-white/40">{role.recommendation.summary}</p>
                          <p className="mt-3 text-[10px] uppercase tracking-wider text-amber-200/70">
                            {isArabic ? "قرار بشري مطلوب قبل أي إجراء" : "Human decision required before any action"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs leading-6 text-emerald-200/70">
                          {isArabic
                            ? "العرض الحالي يفي بالعدد المطلوب وفق القواعد الصارمة الحالية."
                            : "Current supply meets the required count under the existing deterministic rules."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </AdminCard>
            ))}
          </div>
        </>
      )}

      <p className="mt-6 text-[11px] text-white/25">
        {isArabic ? "تم التوليد: " : "Generated: "}
        <span dir="ltr">{intelligence.generatedAt}</span>
      </p>
    </AdminPageContainer>
  );
}
