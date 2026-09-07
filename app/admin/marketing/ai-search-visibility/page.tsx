import Link from "next/link";

import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { buildAiSearchVisibility, type AiSearchPlatform } from "@/lib/marketing/analytics/ai-search-visibility";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; range?: string }>;
};

const ranges: Record<string, { days: number | null; ar: string; en: string }> = {
  "7d": { days: 7, ar: "7 أيام", en: "7 days" },
  "30d": { days: 30, ar: "30 يومًا", en: "30 days" },
  "90d": { days: 90, ar: "90 يومًا", en: "90 days" },
  all: { days: null, ar: "كل الفترة", en: "All time" },
};

const platformLabels: Record<AiSearchPlatform, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  copilot: "Microsoft Copilot",
  gemini: "Gemini",
  claude: "Claude",
};

function rate(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export default async function AiSearchVisibilityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const isArabic = getAdminLanguage(params.lang) === "ar";
  const language = isArabic ? "ar" : "en";
  const rangeKey = params.range && ranges[params.range] ? params.range : "30d";
  const range = ranges[rangeKey];
  const since = range.days ? new Date(Date.now() - range.days * 86400000).toISOString() : null;
  const db = createAdminClient();

  let query = db
    .from("marketing_events")
    .select("event_name,anonymous_session_id,source,referrer,metadata,occurred_at")
    .in("event_name", ["page_view", "registration_completed", "application_submitted", "brief_received"])
    .order("occurred_at", { ascending: false })
    .limit(5000);

  if (since) query = query.gte("occurred_at", since);

  const { data, error } = await query;
  const rows = buildAiSearchVisibility(data ?? []);
  const totalViews = rows.reduce((sum, row) => sum + row.observedPageViews, 0);
  const totalLinkedSessions = rows.reduce((sum, row) => sum + row.linkedSessions, 0);
  const totalRegistrations = rows.reduce((sum, row) => sum + row.registrationSessions, 0);
  const totalApplications = rows.reduce((sum, row) => sum + row.applicationSessions, 0);
  const totalBriefs = rows.reduce((sum, row) => sum + row.briefSessions, 0);

  const strongest = rows[0] ?? null;
  const diagnosis = strongest
    ? isArabic
      ? `أقوى دليل AI Search مسجل حاليًا يأتي من ${platformLabels[strongest.platform]}. هذا يقيس إحالات أو مصادر مسجلة فعليًا فقط، ولا يثبت أن ملامح يظهر في جميع إجابات محركات الذكاء الاصطناعي.`
      : `The strongest recorded AI-search evidence currently comes from ${platformLabels[strongest.platform]}. This measures only observed referrals or explicit sources and does not prove MLAMH appears in every AI answer.`
    : isArabic
      ? "لا توجد إحالات AI Search مثبتة ضمن الفترة المحددة. هذا لا يعني عدم الظهور؛ بعض محركات الذكاء الاصطناعي قد لا ترسل Referrer قابلًا للقياس."
      : "No verified AI-search referrals were observed in the selected range. This does not prove zero visibility because some AI surfaces may not send a measurable referrer.";

  return (
    <AdminPageContainer>
      <AdminPageHeader
        eyebrow={isArabic ? "MLAMH · AI SEARCH" : "MLAMH · AI SEARCH"}
        title={isArabic ? "رؤية ملامح في البحث بالذكاء الاصطناعي" : "AI Search Visibility"}
        description={
          isArabic
            ? "تشخيص قراءة فقط يعتمد على إحالات ومصادر AI Search المسجلة فعليًا، ويربط النتائج بالمستخدم فقط عندما يوجد Session ID قابل للإثبات."
            : "Read-only diagnostics based on observed AI-search referrals or explicit source evidence, linking outcomes only when a verifiable session ID exists."
        }
      />

      <AdminCard className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-2 text-xs text-white/35">{isArabic ? "الفترة" : "Range"}</span>
          {Object.entries(ranges).map(([key, item]) => (
            <Link
              key={key}
              href={`/admin/marketing/ai-search-visibility?lang=${language}&range=${key}`}
              className={`rounded-full border px-3 py-1.5 text-xs ${rangeKey === key ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-white/45"}`}
            >
              {isArabic ? item.ar : item.en}
            </Link>
          ))}
        </div>
      </AdminCard>

      {error ? (
        <AdminCard className="mb-5 border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm leading-6 text-amber-100/80">
          {isArabic ? "تعذر تحميل أحداث التسويق. لن نعرض تقديرات بديلة." : "Marketing events could not be loaded. No substitute estimates will be shown."}
        </AdminCard>
      ) : null}

      <AdminGrid className="mb-6 md:grid-cols-5">
        <AdminStatCard label={isArabic ? "مشاهدات AI مرصودة" : "Observed AI views"} value={totalViews} />
        <AdminStatCard label={isArabic ? "Sessions قابلة للربط" : "Linked sessions"} value={totalLinkedSessions} />
        <AdminStatCard label={isArabic ? "تسجيلات مرتبطة" : "Linked registrations"} value={totalRegistrations} />
        <AdminStatCard label={isArabic ? "طلبات تقديم مرتبطة" : "Linked applications"} value={totalApplications} />
        <AdminStatCard label={isArabic ? "Briefs مرتبطة" : "Linked briefs"} value={totalBriefs} />
      </AdminGrid>

      <AdminCard className="mb-6 border border-gold/15 bg-gold/[0.035] p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">{isArabic ? "تشخيص الدليل" : "EVIDENCE DIAGNOSIS"}</p>
        <p className="mt-2 text-sm leading-7 text-white/75">{diagnosis}</p>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-white/[0.07] p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/60">AI SEARCH REFERRALS</p>
          <h2 className="mt-1 text-lg text-white">{isArabic ? "الإحالات والنتائج المرتبطة" : "Observed referrals and linked outcomes"}</h2>
          <p className="mt-2 text-xs leading-6 text-white/35">
            {isArabic
              ? "يتم التعرف فقط على Referrer أو utm_source صريح من ChatGPT وPerplexity وCopilot وGemini وClaude. Google العادي لا يُصنف كـAI لأن المصدر لا يثبت ذلك."
              : "Only explicit referrer or utm_source evidence from ChatGPT, Perplexity, Copilot, Gemini and Claude is classified. Ordinary Google traffic is not labeled AI because the evidence does not prove it."
            }
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/[0.06] text-xs text-white/35">
              <tr>
                <th className="px-4 py-3 text-start">{isArabic ? "المنصة" : "Platform"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "مشاهدات" : "Views"}</th>
                <th className="px-4 py-3 text-end">Sessions</th>
                <th className="px-4 py-3 text-end">{isArabic ? "تسجيل" : "Regs"}</th>
                <th className="px-4 py-3 text-end">{isArabic ? "تقديم" : "Apps"}</th>
                <th className="px-4 py-3 text-end">Briefs</th>
                <th className="px-4 py-3 text-end">Reg %</th>
                <th className="px-4 py-3 text-end">App %</th>
                <th className="px-4 py-3 text-start">{isArabic ? "أكثر الصفحات المرصودة" : "Top observed paths"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-white/35">
                    {isArabic ? "لا توجد إحالات AI Search مثبتة ضمن الفترة المحددة." : "No verified AI-search referrals in the selected range."}
                  </td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.platform} className="border-b border-white/[0.045] last:border-b-0">
                  <td className="px-4 py-3 text-white/70">{platformLabels[row.platform]}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.observedPageViews}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.linkedSessions}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.registrationSessions}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/55">{row.applicationSessions}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-gold/80">{row.briefSessions}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/45">{rate(row.registrationRate)}</td>
                  <td className="px-4 py-3 text-end tabular-nums text-white/45">{rate(row.applicationRate)}</td>
                  <td className="px-4 py-3 text-xs leading-6 text-white/40">
                    {row.topPaths.length > 0
                      ? row.topPaths.map((item) => `${item.path} (${item.views})`).join(" · ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-white/[0.06] p-5 text-xs leading-6 text-white/30">
          {isArabic
            ? "هذه اللوحة لا تقيس عدد مرات ذكر ملامح داخل إجابات AI نفسها. إنها تقيس فقط الزيارات التي وصلت إلينا بدليل Referrer أو Source واضح، ثم تربط النتائج اللاحقة عندما يكون Session ID موجودًا."
            : "This dashboard does not measure how often MLAMH is mentioned inside AI answers. It measures only visits reaching MLAMH with explicit referrer/source evidence, then links later outcomes when a session ID exists."
          }
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
