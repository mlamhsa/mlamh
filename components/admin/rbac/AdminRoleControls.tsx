"use client";

import {
  Save,
  ShieldOff,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import {
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
}: {
  adminId: string;
  currentRoleKey: string;
  roles: RoleOption[];
  locale: "ar" | "en";
  isSelf: boolean;
  canManage: boolean;
}) {
  const isArabic =
    locale === "ar";

  if (!canManage) {
    return (
      <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/30">
        {isArabic
          ? "عرض فقط"
          : "Read only"}
      </span>
    );
  }

  if (isSelf) {
    return (
      <span className="inline-flex items-center rounded-full border border-gold/15 bg-gold/[0.045] px-3 py-1.5 text-[10px] text-gold/70">
        {isArabic
          ? "حسابك — محمي من التعديل الذاتي"
          : "Your account — self-change protected"}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 xl:items-end">
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
          defaultValue={
            currentRoleKey
          }
          className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-black/35 px-3 text-[11px] text-white/70 outline-none transition focus:border-gold/30"
        >
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
            isArabic
              ? "حفظ"
              : "Save"
          }
        />
      </form>

      <form
        action={
          revokeAdminAccessAction
        }
        onSubmit={(event) => {
          const confirmed =
            window.confirm(
              isArabic
                ? "سيتم سحب وصول هذا الحساب إلى لوحة الإدارة فورًا. هل تريد المتابعة؟"
                : "This account will immediately lose admin access. Continue?",
            );

          if (!confirmed) {
            event.preventDefault();
          }
        }}
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
              ? "سحب الوصول"
              : "Revoke access"
          }
        />
      </form>
    </div>
  );
}
