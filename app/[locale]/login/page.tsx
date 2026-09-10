import { notFound } from "next/navigation";

import { LoginPageV2 } from "@/components/auth/LoginPageV2";
import { isValidLocale, type Locale } from "@/lib/i18n";

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
