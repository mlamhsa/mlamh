import Link from "next/link";

import { requireTalent } from "@/lib/auth/require-talent";
import {
  evaluateTalentQualification,
  getTalentQualificationReasons,
} from "@/lib/talent/qualification";

export default async function DashboardTalentQualification({
  locale,
}: {
  locale: string;
}) {
  const isRtl = locale === "ar";
  const { profile, talent } = await requireTalent(locale);

  if (!talent) return null;

  const qualification = evaluateTalentQualification({
    ...talent,
    profile_approval_status: profile.approval_status,
    profile_status: profile.status,
  });
  const reasons = getTalentQualificationReasons(
    qualification,
    isRtl ? "ar" : "en",
  );

  if (qualification.state === "qualified") {
    return (
      <section className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:p-6">
        <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
          {isRtl ? "جاهز للترشيح" : "Qualified"}
        </span>
        <h2 className="mt-4 text-2xl font-light text-white">
          {isRtl ? "ملفك جاهز للترشيح" : "Your profile is ready for recommendations"}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
          {isRtl
            ? "ملفك مستوفٍ لمتطلبات الظهور والترشيح الأساسية أمام الشركات وأصحاب الفرص."
            : "Your profile meets the core visibility and recommendation requirements for companies and opportunity owners."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-orange-400/20 bg-orange-400/[0.045] p-5 sm:p-6">
      <span className="inline-flex rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-300">
        {isRtl ? "غير جاهز" : "Not ready"}
      </span>
      <h2 className="mt-4 text-2xl font-light text-white">
        {isRtl ? "ملفك غير جاهز للترشيح بعد" : "Your profile is not ready for recommendations yet"}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
        {isRtl
          ? "أضف صورك وأكمل بياناتك لتظهر للشركات وأصحاب الفرص."
          : "Add your photos and complete your details to appear to companies and opportunity owners."}
      </p>

      {reasons.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span
              key={reason}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/65"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <Link
        href={`/${locale}/talent-dashboard/profile`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-5 text-sm text-gold transition hover:bg-gold hover:text-black"
      >
        {isRtl ? "إكمال الملف" : "Complete profile"}
      </Link>
    </section>
  );
}
