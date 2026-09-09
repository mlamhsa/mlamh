"use client";

import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
};

export function AppleSignupButton({ locale, accountType }: Props) {
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAppleSignup() {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("mode", "signup");
      callback.searchParams.set("type", accountType);
      callback.searchParams.set("provider", "apple");
      if (accountType === "publisher") callback.searchParams.set("intent", "publisher");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: callback.toString() },
      });

      if (error) {
        console.error("[AppleSignupButton]", error);
        setErrorMessage(
          isRtl
            ? "تعذر التسجيل باستخدام Apple. حاول مرة أخرى."
            : "Unable to continue with Apple. Please try again.",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("[AppleSignupButton]", error);
      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء التسجيل باستخدام Apple."
          : "An error occurred while signing up with Apple.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      {errorMessage ? (
        <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleAppleSignup()}
        disabled={loading}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.22.07 2.07.67 2.78.72 1.06-.21 2.08-.82 3.21-.74 1.35.11 2.36.64 3.03 1.6-2.78 1.67-2.12 5.33.43 6.36-.51 1.35-1.17 2.7-2.45 4.04zM12.03 7.25C11.88 5.25 13.52 3.6 15.38 3.5c.26 2.31-2.09 4.03-3.35 3.75z" />
        </svg>
        <span>
          {loading
            ? isRtl
              ? "جارٍ التحويل إلى Apple..."
              : "Redirecting to Apple..."
            : isRtl
              ? "المتابعة باستخدام Apple"
              : "Continue with Apple"}
        </span>
      </button>
    </div>
  );
}
