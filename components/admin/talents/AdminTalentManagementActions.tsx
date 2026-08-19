"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  EyeOff,
  PauseCircle,
  PlayCircle,
  Upload,
} from "lucide-react";

import {
  updateAdminTalentPublishedAction,
  updateAdminTalentStatusAction,
} from "@/lib/actions/update-admin-talent-status";

type AdminTalentManagementActionsProps = {
  talentId: number | string;
  status: string | null | undefined;
  published: boolean | null | undefined;
  language: "ar" | "en";
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

export function AdminTalentManagementActions({
  talentId,
  status,
  published,
  language,
}: AdminTalentManagementActionsProps) {
  const isArabic =
    language === "ar";

  const isSuspended =
    status === "suspended";

  const isPublished =
    published === true;

  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const [
    isStatusPending,
    startStatusTransition,
  ] = useTransition();

  const [
    isPublishPending,
    startPublishTransition,
  ] = useTransition();

  function handleStatusChange() {
    const nextStatus =
      isSuspended
        ? "active"
        : "suspended";

    if (!isSuspended) {
      const confirmed =
        window.confirm(
          isArabic
            ? "هل تريد إيقاف هذه الموهبة؟ سيبقى الملف محفوظًا، ويمكن إعادة تفعيل الحساب لاحقًا."
            : "Suspend this talent? The profile will remain saved and the account can be reactivated later.",
        );

      if (!confirmed) {
        return;
      }
    }

    setFeedback(null);

    startStatusTransition(
      async () => {
        const result =
          await updateAdminTalentStatusAction(
            talentId,
            nextStatus,
          );

        setFeedback({
          type: result.success
            ? "success"
            : "error",
          message:
            result.message,
        });
      },
    );
  }

  function handlePublishedChange() {
    const nextPublished =
      !isPublished;

    if (isPublished) {
      const confirmed =
        window.confirm(
          isArabic
            ? "هل تريد إخفاء ملف هذه الموهبة؟ لن يظهر الملف للجهات حتى تتم إعادة نشره."
            : "Hide this talent profile? It will no longer be visible until it is published again.",
        );

      if (!confirmed) {
        return;
      }
    }

    setFeedback(null);

    startPublishTransition(
      async () => {
        const result =
          await updateAdminTalentPublishedAction(
            talentId,
            nextPublished,
          );

        setFeedback({
          type: result.success
            ? "success"
            : "error",
          message:
            result.message,
        });
      },
    );
  }

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold">
            {isArabic
              ? "إدارة الحساب"
              : "Account Management"}
          </p>

          <h2 className="mt-2 text-xl font-light text-white">
            {isArabic
              ? "التحكم بحالة الموهبة وظهور الملف"
              : "Control talent status and profile visibility"}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">
            {isArabic
              ? "حالة الحساب مستقلة عن حالة النشر. يمكنك إيقاف الموهبة دون حذف الملف، أو إخفاء الملف دون إيقاف الحساب."
              : "Account status is independent from profile visibility. You can suspend the talent without deleting the profile, or hide the profile without suspending the account."}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-white/35">
                  {isArabic
                    ? "حالة الحساب"
                    : "Account status"}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {isSuspended ? (
                    <PauseCircle className="h-4 w-4 text-red-300" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  )}

                  <span
                    className={
                      isSuspended
                        ? "text-sm text-red-300"
                        : "text-sm text-emerald-300"
                    }
                  >
                    {isSuspended
                      ? isArabic
                        ? "موقوف"
                        : "Suspended"
                      : isArabic
                        ? "نشط"
                        : "Active"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleStatusChange
                }
                disabled={
                  isStatusPending
                }
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSuspended
                    ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300 hover:bg-emerald-400 hover:text-black"
                    : "border-red-400/20 bg-red-400/[0.07] text-red-300 hover:bg-red-400 hover:text-black"
                }`}
              >
                {isSuspended ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}

                {isStatusPending
                  ? isArabic
                    ? "جارٍ التحديث..."
                    : "Updating..."
                  : isSuspended
                    ? isArabic
                      ? "تفعيل الموهبة"
                      : "Activate Talent"
                    : isArabic
                      ? "إيقاف الموهبة"
                      : "Suspend Talent"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-white/35">
                  {isArabic
                    ? "ظهور الملف"
                    : "Profile visibility"}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  {isPublished ? (
                    <Upload className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-white/40" />
                  )}

                  <span
                    className={
                      isPublished
                        ? "text-sm text-emerald-300"
                        : "text-sm text-white/50"
                    }
                  >
                    {isPublished
                      ? isArabic
                        ? "منشور"
                        : "Published"
                      : isArabic
                        ? "غير منشور"
                        : "Unpublished"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handlePublishedChange
                }
                disabled={
                  isPublishPending
                }
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPublished
                    ? "border-white/10 bg-white/[0.03] text-white/60 hover:border-gold/25 hover:text-gold"
                    : "border-gold/25 bg-gold/[0.07] text-gold hover:bg-gold hover:text-black"
                }`}
              >
                {isPublished ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {isPublishPending
                  ? isArabic
                    ? "جارٍ التحديث..."
                    : "Updating..."
                  : isPublished
                    ? isArabic
                      ? "إخفاء الملف"
                      : "Hide Profile"
                    : isArabic
                      ? "نشر الملف"
                      : "Publish Profile"}
              </button>
            </div>
          </div>
        </div>

        {feedback ? (
          <div
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type ===
              "success"
                ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                : "border-red-400/20 bg-red-400/[0.07] text-red-300"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}