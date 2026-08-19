"use client";

import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  approveTalentProfileChangeAction,
  rejectTalentProfileChangeAction,
} from "@/lib/actions/review-talent-profile-change";

type ProtectedValues = {
  nameAr: string | null;
  nameEn: string | null;
  phone: string | null;
  nationality: string | null;
};

type Props = {
  requestId: number | string;
  language: "ar" | "en";
  createdAt?: string | null;
  current: ProtectedValues;
  requested: ProtectedValues;
};

type Decision = "approve" | "reject";

function normalize(
  value: string | null | undefined,
) {
  return (value ?? "").trim();
}

function displayValue(
  value: string | null | undefined,
) {
  return normalize(value) || "—";
}

export function AdminTalentProfileChangeReview({
  requestId,
  language,
  createdAt,
  current,
  requested,
}: Props) {
  const router = useRouter();
  const isArabic = language === "ar";

  const [isPending, startTransition] =
    useTransition();

  const [decision, setDecision] =
    useState<Decision | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [isError, setIsError] =
    useState(false);

  const changedRows = useMemo(
    () =>
      [
        {
          key: "nameAr",
          label: isArabic
            ? "الاسم بالعربية"
            : "Arabic name",
          current: current.nameAr,
          requested: requested.nameAr,
          forceLtr: false,
        },
        {
          key: "nameEn",
          label: isArabic
            ? "الاسم بالإنجليزية"
            : "English name",
          current: current.nameEn,
          requested: requested.nameEn,
          forceLtr: true,
        },
        {
          key: "phone",
          label: isArabic
            ? "رقم الجوال"
            : "Phone number",
          current: current.phone,
          requested: requested.phone,
          forceLtr: true,
        },
        {
          key: "nationality",
          label: isArabic
            ? "الجنسية"
            : "Nationality",
          current: current.nationality,
          requested: requested.nationality,
          forceLtr: true,
        },
      ].filter(
        (row) =>
          normalize(row.current) !==
          normalize(row.requested),
      ),
    [current, requested, isArabic],
  );

  function closeConfirmation() {
    if (!isPending) {
      setDecision(null);
    }
  }

  function executeDecision() {
    if (!decision) return;

    setMessage(null);
    setIsError(false);

    startTransition(async () => {
      try {
        const result =
          decision === "approve"
            ? await approveTalentProfileChangeAction(
                requestId,
              )
            : await rejectTalentProfileChangeAction(
                requestId,
              );

        setMessage(result.message);
        setIsError(!result.success);

        if (result.success) {
          setDecision(null);
          router.refresh();
        }
      } catch (error) {
        console.error(
          "[AdminTalentProfileChangeReview]",
          error,
        );

        setIsError(true);

        setMessage(
          isArabic
            ? "حدث خطأ غير متوقع أثناء معالجة طلب التعديل."
            : "An unexpected error occurred while reviewing the change request.",
        );
      }
    });
  }

  const createdLabel = createdAt
    ? new Intl.DateTimeFormat(
        language === "ar"
          ? "ar-SA-u-nu-latn"
          : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      ).format(new Date(createdAt))
    : null;

  if (changedRows.length === 0) {
    return null;
  }

  return (
    <>
      <section
        dir={isArabic ? "rtl" : "ltr"}
        className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.045] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-amber-200">
              <ShieldCheck className="h-4 w-4" />

              <p className="text-[10px] uppercase tracking-[0.25em]">
                {isArabic
                  ? "طلب تعديل بيانات محمية"
                  : "Protected data change request"}
              </p>
            </div>

            <h2 className="mt-3 text-xl font-light text-white sm:text-2xl">
              {isArabic
                ? "راجع التغييرات المطلوبة"
                : "Review requested changes"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/45">
  {isArabic
    ? "الموهبة طلبت تعديل بيانات محمية. ستبقى البيانات الحالية معتمدة حتى اتخاذ القرار."
    : "The talent requested changes to protected data. The current values will remain active until a decision is made."}
</p>

            {createdLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/35">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{createdLabel}</span>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                setDecision("approve")
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-5 text-sm text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-wait disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />

              {isArabic
                ? "اعتماد التغيير"
                : "Approve change"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                setDecision("reject")
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-400/[0.08] px-5 text-sm text-red-300 transition hover:bg-red-400 hover:text-black disabled:cursor-wait disabled:opacity-40"
            >
              <XCircle className="h-4 w-4" />

              {isArabic
                ? "رفض التغيير"
                : "Reject change"}
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08]">
          <div className="hidden grid-cols-[180px_1fr_1fr] gap-4 border-b border-white/[0.08] bg-black/25 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/30 sm:grid">
            <span>
              {isArabic ? "الحقل" : "Field"}
            </span>

            <span>
              {isArabic
                ? "القيمة الحالية"
                : "Current value"}
            </span>

            <span>
              {isArabic
                ? "القيمة المطلوبة"
                : "Requested value"}
            </span>
          </div>

          <div className="divide-y divide-white/[0.08]">
            {changedRows.map((row) => (
              <div
                key={row.key}
                className="grid gap-3 bg-black/10 px-4 py-4 sm:grid-cols-[180px_1fr_1fr] sm:gap-4"
              >
                <div className="text-xs font-medium text-white/45">
                  {row.label}
                </div>

                <div>
                  <p className="text-[10px] text-white/25 sm:hidden">
                    {isArabic
                      ? "الحالي"
                      : "Current"}
                  </p>

                  <p
                    dir={
                      row.forceLtr
                        ? "ltr"
                        : "auto"
                    }
                    className="mt-1 break-words text-sm text-white/55"
                  >
                    {displayValue(
                      row.current,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gold/70 sm:hidden">
                    {isArabic
                      ? "المطلوب"
                      : "Requested"}
                  </p>

                  <p
                    dir={
                      row.forceLtr
                        ? "ltr"
                        : "auto"
                    }
                    className="mt-1 break-words text-sm text-gold"
                  >
                    {displayValue(
                      row.requested,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {message ? (
          <div
            role="status"
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              isError
                ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
            }`}
          >
            {message}
          </div>
        ) : null}
      </section>

      {decision ? (
        <div
          role="dialog"
          aria-modal="true"
          dir={isArabic ? "rtl" : "ltr"}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label={
              isArabic ? "إغلاق" : "Close"
            }
            onClick={closeConfirmation}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/[0.1] bg-[#0b0b0b] p-6 shadow-2xl sm:p-7">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {isArabic
                ? "تأكيد القرار"
                : "Confirm decision"}
            </p>

            <h2 className="mt-3 text-2xl font-light text-white">
              {decision === "approve"
                ? isArabic
                  ? "اعتماد التغييرات؟"
                  : "Approve these changes?"
                : isArabic
                  ? "رفض التغييرات؟"
                  : "Reject these changes?"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/45">
              {decision === "approve"
                ? isArabic
                  ? "سيتم تطبيق البيانات الجديدة على ملف الموهبة. لن تتغير حالة الحساب أو حالة نشر الملف."
                  : "The new protected data will be applied to the talent profile. The account status and profile publication status will not be changed."
                : isArabic
                  ? "سيتم رفض الطلب والإبقاء على البيانات الحالية. لن تتغير حالة الحساب أو حالة نشر الملف."
                  : "The request will be rejected and the current data will remain unchanged. The account status and profile publication status will not be changed."}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isPending}
                onClick={executeDecision}
                className={`min-h-12 rounded-xl border px-5 text-sm transition disabled:cursor-wait disabled:opacity-50 ${
                  decision === "approve"
                    ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400 hover:text-black"
                    : "border-red-400/25 bg-red-400/[0.08] text-red-300 hover:bg-red-400 hover:text-black"
                }`}
              >
                {isPending
                  ? isArabic
                    ? "جارٍ التنفيذ..."
                    : "Applying..."
                  : decision === "approve"
                    ? isArabic
                      ? "تأكيد الاعتماد"
                      : "Confirm approval"
                    : isArabic
                      ? "تأكيد الرفض"
                      : "Confirm rejection"}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={closeConfirmation}
                className="min-h-12 rounded-xl border border-white/[0.08] px-5 text-sm text-white/55 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                {isArabic
                  ? "إلغاء"
                  : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}