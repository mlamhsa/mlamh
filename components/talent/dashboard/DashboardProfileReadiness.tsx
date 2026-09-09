import Link from "next/link";

import DashboardTalentQualification from "@/components/talent/dashboard/DashboardTalentQualification";

type ChecklistItem = {
  label: string;
  done: boolean;
};

type DashboardProfileReadinessProps = {
  locale: string;
  isRtl: boolean;
  incompleteItems: number;
  profileCompletion: number;
  completionChecklist: ChecklistItem[];
  isProfileReady: boolean;
  approvalStatus: string;
};

function clampPercentage(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

function ProfileStrengthCard({
  locale,
  isRtl,
  completion,
}: {
  locale: string;
  isRtl: boolean;
  completion: number;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl ? "قوة الملف" : "PROFILE STRENGTH"}
          </p>
          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl ? "ملف أكمل = ترشيحات أقوى" : "A stronger profile improves matching"}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-gold/25 bg-gold/[0.06] px-3 py-1 text-xs text-gold">
          {completion}%
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-white/45">
        {isRtl
          ? "البيانات الإضافية مثل النبذة والمهارات واللغات والخبرات ومعرض الأعمال ليست شرطًا للاعتماد، لكنها تساعد ملامح على فهم ملفك بشكل أفضل وتزيد فرص ظهورك في الترشيحات المناسبة."
          : "Extra details such as your bio, skills, languages, experience and portfolio are not approval requirements, but they help MLAMH understand your profile and improve your chances of appearing in relevant recommendations."}
      </p>

      <div
        role="progressbar"
        aria-label={isRtl ? "قوة الملف" : "Profile strength"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion}
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500"
          style={{ width: `${completion}%` }}
        />
      </div>

      {completion < 100 ? (
        <Link
          href={`/${locale}/talent-dashboard/profile`}
          className="mt-5 inline-flex items-center text-sm text-gold transition hover:text-gold-soft"
        >
          {isRtl ? "تحسين قوة الملف" : "Improve profile strength"}
        </Link>
      ) : null}
    </section>
  );
}

export default function DashboardProfileReadiness({
  locale,
  isRtl,
  incompleteItems,
  profileCompletion,
  completionChecklist,
  isProfileReady,
  approvalStatus,
}: DashboardProfileReadinessProps) {
  const safeCompletion = clampPercentage(profileCompletion);
  const isApproved = approvalStatus === "approved";
  const isPendingReview = approvalStatus === "pending" || approvalStatus === "submitted";
  const qualificationState = <DashboardTalentQualification locale={locale} />;
  const strengthState = <ProfileStrengthCard locale={locale} isRtl={isRtl} completion={safeCompletion} />;

  if (isProfileReady && isApproved) {
    const completionDescription = safeCompletion >= 100
      ? isRtl
        ? "ملفك مكتمل، ويمكنك التقديم على الفرص بشكل طبيعي."
        : "Your profile is complete, and you can apply to opportunities normally."
      : isRtl
        ? "استوفيت متطلبات الاعتماد الأساسية. يمكنك الاستمرار في تحسين البيانات الاختيارية لرفع قوة ملفك وفرص الترشيح."
        : "You have completed the approval requirements. Keep improving optional details to strengthen your profile and recommendation potential.";

    return (
      <div className="space-y-6">
        {strengthState}
        {qualificationState}
        <section className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-sm text-emerald-300">✓</div>
          <p className="arabic-safe mt-5 text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl ? "جاهزية التقديم" : "APPLICATION READINESS"}
          </p>
          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl ? "يمكنك التقديم على الفرص" : "You can apply to opportunities"}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/45">{completionDescription}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {isRtl ? "التقديم متاح" : "Applications enabled"}
          </div>
          <Link
            href={`/${locale}/opportunities`}
            className="arabic-safe mt-6 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-black outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
          </Link>
        </section>
      </div>
    );
  }

  if (isProfileReady && isPendingReview) {
    return (
      <div className="space-y-6">
        {strengthState}
        {qualificationState}
        <section className="rounded-[1.75rem] border border-amber-400/15 bg-amber-400/[0.045] p-5 sm:p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 text-sm text-amber-300">⏳</div>
          <p className="arabic-safe mt-5 text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl ? "حالة الملف" : "PROFILE STATUS"}
          </p>
          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl ? "ملفك قيد المراجعة" : "Your profile is under review"}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
            {isRtl
              ? "يمكنك استعراض الفرص الآن. سيتاح التقديم بعد اعتماد الملف، بينما يمكنك الاستمرار في تحسين بياناتك الاختيارية."
              : "You can browse opportunities now. Applying becomes available after approval, while you can continue improving optional profile details."}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-4 py-2 text-xs text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            {isRtl ? "بانتظار الاعتماد" : "Awaiting approval"}
          </div>
          <Link
            href={`/${locale}/opportunities`}
            className="arabic-safe mt-6 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-black outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {isRtl ? "استعراض الفرص" : "Browse Opportunities"}
          </Link>
        </section>
      </div>
    );
  }

  const missingItems = completionChecklist.filter((item) => !item.done);

  return (
    <div className="space-y-6">
      {strengthState}
      {qualificationState}
      <section className="rounded-[1.75rem] border border-gold/15 bg-gold/[0.035] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
              {isRtl ? "جاهزية الاعتماد" : "APPROVAL READINESS"}
            </p>
            <h2 className="mt-3 text-2xl font-light text-white">
              {isProfileReady
                ? isRtl ? "ملفك جاهز للإرسال" : "Your profile is ready to submit"
                : isRtl ? "أكمل البيانات المطلوبة" : "Complete the required information"}
            </h2>
          </div>

          {incompleteItems > 0 ? (
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/45">{incompleteItems}</span>
          ) : null}
        </div>

        <p className="mt-3 text-sm leading-7 text-white/45">
          {isProfileReady
            ? isRtl
              ? "استوفيت الحقول المطلوبة للاعتماد. عند الإرسال قد يعتمد النظام الملف تلقائيًا إذا استوفى شروط الاعتماد التلقائي، وإلا ينتقل للمراجعة اليدوية."
              : "You completed the required approval fields. On submission, the profile may be approved automatically if it meets auto-approval rules; otherwise it goes to manual review."
            : isRtl
              ? "النجمة ⭐ تعني أن الحقل مطلوب للاعتماد. أكمل العناصر المتبقية ثم أرسل ملفك للمراجعة."
              : "A ⭐ marks information required for approval. Complete the remaining items, then submit your profile for review."}
        </p>

        {missingItems.length > 0 ? (
          <div className="mt-6 space-y-3">
            {missingItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <span className="text-sm leading-6 text-white/60">⭐ {item.label}</span>
                <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-[11px] text-gold">
                  {isRtl ? "مطلوب للاعتماد" : "Required for approval"}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={`/${locale}/talent-dashboard/profile`}
          className="arabic-safe mt-5 inline-flex w-full items-center justify-center rounded-full border border-gold/35 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold outline-none transition hover:bg-gold hover:text-black focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {isProfileReady
            ? isRtl ? "مراجعة الملف" : "Review Profile"
            : isRtl ? "إكمال البيانات" : "Complete Profile"}
        </Link>
      </section>
    </div>
  );
}
