"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AdminLogoutButtonProps = {
  isArabic?: boolean;
};

export function AdminLogoutButton({
  isArabic = true,
}: AdminLogoutButtonProps) {
  const [isSigningOut, setIsSigningOut] =
    useState(false);

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    const supabase =
      createBrowserSupabaseClient();

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Admin sign-out failed:",
        error,
      );

      setIsSigningOut(false);
      return;
    }

    window.location.replace(
      isArabic
        ? "/ar/login"
        : "/en/login",
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 px-3 py-2.5 text-xs text-red-300/80 transition hover:border-red-400/30 hover:bg-red-400/[0.06] hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
    >
      <LogOut
        aria-hidden="true"
        className="h-4 w-4"
      />

      <span>
        {isSigningOut
          ? isArabic
            ? "جارٍ تسجيل الخروج..."
            : "Signing out..."
          : isArabic
            ? "تسجيل الخروج"
            : "Sign out"}
      </span>
    </button>
  );
}