import Link from "next/link";

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
};

function clampPercentage(value: number) {
  return Math.min(
    Math.max(value, 0),
    100,
  );
}

export default function DashboardProfileReadiness({
  locale,
  isRtl,
  incompleteItems,
  profileCompletion,
  completionChecklist,
  isProfileReady,
}: DashboardProfileReadinessProps) {
  const safeCompletion =
    clampPercentage(profileCompletion);

  /*
   * هذه البطاقة مسؤولة فقط عن:
   * هل الموهبة مستوفية الحد الأدنى للتقديم؟
   *
   * ولا علاقة لها بـ:
   * - مراجعة تعديل الاسم
   * - مراجعة رقم الجوال
   * - مراجعة الجنسية
   * - approval_status
   * - verified
   */

  if (isProfileReady) {
    const completionDescription =
      safeCompletion >= 100
        ? isRtl
          ? "ملفك مكتمل، ويمكنك التقديم على الفرص بشكل طبيعي."
          : "Your profile is complete, and you can apply to opportunities normally."
        : isRtl
          ? `استوفيت جميع متطلبات التقديم الأساسية. نسبة اكتمال ملفك ${safeCompletion}٪، ويمكنك إضافة البيانات الاختيارية لاحقًا لتحسين ظهور ملفك.`
          : `You have completed all required information for applying. Your profile is ${safeCompletion}% complete, and you can add optional details later to improve your profile.`;

    return (
      <section className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:p-6">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-sm text-emerald-300">
            ✓
          </div>

          <p className="arabic-safe mt-5 text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl
              ? "جاهزية التقديم"
              : "Application Readiness"}
          </p>

          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl
              ? "يمكنك التقديم على الفرص"
              : "You can apply to opportunities"}
          </h2>

          <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
            {completionDescription}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

            {isRtl
              ? "التقديم متاح"
              : "Applications enabled"}
          </div>

          <Link
            href={`/${locale}/opportunities`}
            className="arabic-safe mt-6 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-black outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            {isRtl
              ? "استعراض الفرص"
              : "Browse Opportunities"}
          </Link>
        </div>
      </section>
    );
  }

  const missingItems =
    completionChecklist.filter(
      (item) => !item.done,
    );

  return (
    <section className="rounded-[1.75rem] border border-gold/15 bg-gold/[0.035] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl
              ? "جاهزية التقديم"
              : "Application Readiness"}
          </p>

          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl
              ? "أكمل البيانات المطلوبة"
              : "Complete the required information"}
          </h2>
        </div>

        {incompleteItems > 0 ? (
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/45">
            {incompleteItems}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-white/45">
        {isRtl
          ? "أكمل البيانات الأساسية المتبقية لتفعيل التقديم على الفرص."
          : "Complete the remaining required information to enable opportunity applications."}
      </p>

      <div
        role="progressbar"
        aria-label={
          isRtl
            ? "نسبة اكتمال الملف"
            : "Profile completion percentage"
        }
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeCompletion}
        className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-500"
          style={{
            width: `${safeCompletion}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs">
        <span className="text-white/35">
          {isRtl
            ? "اكتمال الملف"
            : "Profile completion"}
        </span>

        <span className="text-gold">
          {safeCompletion}%
        </span>
      </div>

      {missingItems.length > 0 ? (
        <div className="mt-6 space-y-3">
          {missingItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <span className="text-sm leading-6 text-white/60">
                {item.label}
              </span>

              <span className="shrink-0 rounded-full bg-gold/10 px-3 py-1 text-[11px] text-gold">
                {isRtl
                  ? "مطلوب"
                  : "Required"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <Link
        href={`/${locale}/talent-dashboard/profile`}
        className="arabic-safe mt-5 inline-flex w-full items-center justify-center rounded-full border border-gold/35 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold outline-none transition hover:bg-gold hover:text-black focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {isRtl
          ? "إكمال البيانات"
          : "Complete Profile"}
      </Link>
    </section>
  );
}