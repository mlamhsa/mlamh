import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmailOtpVerification } from "@/components/auth/EmailOtpVerification";
import { isValidLocale, type Locale } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ email?: string; type?: string; intent?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "تحقق من بريدك | ملامح" : "Verify your email | MLAMH",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyEmailPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  const query = searchParams ? await searchParams : {};
  const email = typeof query.email === "string" ? query.email.trim().toLowerCase() : "";
  const accountType = query.type === "publisher" ? "publisher" : "talent";
  const intent = query.intent === "actor" || query.intent === "model" || query.intent === "publisher" ? query.intent : "";

  return <EmailOtpVerification locale={locale} email={email} accountType={accountType} intent={intent} />;
}
