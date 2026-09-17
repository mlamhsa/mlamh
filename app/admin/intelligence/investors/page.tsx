import {
  AdminCard,
  AdminGrid,
  AdminPageContainer,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/ui";
import { requireAdminAccess } from "@/lib/auth/require-admin";

export const metadata = {
  title: "Investor Relations AI — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    lang?: string;
  }>;
};

type WorkflowStep = {
  key: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  mode: "automatic" | "approval";
};

const workflow: WorkflowStep[] = [
  {
    key: "discover",
    titleAr: "اكتشاف المستثمرين",
    titleEn: "Investor discovery",
    descriptionAr:
      "البحث عن الصناديق والمستثمرين الملائكيين والشركات الاستراتيجية والمسرعات والـFamily Offices المناسبة لملامح.",
    descriptionEn:
      "Find VCs, angels, strategic companies, accelerators and family offices that match MLAMH.",
    mode: "automatic",
  },
  {
    key: "qualify",
    titleAr: "التحقق والتأهيل",
    titleEn: "Research & qualification",
    descriptionAr:
      "مراجعة القطاع والمرحلة والمنطقة وحجم الاستثمار والاستثمارات السابقة والشخص المسؤول عن القرار.",
    descriptionEn:
      "Verify sector, stage, geography, cheque size, prior investments and the relevant decision-maker.",
    mode: "automatic",
  },
  {
    key: "draft",
    titleAr: "تجهيز رسالة التواصل",
    titleEn: "Personalized outreach draft",
    descriptionAr:
      "صياغة موضوع ورسالة مخصصة حسب الجهة والشخص مع زاوية تقديم مناسبة لملامح وما يلزم إرفاقه.",
    descriptionEn:
      "Prepare a tailored subject, message, positioning angle and recommended attachments for each lead.",
    mode: "automatic",
  },
  {
    key: "approve",
    titleAr: "موافقة المدير",
    titleEn: "Admin approval",
    descriptionAr:
      "لا يخرج أي بريد أو تواصل خارجي قبل أن تراجع الرسالة وتوافق عليها من لوحة الأدمن.",
    descriptionEn:
      "No external outreach is sent until the admin reviews and explicitly approves the draft.",
    mode: "approval",
  },
  {
    key: "followup",
    titleAr: "المتابعة وإدارة العلاقة",
    titleEn: "Follow-up & relationship tracking",
    descriptionAr:
      "تتبع الردود، تجهيز المتابعات، تحديث حالة المستثمر وتجهيز الرد التالي أو طلبات الاجتماع والملفات.",
    descriptionEn:
      "Track replies, prepare follow-ups, update investor status and organize next replies, meetings or requested materials.",
    mode: "approval",
  },
];

const pipeline = [
  { ar: "مكتشف", en: "Discovered" },
  { ar: "مؤهل", en: "Qualified" },
  { ar: "بانتظار الموافقة", en: "Awaiting approval" },
  { ar: "تم التواصل", en: "Contacted" },
  { ar: "متابعة", en: "Follow-up" },
  { ar: "اجتماع", en: "Meeting" },
];

