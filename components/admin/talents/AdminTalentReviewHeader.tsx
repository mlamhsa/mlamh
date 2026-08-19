import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  Pencil,
  XCircle,
} from "lucide-react";

type AdminLanguage = "ar" | "en";

type AdminTalentReviewHeaderProps = {
  talentId: number | string;
  name: string;
  secondaryName?: string | null;
  status?: string | null;
  published?: boolean | null;
  views?: number | null;
  completion?: number | null;
  language: AdminLanguage;
};

function addLanguage(
  path: string,
  language: AdminLanguage,
) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${language}`;
}

function getStatusConfig(
  status: string | null | undefined,
  language: AdminLanguage,
) {
  const isArabic = language === "ar";

  switch (status) {
    case "approved":
      return {
        label: isArabic ? "معتمد" : "Approved",
        icon: CheckCircle2,
        className:
          "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400",
      };

    case "rejected":
      return {
        label: isArabic ? "مرفوض" : "Rejected",
        icon: XCircle,
        className:
          "border-red-500/20 bg-red-500/[0.08] text-red-400",
      };

    case "pending":
      return {
        label: isArabic ? "قيد المراجعة" : "Pending review",
        icon: Clock3,
        className:
          "border-gold/25 bg-gold/[0.08] text-gold",
      };

      case "changes_requested":
  return {
    label: isArabic
      ? "مطلوب تعديل"
      : "Changes requested",
    icon: CircleAlert,
    className:
      "border-amber-500/20 bg-amber-500/[0.08] text-amber-300",
  };

case "suspended":
  return {
    label: isArabic
      ? "موقوف"
      : "Suspended",
    icon: XCircle,
    className:
      "border-red-500/20 bg-red-500/[0.08] text-red-300",
  };
  
    default:
      return {
        label: isArabic ? "غير مرسل" : "Not submitted",
        icon: CircleAlert,
        className:
          "border-white/10 bg-white/[0.04] text-white/45",
      };
  }
}

export function AdminTalentReviewHeader({
  talentId,
  name,
  secondaryName,
  status,
  published,
  views = 0,
  completion = 0,
  language,
}: AdminTalentReviewHeaderProps) {
  const isArabic = language === "ar";

  const statusConfig = getStatusConfig(
    status,
    language,
  );

  const StatusIcon = statusConfig.icon;

  const BackIcon = isArabic
    ? ArrowRight
    : ArrowLeft;

  const normalizedCompletion = Math.max(
    0,
    Math.min(100, completion ?? 0),
  );

  return (
    <header
      dir={isArabic ? "rtl" : "ltr"}
      className="border-b border-white/[0.08] pb-7"
    >
      {/* Top navigation */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={addLanguage(
            "/admin",
            language,
          )}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 text-xs text-white/55 transition hover:border-gold/25 hover:text-gold"
        >
          <BackIcon className="h-4 w-4" />

          <span>
            {isArabic
              ? "العودة إلى المواهب"
              : "Back to talents"}
          </span>
        </Link>

        <Link
          href={addLanguage(
            `/admin/talents/${talentId}/edit`,
            language,
          )}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.025] px-4 text-xs text-white/65 transition hover:border-gold/30 hover:text-gold"
        >
          <Pencil className="h-3.5 w-3.5" />

          {isArabic ? "تعديل الملف" : "Edit profile"}
        </Link>
      </div>

      {/* Identity */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
            {isArabic
              ? "مركز مراجعة المواهب"
              : "Talent Review Center"}
          </p>

          <h1 className="mt-3 truncate text-3xl font-light text-white sm:text-4xl">
            {name}
          </h1>

          {secondaryName ? (
            <p className="mt-2 text-sm text-white/40">
              {secondaryName}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs ${statusConfig.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </span>

            <span
              className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs ${
                published
                  ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                  : "border-white/10 bg-white/[0.03] text-white/40"
              }`}
            >
              {published
                ? isArabic
                  ? "منشور"
                  : "Published"
                : isArabic
                  ? "غير منشور"
                  : "Hidden"}
            </span>

            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 text-xs text-white/45">
              <Eye className="h-3.5 w-3.5" />

              {(views ?? 0).toLocaleString(
                isArabic ? "ar-SA" : "en-US",
              )}

              <span>
                {isArabic
                  ? "مشاهدة"
                  : "views"}
              </span>
            </span>
          </div>
        </div>

        {/* Completion */}
        <div className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 xl:w-[280px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-white/40">
              {isArabic
                ? "اكتمال الملف"
                : "Profile completion"}
            </span>

            <span className="text-lg font-medium text-gold">
              {normalizedCompletion}%
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{
                width: `${normalizedCompletion}%`,
              }}
            />
          </div>

          <p className="mt-3 text-[11px] leading-5 text-white/30">
            {normalizedCompletion >= 80
              ? isArabic
                ? "الملف يحتوي على معظم البيانات المطلوبة للمراجعة."
                : "Most required profile information is complete."
              : isArabic
                ? "بعض بيانات الملف ما زالت تحتاج إلى الاستكمال."
                : "Some profile information is still incomplete."}
          </p>
        </div>
      </div>
    </header>
  );
}