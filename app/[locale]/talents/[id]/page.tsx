import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { TalentProfile } from "@/components/TalentProfile";
import { getTalentById } from "@/lib/supabase/talents";
import { toTalentProfileDisplay } from "@/lib/talents/display";
import { getDictionary, isValidLocale, type Locale } from "@/lib/i18n";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: localeParam, id } = await params;

  if (!isValidLocale(localeParam)) {
    return {};
  }

  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const talent = await getTalentById(id);

  if (!talent) {
    return { title: dict.talentProfile.metadataTitle };
  }

  const profile = toTalentProfileDisplay(talent, locale, {
    instagram: dict.talentProfile.instagram,
    tiktok: dict.talentProfile.tiktok,
    snapchat: dict.talentProfile.snapchat,
    portfolio: dict.talentProfile.portfolio,
  });

  return {
    title: `${profile.name} — ${dict.talentProfile.metadataTitle} | MLAMH`,
    description: profile.bio ?? dict.metadata.description,
  };
}

export default async function TalentProfilePage({ params }: PageProps) {
  const { locale: localeParam, id } = await params;

  if (!isValidLocale(localeParam)) {
    notFound();
  }

  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  const talent = await getTalentById(id);

  if (!talent) {
    notFound();
  }

  return (
    <main className="relative z-[2] bg-background">
      <Navbar dict={dict} locale={locale} />
      <TalentProfile talent={talent} dict={dict} locale={locale} />
      <Footer dict={dict} locale={locale} />
    </main>
  );
}