export default async function AdminInvestorRelationsAIPage({ searchParams }: PageProps) {
  await requireAdminAccess();

  const { lang = "ar" } = await searchParams;
  const isArabic = lang !== "en";

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="MLAMH Investor Relations AI"
        description={
          isArabic
            ? "مساحة تشغيل مخصصة لاكتشاف المستثمرين وتأهيلهم وتجهيز التواصل وإدارة المتابعة، مع إبقاء الإرسال الخارجي تحت موافقة الإدارة."
            : "A dedicated workspace for investor discovery, qualification, outreach drafting and follow-up management, with external sending gated by admin approval."
        }
      />

      <AdminCard className="mb-8 overflow-hidden border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(212,160,23,0.09),transparent_42%),rgba(255,255,255,0.025)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">
              INVESTOR RELATIONS AGENT
            </p>
            <h2 className="mt-2 text-2xl font-light text-white">
              {isArabic ? "بحث آلي. قرار الإرسال بيدك." : "Automated research. Human-approved outreach."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/45">
              {isArabic
                ? "يعمل الوكيل على بناء Pipeline استثماري منظم لملامح، ويقوم بالبحث والتحقق والتأهيل وصياغة الرسائل والمتابعات. أي إجراء خارجي يظل مقفلاً حتى تتم الموافقة عليه من لوحة الإدارة."
                : "The agent builds a structured investor pipeline for MLAMH, researching, qualifying and drafting outreach and follow-ups. Any external action remains locked until explicitly approved in the admin console."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5 text-[11px] font-medium text-emerald-200">
              {isArabic ? "البحث: تلقائي" : "Research: automatic"}
            </span>
            <span className="rounded-full border border-amber-300/25 bg-amber-300/[0.08] px-3 py-1.5 text-[11px] font-medium text-amber-100">
              {isArabic ? "الإرسال: يتطلب موافقة" : "Sending: approval required"}
            </span>
          </div>
        </div>
      </AdminCard>

      <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={isArabic ? "مستثمرون مكتشفون" : "Discovered investors"} value={0} />
        <AdminStatCard label={isArabic ? "Leads مؤهلة" : "Qualified leads"} value={0} />
        <AdminStatCard label={isArabic ? "بانتظار موافقتك" : "Awaiting approval"} value={0} />
        <AdminStatCard label={isArabic ? "متابعات مستحقة" : "Follow-ups due"} value={0} />
      </AdminGrid>

      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gold/70">WORKFLOW</p>
            <h2 className="mt-1 text-xl font-light text-white">
              {isArabic ? "دورة عمل الوكيل" : "Agent operating flow"}
            </h2>
          </div>
          <p className="text-xs text-white/30">
            {isArabic ? "لا توجد رسائل خارجية تلقائية بدون موافقة" : "No autonomous external sending"}
          </p>
        </div>

        <AdminGrid className="md:grid-cols-2 xl:grid-cols-5">
          {workflow.map((step, index) => (
            <AdminCard key={step.key} className="relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06] text-xs text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] font-medium ${
                    step.mode === "automatic"
                      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200/85"
                      : "border-amber-300/20 bg-amber-300/[0.07] text-amber-100/80"
                  }`}
                >
                  {step.mode === "automatic"
                    ? isArabic
                      ? "تلقائي"
                      : "Automatic"
                    : isArabic
                      ? "موافقة"
                      : "Approval"}
                </span>
              </div>
              <h3 className="mt-5 text-sm font-medium text-white/80">
                {isArabic ? step.titleAr : step.titleEn}
              </h3>
              <p className="mt-2 text-xs leading-6 text-white/40">
                {isArabic ? step.descriptionAr : step.descriptionEn}
              </p>
            </AdminCard>
          ))}
        </AdminGrid>
      </div>

      <AdminGrid className="mb-8 lg:grid-cols-[1.35fr_0.65fr]">
        <AdminCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">INVESTOR PIPELINE</p>
              <h2 className="mt-2 text-lg font-light text-white">
                {isArabic ? "مسار المستثمرين" : "Investor pipeline"}
              </h2>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/35">
              {isArabic ? "لا توجد بيانات بعد" : "No records yet"}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pipeline.map((stage) => (
              <div key={stage.en} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs text-white/40">{isArabic ? stage.ar : stage.en}</p>
                <p className="mt-2 text-2xl font-light text-white">0</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-white/[0.09] bg-white/[0.015] p-5 text-center">
            <p className="text-sm text-white/55">
              {isArabic
                ? "ستظهر هنا الجهات المؤهلة ورسائل التواصل الجاهزة للمراجعة بمجرد ربط محرك البحث وقاعدة المستثمرين."
                : "Qualified investors and outreach drafts will appear here once the research engine and investor database are connected."}
            </p>
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">APPROVAL POLICY</p>
          <h2 className="mt-2 text-lg font-light text-white">
            {isArabic ? "ضوابط التواصل" : "Outreach controls"}
          </h2>

          <div className="mt-5 space-y-3 text-xs leading-6 text-white/45">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-medium text-white/70">{isArabic ? "البحث والتحليل" : "Research & analysis"}</p>
              <p className="mt-1">{isArabic ? "يعمل تلقائيًا دون الحاجة لموافقة لكل عملية بحث." : "Runs automatically without approval for every research action."}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-medium text-white/70">{isArabic ? "كتابة الرسالة" : "Draft preparation"}</p>
              <p className="mt-1">{isArabic ? "ينشئ الوكيل المسودة وسبب التواصل والموضوع والمرفقات المقترحة." : "The agent prepares the draft, rationale, subject line and recommended attachments."}</p>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
              <p className="font-medium text-amber-100/90">{isArabic ? "الإرسال والمتابعة" : "Sending & follow-up"}</p>
              <p className="mt-1 text-amber-50/55">{isArabic ? "لا يتم أي إرسال خارجي إلا بعد موافقتك. نفس القاعدة تنطبق على رسائل المتابعة في المرحلة الأولى." : "No external send occurs without your approval. The same rule applies to follow-ups in the first phase."}</p>
            </div>
          </div>
        </AdminCard>
      </AdminGrid>

      <AdminCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">MASTER INVESTOR BRIEF</p>
            <h2 className="mt-2 text-lg font-light text-white">
              {isArabic ? "مصدر الحقيقة الذي سيعتمد عليه الوكيل" : "The agent's source of truth"}
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/40">
              {isArabic
                ? "سيتم ربط الوكيل بملف موحد عن ملامح يشمل تعريف المشروع، المشكلة والحل، السوق، نموذج العمل، الذكاء الاصطناعي، التوسع، المرحلة الحالية، الجولة المطلوبة، استخدام الأموال والملفات الرسمية المعتمدة."
                : "The agent will use one governed MLAMH brief covering the company, problem, solution, market, business model, AI layer, expansion, current stage, fundraising ask, use of funds and approved materials."}
            </p>
          </div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
            {isArabic ? "التوصيل الخلفي: المرحلة التالية" : "Backend connection: next phase"}
          </span>
        </div>
      </AdminCard>
    </AdminPageContainer>
  );
}
