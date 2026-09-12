import { notFound, redirect } from "next/navigation";

import { LoginPageV2 } from "@/components/auth/LoginPageV2";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    email?: string;
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!isValidLocale(rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login screen must never become a dead-end for an already authenticated
  // user. This also covers legacy accounts where the session is established but
  // the browser remains on /login after the password exchange.
  if (user) {
    redirect(`/${locale}/dashboard-router`);
  }

  const query = searchParams ? await searchParams : {};

  return (
    <LoginPageV2
      locale={locale}
      initialEmail={query.email?.trim() ?? ""}
      errorCode={query.error}
      messageCode={query.message}
    />
  );
}
