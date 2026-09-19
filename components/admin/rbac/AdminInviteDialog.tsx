"use client";

import {
  MailPlus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  inviteAdminAction,
} from "@/lib/actions/admin-access-actions";

function InviteSubmitButton({
  isArabic,
}: {
  isArabic: boolean;
}) {
  const { pending } =
    useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-semibold text-black transition hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-55"
    >
      <MailPlus className="h-4 w-4" />
      {pending
        ? isArabic
          ? "جارٍ الإرسال..."
          : "Sending..."
        : isArabic
          ? "إرسال الدعوة"
          : "Send invite"}
    </button>
  );
}

export function AdminInviteDialog({
  locale,
  canManage,
}: {
  locale: "ar" | "en";
  canManage: boolean;
}) {
  const [open, setOpen] =
    useState(false);

  const isArabic =
    locale === "ar";

  if (!canManage) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.08] px-3.5 py-2 text-[11px] font-medium text-gold transition hover:bg-gold hover:text-black"
      >
        <MailPlus className="h-3.5 w-3.5" />
        {isArabic
          ? "دعوة مشرف"
          : "Invite admin"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-invite-title"
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/[0.10] bg-[#0b0b0b] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-6"
          >
            <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

            <button
              type="button"
              aria-label={
                isArabic
                  ? "إغلاق"
                  : "Close"
              }
              onClick={() =>
                setOpen(false)
              }
              className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-white/45 transition hover:border-white/[0.15] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pe-12">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.08] text-gold">
                <MailPlus className="h-5 w-5" />
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-gold">
                MLAMH ACCESS
              </p>

              <h2
                id="admin-invite-title"
                className="mt-2 text-xl font-light sm:text-2xl"
              >
                {isArabic
                  ? "دعوة مشرف جديد"
                  : "Invite a new admin"}
              </h2>

              <p className="mt-2 text-xs leading-6 text-white/40">
                {isArabic
                  ? "سيُنشأ حساب إدارة بدور «مدير» ويرسل إلى البريد رابط آمن لتعيين كلمة المرور. بعد ذلك سيُطلب تفعيل المصادقة الثنائية قبل دخول لوحة الإدارة."
                  : "A new Admin account will be created and a secure password-setup link will be sent by email. MFA enrollment is required before dashboard access."}
              </p>
            </div>

            <form
              action={
                inviteAdminAction
              }
              className="mt-6 space-y-4"
            >
              <input
                type="hidden"
                name="locale"
                value={locale}
              />

              <label className="block">
                <span className="mb-2 block text-[11px] font-medium text-white/55">
                  {isArabic
                    ? "البريد الإلكتروني"
                    : "Email address"}
                </span>

                <input
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  dir="ltr"
                  required
                  maxLength={254}
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-xl border border-white/[0.10] bg-black/35 px-4 text-left text-sm text-white outline-none transition placeholder:text-white/20 focus:border-gold/35"
                />
              </label>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  <p className="text-xs font-medium text-white/70">
                    {isArabic
                      ? "الدور المبدئي: مدير"
                      : "Initial role: Admin"}
                  </p>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/35">
                  {isArabic
                    ? "لا تُمنح صلاحية «مدير أعلى» عبر الدعوة مباشرة. يمكن ترقيتها لاحقًا من مدير أعلى آخر بعد التحقق من الحساب."
                    : "Super Admin is never granted directly through an invitation. It can be assigned later by another verified Super Admin."}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <InviteSubmitButton
                  isArabic={
                    isArabic
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="h-11 rounded-xl border border-white/[0.09] px-4 text-xs text-white/50 transition hover:border-white/[0.16] hover:text-white"
                >
                  {isArabic
                    ? "إلغاء"
                    : "Cancel"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
