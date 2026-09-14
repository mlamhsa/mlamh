"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { Locale } from "@/lib/i18n";
import {
  useCurrentUser,
  type CurrentUserState,
} from "@/hooks/useCurrentUser";
import { MobileAppNavigation } from "@/components/mobile/navigation/MobileAppNavigation";

type MobileAppShellProps = {
  locale: Locale;
  initialUser: CurrentUserState;
};

export function MobileAppShell({
  locale,
  initialUser,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthFlowRoute =
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/join` ||
    pathname.startsWith(`/${locale}/join/`) ||
    pathname === `/${locale}/forgot-password` ||
    pathname === `/${locale}/reset-password`;

  const {
    isLoggedIn,
    accountType,
    userName,
    avatarUrl,
    loading: authLoading,
  } = useCurrentUser(
    initialUser,
    initialUser.isLoggedIn || isAuthFlowRoute,
  );

  const targetLocale = locale === "ar" ? "en" : "ar";
  const queryString = searchParams.toString();

  const localizedPathname = /^\/(ar|en)(?=\/|$)/.test(pathname)
    ? pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${targetLocale}`)
    : `/${targetLocale}${
        pathname.startsWith("/") ? pathname : `/${pathname}`
      }`;

  const languageHref = queryString
    ? `${localizedPathname}?${queryString}`
    : localizedPathname;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleLogout() {
    const { supabase } = await import("@/lib/supabase/client");
    await supabase.auth.signOut();

    setMenuOpen(false);
    document.body.style.overflow = "";

    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <div className="lg:hidden">
      <MobileAppNavigation
        locale={locale}
        isLoggedIn={isLoggedIn}
        accountType={accountType}
        userName={userName}
        avatarUrl={avatarUrl}
        authLoading={authLoading}
        menuOpen={menuOpen}
        languageHref={languageHref}
        onMenuToggle={() => setMenuOpen((current) => !current)}
        onMenuClose={() => {
          setMenuOpen(false);
          document.body.style.overflow = "";
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
