import TalentAdvancedSectionRouter from "@/components/talent/TalentAdvancedSectionRouter";
import { requireTalent } from "@/lib/auth/require-talent";

export default async function TalentAdvancedProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam === "en" ? "en" : "ar";
  await requireTalent(locale);

  return (
    <div className="talent-required-fields-shell">
      <TalentAdvancedSectionRouter locale={locale} />
      {children}
      <style>{`
        .talent-required-fields-shell > main {
          padding-top: 0 !important;
        }
        .talent-required-fields-shell > main > div {
          max-width: 72rem !important;
        }
        @media (min-width: 1024px) {
          .talent-required-fields-shell > main {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
