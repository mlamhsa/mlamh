"use client";

import {
  CheckCircle2,
  FileText,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
} from "react";

import {
  approveTalentAction,
  rejectTalentAction,
  requestTalentChangesAction,
} from "@/lib/actions/review-talent";

type ReviewStatus =
  | "not_submitted"
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "suspended";

type ReviewDecision =
  | "approve"
  | "changes"
  | "reject";

type AdminTalentReviewActionsProps = {
  talentId: number;
  status: string | null | undefined;
  language: "ar" | "en";
};

export function AdminTalentReviewActions({
  talentId,
  status,
  language,
}: AdminTalentReviewActionsProps) {
  const router = useRouter();

  const isArabic =
    language === "ar";

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    selectedDecision,
    setSelectedDecision,
  ] =
    useState<ReviewDecision | null>(
      null,
    );

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isError,
    setIsError,
  ] = useState(false);

  const normalizedStatus =
    (status ??
      "not_submitted") as ReviewStatus;

  const requiresReason =
    selectedDecision === "changes" ||
    selectedDecision === "reject";

  function openConfirmation(
    decision: ReviewDecision,
  ) {
    setMessage(null);
    setIsError(false);

    setReason("");
    setAdminNote("");

    setSelectedDecision(
      decision,
    );
  }

  function closeConfirmation() {
    if (isPending) {
      return;
    }

    setSelectedDecision(null);
    setReason("");
    setAdminNote("");
  }

  function executeDecision() {
    if (!selectedDecision) {
      return;
    }

    const cleanReason =
      reason.trim();

    const cleanAdminNote =
      adminNote.trim();

    if (
      requiresReason &&
      !cleanReason
    ) {
      setIsError(true);

      setMessage(
        isArabic
          ? selectedDecision ===
            "reject"
            ? "اكتب سبب رفض الملف قبل المتابعة."
            : "اكتب سبب طلب التعديل قبل المتابعة."
          : selectedDecision ===
              "reject"
            ? "Please enter a rejection reason before continuing."
            : "Please enter a reason for the requested changes.",
      );

      return;
    }

    setMessage(null);
    setIsError(false);

    const formData =
      new FormData();

    formData.set(
      "id",
      String(talentId),
    );

    formData.set(
      "locale",
      language,
    );

    if (cleanReason) {
      formData.set(
        "reason",
        cleanReason,
      );
    }

    if (cleanAdminNote) {
      formData.set(
        "admin_note",
        cleanAdminNote,
      );
    }

    startTransition(
      async () => {
        try {
          const result =
            selectedDecision ===
            "approve"
              ? await approveTalentAction(
                  formData,
                )
              : selectedDecision ===
                  "changes"
                ? await requestTalentChangesAction(
                    formData,
                  )
                : await rejectTalentAction(
                    formData,
                  );

          setMessage(
            result.message,
          );

          setIsError(
            !result.success,
          );

          if (
            result.success
          ) {
            setSelectedDecision(
              null,
            );

            setReason("");
            setAdminNote("");

            router.refresh();
          }
        } catch (error) {
          console.error(
            "[AdminTalentReviewActions]",
            error,
          );

          setIsError(true);

          setMessage(
            isArabic
              ? "حدث خطأ غير متوقع أثناء تنفيذ القرار."
              : "An unexpected error occurred while applying the decision.",
          );
        }
      },
    );
  }

  const confirmationConfig =
    selectedDecision ===
    "approve"
      ? {
          title: isArabic
            ? "اعتماد ملف الموهبة؟"
            : "Approve talent profile?",

          description:
            isArabic
              ? "سيتم اعتماد الملف ونشره ليصبح ظاهرًا للجهات الناشرة."
              : "The profile will be approved and published for publishers.",

          button: isArabic
            ? "تأكيد الاعتماد"
            : "Confirm approval",

          reasonLabel: null,

          reasonPlaceholder:
            null,

          className:
            "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400 hover:text-black",
        }
      : selectedDecision ===
          "changes"
        ? {
            title: isArabic
              ? "إعادة الملف للتعديل؟"
              : "Request profile changes?",

            description:
              isArabic
                ? "سيعود الملف إلى الموهبة لاستكمال أو تعديل البيانات المطلوبة، ولن يكون منشورًا حتى تتم مراجعته من جديد."
                : "The profile will be returned to the talent for updates and will remain unpublished until reviewed again.",

            button: isArabic
              ? "تأكيد طلب التعديل"
              : "Confirm changes",

            reasonLabel:
              isArabic
                ? "سبب طلب التعديل"
                : "Reason for changes",

            reasonPlaceholder:
              isArabic
                ? "مثال: يرجى إضافة صور أوضح وتحديث النبذة المهنية..."
                : "Example: Please add clearer photos and update the professional bio...",

            className:
              "border-amber-400/25 bg-amber-400/[0.08] text-amber-200 hover:bg-amber-400 hover:text-black",
          }
        : selectedDecision ===
            "reject"
          ? {
              title: isArabic
                ? "رفض ملف الموهبة؟"
                : "Reject talent profile?",

              description:
                isArabic
                  ? "سيتم رفض الملف وإخفاؤه عن الجهات الناشرة. يجب تسجيل سبب واضح للقرار."
                  : "The profile will be rejected and hidden from publishers. A clear reason must be recorded.",

              button:
                isArabic
                  ? "تأكيد الرفض"
                  : "Confirm rejection",

              reasonLabel:
                isArabic
                  ? "سبب الرفض"
                  : "Rejection reason",

              reasonPlaceholder:
                isArabic
                  ? "اكتب السبب الذي أدى إلى رفض الملف..."
                  : "Enter the reason for rejecting this profile...",

              className:
                "border-red-400/25 bg-red-400/[0.08] text-red-300 hover:bg-red-400 hover:text-black",
            }
          : null;

  return (
    <>
      <section
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
        className="rounded-3xl border border-gold/15 bg-gold/[0.035] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {isArabic
                ? "قرار المراجعة"
                : "Review decision"}
            </p>

            <h2 className="mt-2 text-xl font-light text-white">
              {isArabic
                ? "إجراءات الملف"
                : "Profile actions"}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">
              {isArabic
                ? "اختر القرار المناسب بعد مراجعة بيانات الموهبة. سيتم تحديث حالة الحساب والملف وتسجيل القرار في سجل المراجعات."
                : "Choose the appropriate decision after reviewing the talent profile. The account status and review history will be updated."}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={
                isPending ||
                normalizedStatus ===
                  "approved"
              }
              onClick={() =>
                openConfirmation(
                  "approve",
                )
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 text-sm text-emerald-300 transition hover:bg-emerald-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              <CheckCircle2 className="h-4 w-4" />

              {isArabic
                ? "اعتماد"
                : "Approve"}
            </button>

            <button
              type="button"
              disabled={
                isPending ||
                normalizedStatus ===
                  "changes_requested"
              }
              onClick={() =>
                openConfirmation(
                  "changes",
                )
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-5 text-sm text-amber-200 transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              <RotateCcw className="h-4 w-4" />

              {isArabic
                ? "طلب تعديل"
                : "Request changes"}
            </button>

            <button
              type="button"
              disabled={
                isPending ||
                normalizedStatus ===
                  "rejected"
              }
              onClick={() =>
                openConfirmation(
                  "reject",
                )
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-5 text-sm text-red-300 transition hover:bg-red-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-35"
            >
              <XCircle className="h-4 w-4" />

              {isArabic
                ? "رفض"
                : "Reject"}
            </button>
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

      {selectedDecision &&
      confirmationConfig ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-confirmation-title"
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label={
              isArabic
                ? "إغلاق"
                : "Close"
            }
            onClick={
              closeConfirmation
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/[0.1] bg-[#0b0b0b] p-6 shadow-2xl sm:p-7">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {isArabic
                ? "تأكيد القرار"
                : "Confirm decision"}
            </p>

            <h2
              id="review-confirmation-title"
              className="mt-3 text-2xl font-light text-white"
            >
              {
                confirmationConfig.title
              }
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/45">
              {
                confirmationConfig.description
              }
            </p>

            {confirmationConfig.reasonLabel ? (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="review-reason"
                    className="text-xs font-medium text-white/70"
                  >
                    {
                      confirmationConfig.reasonLabel
                    }
                  </label>

                  <span className="text-[10px] text-red-300/70">
                    {isArabic
                      ? "مطلوب"
                      : "Required"}
                  </span>
                </div>

                <textarea
                  id="review-reason"
                  value={reason}
                  onChange={(
                    event,
                  ) =>
                    setReason(
                      event.target.value,
                    )
                  }
                  disabled={
                    isPending
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder={
                    confirmationConfig.reasonPlaceholder ??
                    undefined
                  }
                  className="w-full resize-none rounded-2xl border border-white/[0.1] bg-white/[0.025] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-gold/35 disabled:cursor-wait disabled:opacity-50"
                />

                <div className="mt-1 text-end text-[10px] text-white/25">
                  {reason.length}/1000
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-white/35" />

                <label
                  htmlFor="admin-note"
                  className="text-xs font-medium text-white/55"
                >
                  {isArabic
                    ? "ملاحظة داخلية للإدارة"
                    : "Internal admin note"}
                </label>
              </div>

              <textarea
                id="admin-note"
                value={adminNote}
                onChange={(
                  event,
                ) =>
                  setAdminNote(
                    event.target.value,
                  )
                }
                disabled={
                  isPending
                }
                maxLength={2000}
                rows={3}
                placeholder={
                  isArabic
                    ? "ملاحظة اختيارية لفريق الإدارة فقط..."
                    : "Optional note visible only to the admin team..."
                }
                className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-gold/30 disabled:cursor-wait disabled:opacity-50"
              />

              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-[10px] text-white/25">
                  {isArabic
                    ? "لن تظهر هذه الملاحظة للموهبة."
                    : "This note is not shown to the talent."}
                </span>

                <span className="text-[10px] text-white/25">
                  {adminNote.length}/2000
                </span>
              </div>
            </div>

            {message &&
            selectedDecision ? (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                  isError
                    ? "border-red-400/20 bg-red-400/[0.07] text-red-300"
                    : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                }`}
              >
                {message}
              </div>
            ) : null}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={
                  executeDecision
                }
                className={`min-h-12 rounded-xl border px-5 text-sm transition disabled:cursor-wait disabled:opacity-50 ${confirmationConfig.className}`}
              >
                {isPending
                  ? isArabic
                    ? "جارٍ التنفيذ..."
                    : "Applying..."
                  : confirmationConfig.button}
              </button>

              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={
                  closeConfirmation
                }
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