"use client";

import { useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { Locale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MobileAppNavigation } from "@/components/mobile/navigation/MobileAppNavigation";

type MobileAppShellProps = {
  locale: Locale;
};

export function MobileAppShell({ locale }: MobileAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);

  const {
    isLoggedIn,
    accountType,
    userName,
    avatarUrl,
    loading: authLoading,
  } = useCurrentUser();

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
