"use client";

import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
};

export function GoogleSignupButton({
  locale,
  accountType,
}: Props) {
  const isRtl = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleSignup() {
    setLoading(true);
    setErrorMessage("");

    try {
      const supabase =
        createBrowserSupabaseClient();

      const redirectTo =
        `${window.location.origin}/auth/callback?locale=${locale}&mode=signup&type=${accountType}`;

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });

      if (error) {
        console.error(
          "[GoogleSignupButton]",
          error,
        );

        setErrorMessage(
          isRtl
            ? "تعذر التسجيل باستخدام Google. حاول مرة أخرى."
            : "Unable to continue with Google. Please try again.",
        );

        setLoading(false);
      }
    } catch (error) {
      console.error(
        "[GoogleSignupButton]",
        error,
      );

      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء التسجيل باستخدام Google."
          : "An error occurred while signing up with Google.",
      );

      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {errorMessage ? (
        <div className="mb-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={loading}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z"
          />
          <path
            fill="#EA4335"
            d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
          />
        </svg>

        <span>
          {loading
            ? isRtl
              ? "جارٍ التحويل إلى Google..."
              : "Redirecting to Google..."
            : isRtl
              ? "المتابعة باستخدام Google"
              : "Continue with Google"}
        </span>
      </button>
    </div>
  );
}