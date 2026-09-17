import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { InvestorLinkedInPanel } from "@/components/admin/investors/InvestorLinkedInPanel";
import { InvestorRelationsWorkspace } from "@/components/admin/investors/InvestorRelationsWorkspace";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getInvestorRelationsDashboard } from "@/lib/intelligence/investors/service";

export const metadata = {
  title: "Investor Relations AI — MLAMH Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; gmail?: string }>;
};

const workflow = [
  {
    key: "discover",
    ar: "اكتشاف وتحقيق",
    en: "Discover & verify",
    detailAr: "بحث ويب بمصادر عامة، ثم تأهيل حسب القطاع والمرحلة والمنطقة والسجل الاستثماري.",
    detailEn: "Web research with public evidence, then qualification by sector, stage, geography and investment history.",
    mode: "AUTO",
  },
  {
    key: "draft",
    ar: "صياغة مخصصة",
    en: "Personalized draft",
    detailAr: "تجهيز زاوية التواصل والموضوع ونص الرسالة بناءً على المستثمر نفسه وMaster Brief المعتمد.",
    detailEn: "Prepare the angle, subject and email using the investor research and approved Master Brief.",
    mode: "AUTO",
  },
  {
    key: "approve",
    ar: "مراجعتك وموافقتك",
    en: "Your review & approval",
    detailAr: "المسودة لا تغادر النظام قبل اعتمادها منك داخل لوحة الإدارة.",
    detailEn: "The draft cannot leave MLAMH until you approve it in the admin console.",
    mode: "HUMAN",
  },
  {
    key: "send",
    ar: "إرسال عبر Gmail",
    en: "Send via Gmail",
    detailAr: "بعد الموافقة فقط يظهر إجراء الإرسال عبر حساب Gmail المرتبط، مع حفظ Thread ID للمتابعة.",
    detailEn: "Only after approval can the message be sent through connected Gmail, preserving the thread for follow-up.",
    mode: "HUMAN",
  },
  {
    key: "followup",
    ar: "متابعة الردود",
    en: "Replies & follow-up",
    detailAr: "الوكيل يقرأ الرد، يصنفه، ويجهز الرد أو المتابعة التالية للموافقة دون إرسال تلقائي.",
    detailEn: "The agent reads the reply, classifies it and prepares the next response for approval without auto-sending.",
    mode: "AUTO + APPROVAL",
  },
];

export default async function AdminInvestorRelationsAIPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang = "ar", gmail: gmailResult } = await searchParams;
  const isArabic = lang !== "en";
  const dashboard = await getInvestorRelationsDashboard();
  const gmailOAuthConfigured = Boolean(
    process.env.INVESTOR_GMAIL_CLIENT_ID?.trim() && process.env.INVESTOR_GMAIL_CLIENT_SECRET?.trim(),
  );

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="MLAMH Investor Relations AI"
        description={
          isArabic
            ? "مدير علاقات مستثمرين بالذكاء الاصطناعي: يبحث ويؤهل ويكتب ويتابع، بينما يبقى قرار التواصل الخارجي بيد الإدارة."
            : "An AI investor-relations manager that researches, qualifies, drafts and follows up while external communication stays under admin control."
        }
      />

      {gmailResult ? (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${gmailResult === "connected" ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200" : "border-red-400/20 bg-red-400/[0.06] text-red-200"}`}>
          {gmailResult === "connected"
            ? (isArabic ? "تم ربط Gmail بنجاح لعلاقات المستثمرين." : "Gmail was connected successfully for investor relations.")
            : (isArabic ? "تعذر إكمال ربط Gmail. راجع إعداد OAuth وحاول مرة أخرى." : "Gmail connection could not be completed. Review OAuth configuration and try again.")}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">GMAIL OAUTH READINESS</p>
          <p className="mt-1 text-xs text-white/55">
            {gmailOAuthConfigured
              ? (isArabic ? "تم العثور على بيانات OAuth الآمنة في بيئة الخادم." : "Server-side OAuth credentials are configured securely.")
              : (isArabic ? "بيانات OAuth غير مكتملة في بيئة الخادم." : "Server-side OAuth credentials are not fully configured.")}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${gmailOAuthConfigured ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-200" : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100/80"}`}>
          {gmailOAuthConfigured ? "OAUTH READY" : "SETUP REQUIRED"}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-gold/[0.055] px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-gold">APPROVAL-GATED AUTONOMY</p>
          <p className="mt-1 text-xs text-white/45">
            {isArabic
              ? "البحث وصناعة المسودات تلقائيان · الإرسال الخارجي يتطلب موافقتك"
              : "Research and drafting are autonomous · external sending requires your approval"}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-200">
          NO AUTO-SEND
        </span>
      </div>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={isArabic ? "مستثمرون مكتشفون" : "Discovered investors"} value={dashboard.counts.discovered} />
        <AdminStatCard label={isArabic ? "مستثمرون مؤهلون" : "Qualified investors"} value={dashboard.counts.qualified} />
        <AdminStatCard label={isArabic ? "بانتظار موافقتك" : "Awaiting approval"} value={dashboard.counts.awaitingApproval} />
        <AdminStatCard label={isArabic ? "متابعات مستحقة" : "Follow-ups due"} value={dashboard.counts.followUpsDue} />
      </AdminGrid>

      <div className="mb-8">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">OPERATING FLOW</p>
          <h2 className="mt-1 text-xl font-light text-white">{isArabic ? "كيف يعمل الوكيل" : "How the agent operates"}</h2>
        </div>
        <AdminGrid className="md:grid-cols-2 xl:grid-cols-5">
          {workflow.map((step, index) => (
            <AdminCard key={step.key}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-xs text-gold">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-white/25">{step.mode}</span>
              </div>
              <h3 className="mt-4 text-sm font-medium text-white/75">{isArabic ? step.ar : step.en}</h3>
              <p className="mt-2 text-xs leading-6 text-white/40">{isArabic ? step.detailAr : step.detailEn}</p>
            </AdminCard>
          ))}
        </AdminGrid>
      </div>

      <InvestorLinkedInPanel leads={dashboard.leads} isArabic={isArabic} />

      <InvestorRelationsWorkspace
        isArabic={isArabic}
        leads={dashboard.leads}
        outreach={dashboard.outreach}
        masterBriefAr={dashboard.settings.masterBriefAr}
        masterBriefEn={dashboard.settings.masterBriefEn}
        gmail={{
          status: dashboard.gmail.status,
          emailAddress: dashboard.gmail.emailAddress,
          connectedAt: dashboard.gmail.connectedAt,
        }}
      />
    </AdminPageContainer>
  );
}
