"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";

type Props = {
  locale: string;
  approvalStatus?: string | null;
  profileStrength: number;
};

export default function TalentApprovedCompletionBanner({
  locale,
  approvalStatus,
  profileStrength,
}: Props) {
  const pathname = usePathname();
  const isArabic = locale === "ar";
  const normalizedStatus = String(approvalStatus ?? "").trim().toLowerCase();
  const root = `/${locale}/talent-dashboard`;

  if (
    normalizedStatus !== "approved" ||
    profileStrength >= 100 ||
    pathname !== root
  ) {
    return null;
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`w-full px-4 pt-28 sm:px-6 lg:px-8 lg:pt-32 ${
        isArabic ? "xl:pr-[22rem]" : "xl:pl-[22rem]"
      }`}
    >
      <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/[0.045] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-200">
              {isArabic ? "اعتمادك محفوظ" : "Your approval is protected"}
            </p>
            <p className="mt-1 text-sm leading-7 text-white/55">
              {isArabic
                ? `ملفك معتمد ولن تحتاج لإعادة المراجعة. قوة ملفك الآن ${profileStrength}% — أكمل البيانات المهنية لزيادة فرص ظهورك للجهات والمطابقة مع الفرص.`
                : `Your profile remains approved and does not need another review. Profile strength is ${profileStrength}% — add more professional details to improve discovery and matching.`}
            </p>
          </div>
        </div>
        <Link
          href={`${root}/profile/advanced`}
          className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/[0.14] sm:mt-0"
        >
          <Sparkles size={16} aria-hidden="true" />
          {isArabic ? "تحسين الملف" : "Improve profile"}
        </Link>
      </div>
    </div>
  );
}
