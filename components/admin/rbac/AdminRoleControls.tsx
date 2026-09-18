"use client";

import {
  AlertTriangle,
  Save,
  ShieldOff,
  X,
} from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import {
  cancelPendingAdminInviteAction,
  resendAdminInviteAction,
  revokeAdminAccessAction,
  updateAdminRoleAction,
} from "@/lib/actions/admin-access-actions";

type RoleOption = {
  key: string;
  label: string;
};

function SubmitButton({
  label,
}: {
  label: string;
}) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.08] px-3 text-[11px] font-medium text-gold transition hover:bg-gold hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Save className="h-3.5 w-3.5" />
      {pending ? "…" : label}
    </button>
  );
}

function ResendInviteButton({
  label,
}: {
  label: string;
}) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 text-[11px] font-medium text-amber-100/80 transition hover:border-amber-400/35 hover:bg-amber-400/[0.11] hover:text-amber-50 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Save className="h-3.5 w-3.5" />
      {pending ? "…" : label}
    </button>
  );
}

function RevokeButton({
  label,
}: {
  label: string;
}) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.055] px-3 text-[11px] font-medium text-red-200/80 transition hover:border-red-400/35 hover:bg-red-400/[0.10] hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <ShieldOff className="h-3.5 w-3.5" />
      {pending ? "…" : label}
    </button>
  );
}

