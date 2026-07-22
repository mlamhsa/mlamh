"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";

type QuickJoinFormProps = {
  locale: "ar" | "en";
  action: (formData: FormData) => void | Promise<void>;
};

function SubmitButton({ isRtl }: { isRtl: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 text-sm font-medium text-black transition hover:bg-[#e0bd73] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black"
            aria-hidden="true"
          />

          <span>{isRtl ? "جارٍ إنشاء الحساب..." : "Creating account..."}</span>
        </>
      ) : (
        <span>{isRtl ? "ابدأ الآن" : "Get Started"}</span>
      )}
    </button>
  );
}

function PasswordVisibilityIcon({
  visible,
}: {
  visible: boolean;
}) {
  if (visible) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.6 10.6 0 0 1 12 4c5.5 0 9 5 9 5a16.4 16.4 0 0 1-2.3 2.8M6.1 6.1C4.1 7.5 3 9 3 9s3.5 5 9 5c1 0 1.9-.2 2.7-.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

export function QuickJoinForm({
  locale,
  action,
}: QuickJoinFormProps) {
  const isRtl = locale === "ar";
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label
          htmlFor="join-email"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl ? "البريد الإلكتروني" : "Email address"}
        </label>

        <input
          id="join-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={isRtl ? "name@example.com" : "name@example.com"}
          className="min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="join-password"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl ? "كلمة المرور" : "Password"}
        </label>

        <div className="relative">
          <input
            id="join-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={
              isRtl ? "٨ أحرف على الأقل" : "At least 8 characters"
            }
            className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm ${
              isRtl ? "pr-4 pl-14" : "pl-4 pr-14"
            }`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword
                ? isRtl
                  ? "إخفاء كلمة المرور"
                  : "Hide password"
                : isRtl
                  ? "إظهار كلمة المرور"
                  : "Show password"
            }
            aria-pressed={showPassword}
            className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${
              isRtl ? "left-2" : "right-2"
            }`}
          >
            <PasswordVisibilityIcon visible={showPassword} />
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="join-password-confirmation"
          className="mb-2 block text-sm text-white/65"
        >
          {isRtl ? "تأكيد كلمة المرور" : "Confirm password"}
        </label>

        <div className="relative">
          <input
            id="join-password-confirmation"
            name="passwordConfirmation"
            type={showPasswordConfirmation ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder={
              isRtl ? "أعد كتابة كلمة المرور" : "Enter your password again"
            }
            className={`min-h-14 w-full rounded-2xl border border-white/10 bg-black/30 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-gold/50 sm:text-sm ${
              isRtl ? "pr-4 pl-14" : "pl-4 pr-14"
            }`}
          />

          <button
            type="button"
            onClick={() =>
              setShowPasswordConfirmation((current) => !current)
            }
            aria-label={
              showPasswordConfirmation
                ? isRtl
                  ? "إخفاء تأكيد كلمة المرور"
                  : "Hide password confirmation"
                : isRtl
                  ? "إظهار تأكيد كلمة المرور"
                  : "Show password confirmation"
            }
            aria-pressed={showPasswordConfirmation}
            className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.05] hover:text-white ${
              isRtl ? "left-2" : "right-2"
            }`}
          >
            <PasswordVisibilityIcon visible={showPasswordConfirmation} />
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
        <input
          name="acceptTerms"
          type="checkbox"
          value="accepted"
          required
          className="mt-1 h-5 w-5 shrink-0 accent-[#c8a96a]"
        />

        <span className="text-xs leading-6 text-white/50">
          {isRtl ? "أوافق على " : "I agree to the "}

          <Link
            href={`/${locale}/terms`}
            target="_blank"
            className="text-gold transition hover:text-gold-soft"
          >
            {isRtl ? "الشروط والأحكام" : "Terms and Conditions"}
          </Link>

          {isRtl ? " و" : " and "}

          <Link
            href={`/${locale}/privacy`}
            target="_blank"
            className="text-gold transition hover:text-gold-soft"
          >
            {isRtl ? "سياسة الخصوصية" : "Privacy Policy"}
          </Link>
        </span>
      </label>

      <SubmitButton isRtl={isRtl} />
    </form>
  );
}