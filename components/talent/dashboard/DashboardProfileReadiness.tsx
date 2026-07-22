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
};

export default function DashboardProfileReadiness({
  locale,
  isRtl,
  incompleteItems,
  profileCompletion,
  completionChecklist,
}: DashboardProfileReadinessProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
      {incompleteItems === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-2xl text-emerald-300">
            ✓
          </div>

          <p className="arabic-safe mt-5 text-[10px] uppercase tracking-[0.28em] text-gold">
            {isRtl ? "جاهزية الملف" : "Profile Readiness"}
          </p>

          <h2 className="mt-3 text-2xl font-light text-white">
            {isRtl ? "ملفك مكتمل" : "Your profile is complete"}
          </h2>

          <p className="mt-3 max-w-md text-sm leading-7 text-white/45">
            {isRtl
              ? "أكملت جميع الأقسام الأساسية، وملفك جاهز للظهور أمام الشركات."
              : "You completed all essential sections, and your profile is ready to be discovered by companies."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

            {isRtl
              ? "جاهز للنشر والمشاركة"
              : "Ready to publish and share"}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
            <p className="arabic-safe text-[10px] uppercase tracking-[0.28em] text-gold">
                {isRtl ? "جاهزية الملف" : "Profile Readiness"}
              </p>

              <h2 className="mt-3 text-2xl font-light">
                {isRtl
                  ? "ما الذي ينقص ملفك؟"
                  : "What is still missing?"}
              </h2>
            </div>

            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/45">
              {incompleteItems}
            </span>
          </div>

          <div
  role="progressbar"
  aria-label={
    isRtl ? "نسبة اكتمال الملف" : "Profile completion percentage"
  }
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.min(Math.max(profileCompletion, 0), 100)}
  className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10"
>
  <div
    className="h-full rounded-full bg-gold transition-[width] duration-500"
    style={{
      width: `${Math.min(Math.max(profileCompletion, 0), 100)}%`,
    }}
  />
</div>

          <div className="mt-3 flex items-center justify-between gap-4 text-xs">
            <span className="text-white/35">
              {isRtl ? "اكتمال الملف" : "Profile completion"}
            </span>

            <span className="text-gold">
              {profileCompletion}%
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {completionChecklist.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <span className="text-sm leading-6 text-white/60">
                  {item.label}
                </span>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] ${
                    item.done
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-gold/10 text-gold"
                  }`}
                >
                  {item.done
                    ? isRtl
                      ? "مكتمل"
                      : "Done"
                    : isRtl
                      ? "ناقص"
                      : "Missing"}
                </span>
              </div>
            ))}
          </div>

          <Link
            href={`/${locale}/talent-dashboard/profile`}
            className="arabic-safe mt-5 inline-flex w-full items-center justify-center rounded-full border border-gold/35 bg-gold/[0.06] px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-gold outline-none transition hover:bg-gold hover:text-black focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {isRtl
              ? "إكمال البيانات الناقصة"
              : "Complete Missing Details"}
          </Link>
        </>
      )}
    </section>
  );
}