export function AdminRoleControls({
  adminId,
  currentRoleKey,
  roles,
  locale,
  isSelf,
  canManage,
  canManageRoles,
  pendingInvite,
  roleMismatch,
}: {
  adminId: string;
  currentRoleKey: string;
  roles: RoleOption[];
  locale: "ar" | "en";
  isSelf: boolean;
  canManage: boolean;
  canManageRoles: boolean;
  pendingInvite: boolean;
  roleMismatch: boolean;
}) {
  const isArabic =
    locale === "ar";
  const [
    revokeOpen,
    setRevokeOpen,
  ] = useState(false);
  const [
    cancelInviteOpen,
    setCancelInviteOpen,
  ] = useState(false);
  const hasActiveRole =
    roles.some(
      (role) =>
        role.key ===
        currentRoleKey,
    );

  if (!canManage) {
    return (
      <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/30">
        {isArabic
          ? "عرض فقط"
          : "Read only"}
      </span>
    );
  }

  if (
    isSelf &&
    !roleMismatch
  ) {
    return (
      <span className="inline-flex items-center rounded-full border border-gold/15 bg-gold/[0.045] px-3 py-1.5 text-[10px] text-gold/70">
        {isArabic
          ? "حسابك — محمي من التعديل الذاتي"
          : "Your account — self-change protected"}
      </span>
    );
  }

  if (
    isSelf &&
    roleMismatch
  ) {
    if (!canManageRoles) {
      return (
        <span className="inline-flex max-w-[360px] items-center rounded-xl border border-orange-400/15 bg-orange-400/[0.04] px-3 py-2 text-[10px] leading-5 text-orange-100/70">
          {isArabic
            ? "يوجد عدم تطابق في سجل دور حسابك. يلزم مدير أعلى آخر يملك صلاحية إدارة الأدوار لإصلاحه."
            : "Your role registry is inconsistent. Another Super Admin with roles.manage must repair it."}
        </span>
      );
    }

    return (
      <form
        action={
          updateAdminRoleAction
        }
        className="flex w-full max-w-[360px] flex-col items-end gap-2"
      >
        <input
          type="hidden"
          name="admin_id"
          value={adminId}
        />
        <input
          type="hidden"
          name="locale"
          value={locale}
        />
        <input
          type="hidden"
          name="role_key"
          value={currentRoleKey}
        />

        <p className="w-full text-[10px] leading-5 text-orange-100/65">
          {isArabic
            ? "سيتم مزامنة سجل الإدارة مع دور RBAC الفعلي دون تغيير صلاحياتك الحالية."
            : "This synchronizes the admin registry with your effective RBAC role without changing current permissions."}
        </p>

        <SubmitButton
          label={
            isArabic
              ? "مزامنة سجل الدور"
              : "Sync role registry"
          }
        />
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 xl:items-end">
      {pendingInvite ? (
        <div className="flex w-full max-w-[360px] flex-wrap items-center justify-end gap-2">
          <form
            action={
              resendAdminInviteAction
            }
          >
            <input
              type="hidden"
              name="admin_id"
              value={adminId}
            />
            <input
              type="hidden"
              name="locale"
              value={locale}
            />

            <ResendInviteButton
              label={
                isArabic
                  ? "إعادة إرسال التفعيل"
                  : "Resend activation"
              }
            />
          </form>

          <button
            type="button"
            onClick={() =>
              setCancelInviteOpen(true)
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.035] px-3 text-[11px] font-medium text-red-200/65 transition hover:border-red-400/30 hover:bg-red-400/[0.075] hover:text-red-100"
          >
            <X className="h-3.5 w-3.5" />
            {isArabic
              ? "إلغاء الدعوة"
              : "Cancel invite"}
          </button>
        </div>
      ) : canManageRoles ? (
        <form
          action={
            updateAdminRoleAction
          }
          className="flex w-full max-w-[360px] items-center gap-2"
        >
          <input
            type="hidden"
            name="admin_id"
            value={adminId}
          />
          <input
            type="hidden"
            name="locale"
            value={locale}
          />

          <select
            name="role_key"
            required
            defaultValue={
              hasActiveRole
                ? currentRoleKey
                : ""
            }
            className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-black/35 px-3 text-[11px] text-white/70 outline-none transition focus:border-gold/30"
          >
            {!hasActiveRole ? (
              <option
                value=""
                disabled
              >
                {isArabic
                  ? "اختر دورًا لإعادة منح الوصول"
                  : "Choose a role to restore access"}
              </option>
            ) : null}

            {roles.map(
              (role) => (
                <option
                  key={role.key}
                  value={role.key}
                >
                  {role.label}
                </option>
              ),
            )}
          </select>

          <SubmitButton
            label={
              hasActiveRole
                ? isArabic
                  ? "حفظ"
                  : "Save"
                : isArabic
                  ? "إعادة الوصول"
                  : "Restore"
            }
          />
        </form>
      ) : (
        <span className="inline-flex max-w-[360px] items-center rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] leading-5 text-white/35">
          {isArabic
            ? "تغيير الأدوار يتطلب صلاحية إدارة الأدوار."
            : "Role changes require the roles.manage permission."}
        </span>
      )}

      {pendingInvite ? null : hasActiveRole ? (
        <button
          type="button"
          onClick={() =>
            setRevokeOpen(true)
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.035] px-3 text-[11px] font-medium text-red-200/65 transition hover:border-red-400/30 hover:bg-red-400/[0.075] hover:text-red-100"
        >
          <ShieldOff className="h-3.5 w-3.5" />
          {isArabic
            ? "سحب الوصول"
            : "Revoke access"}
        </button>
      ) : (
        <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/35">
          {isArabic
            ? "الوصول مسحوب"
            : "Access revoked"}
        </span>
      )}

      {cancelInviteOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setCancelInviteOpen(
                false,
              );
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`cancel-invite-${adminId}`}
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-red-400/15 bg-[#0b0b0b] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6"
          >
            <button
              type="button"
              aria-label={
                isArabic
                  ? "إغلاق"
                  : "Close"
              }
              onClick={() =>
                setCancelInviteOpen(
                  false,
                )
              }
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.07] text-red-200">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h3
              id={`cancel-invite-${adminId}`}
              className="mt-4 pe-10 text-xl font-light"
            >
              {isArabic
                ? "إلغاء دعوة المشرف؟"
                : "Cancel admin invitation?"}
            </h3>

            <p className="mt-2 text-xs leading-6 text-white/42">
              {isArabic
                ? "سيتم حذف حساب الدعوة غير المفعّل ولن يتمكن صاحب البريد من استخدام رابط التفعيل السابق. يمكن إرسال دعوة جديدة لاحقًا."
                : "The unactivated invited account will be removed and its previous activation link will no longer be usable. A new invitation can be sent later."}
            </p>

            <form
              action={
                cancelPendingAdminInviteAction
              }
              className="mt-6 flex gap-2"
            >
              <input
                type="hidden"
                name="admin_id"
                value={adminId}
              />
              <input
                type="hidden"
                name="locale"
                value={locale}
              />

              <RevokeButton
                label={
                  isArabic
                    ? "تأكيد إلغاء الدعوة"
                    : "Confirm cancellation"
                }
              />

              <button
                type="button"
                onClick={() =>
                  setCancelInviteOpen(
                    false,
                  )
                }
                className="h-10 rounded-xl border border-white/[0.09] px-3 text-[11px] text-white/50 transition hover:border-white/[0.16] hover:text-white"
              >
                {isArabic
                  ? "رجوع"
                  : "Back"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {revokeOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setRevokeOpen(false);
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`revoke-admin-${adminId}`}
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-red-400/15 bg-[#0b0b0b] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6"
          >
            <button
              type="button"
              aria-label={
                isArabic
                  ? "إغلاق"
                  : "Close"
              }
              onClick={() =>
                setRevokeOpen(false)
              }
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.07] text-red-200">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <h3
              id={`revoke-admin-${adminId}`}
              className="mt-4 pe-10 text-xl font-light"
            >
              {isArabic
                ? "سحب وصول المشرف؟"
                : "Revoke admin access?"}
            </h3>

            <p className="mt-2 text-xs leading-6 text-white/42">
              {isArabic
                ? "سيُمنع هذا الحساب فورًا من دخول لوحة الإدارة، وستتم إزالة تعيين دوره الإداري وتسجيل العملية في سجل النظام."
                : "This account will immediately lose admin-console access, its admin role assignment will be removed, and the action will be recorded in the audit log."}
            </p>

            <form
              action={
                revokeAdminAccessAction
              }
              className="mt-6 flex gap-2"
            >
              <input
                type="hidden"
                name="admin_id"
                value={adminId}
              />
              <input
                type="hidden"
                name="locale"
                value={locale}
              />

              <RevokeButton
                label={
                  isArabic
                    ? "تأكيد سحب الوصول"
                    : "Confirm revoke"
                }
              />

              <button
                type="button"
                onClick={() =>
                  setRevokeOpen(false)
                }
                className="h-10 rounded-xl border border-white/[0.09] px-3 text-[11px] text-white/50 transition hover:border-white/[0.16] hover:text-white"
              >
                {isArabic
                  ? "إلغاء"
                  : "Cancel"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
