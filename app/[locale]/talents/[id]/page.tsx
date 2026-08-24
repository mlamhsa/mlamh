import { getTalentById } from "@/lib/supabase/talents";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { permanentRedirect, notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function LegacyTalentRedirectPage({
  params,
}: PageProps) {
  const { locale: localeParam, id } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const talent = await getTalentById(id);

  if (!talent || !talent.slug) {
    notFound();
  }

  const locale = localeParam as Locale;

  permanentRedirect(`/${locale}/talent/${talent.slug}`);
}