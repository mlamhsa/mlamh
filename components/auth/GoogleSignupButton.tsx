"use client";

import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  locale: "ar" | "en";
  accountType: "talent" | "publisher";
  intent?: "actor" | "model" | "publisher";
};

type SocialProvider = "google" | "apple";

export function GoogleSignupButton({
  locale,
  accountType,
  intent,
}: Props) {
  const isRtl = locale === "ar";
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSocialSignup(provider: SocialProvider) {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    setErrorMessage("");

    try {
      const supabase = createBrowserSupabaseClient();
      const resolvedIntent = intent ?? (accountType === "publisher" ? "publisher" : "");
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("locale", locale);
      callback.searchParams.set("mode", "signup");
      callback.searchParams.set("type", accountType);
      callback.searchParams.set("provider", provider);
      if (resolvedIntent) callback.searchParams.set("intent", resolvedIntent);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callback.toString(),
        },
      });

      if (error) {
        console.error(`[SocialSignupButton:${provider}]`, error);
        setErrorMessage(
          isRtl
            ? `تعذر التسجيل باستخدام ${provider === "google" ? "Google" : "Apple"}. حاول مرة أخرى.`
            : `Unable to continue with ${provider === "google" ? "Google" : "Apple"}. Please try again.`,
        );
        setLoadingProvider(null);
      }
    } catch (error) {
      console.error("[SocialSignupButton]", error);
      setErrorMessage(
        isRtl
          ? "حدث خطأ أثناء التسجيل. حاول مرة أخرى."
          : "An error occurred while signing up. Please try again.",
      );
      setLoadingProvider(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-center text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleSocialSignup("google")}
        disabled={Boolean(loadingProvider)}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-5 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.62Z" />
          <path fill="#EA4335" d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z" />
        </svg>
        <span>
          {loadingProvider === "google"
            ? isRtl ? "جارٍ التحويل إلى Google..." : "Redirecting to Google..."
            : isRtl ? "المتابعة باستخدام Google" : "Continue with Google"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => void handleSocialSignup("apple")}
        disabled={Boolean(loadingProvider)}
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <path d="M17.05 12.54c.02-2.04 1.67-3.02 1.74-3.07-.95-1.39-2.43-1.58-2.95-1.6-1.24-.13-2.44.74-3.07.74-.65 0-1.62-.73-2.68-.71-1.36.02-2.64.81-3.34 2.03-1.43 2.48-.36 6.12 1 8.13.68.97 1.48 2.05 2.53 2.01 1.02-.04 1.4-.65 2.63-.65 1.22 0 1.58.65 2.64.62 1.1-.02 1.79-.97 2.45-1.95.79-1.12 1.1-2.23 1.11-2.29-.03-.01-2.04-.79-2.06-3.26ZM15.03 6.56c.55-.69.93-1.62.82-2.56-.8.04-1.79.56-2.36 1.23-.51.59-.97 1.56-.85 2.46.9.07 1.82-.46 2.39-1.13Z" />
        </svg>
        <span>
          {loadingProvider === "apple"
            ? isRtl ? "جارٍ التحويل إلى Apple..." : "Redirecting to Apple..."
            : isRtl ? "المتابعة باستخدام Apple" : "Continue with Apple"}
        </span>
      </button>
    </div>
  );
}
