import OpportunityModeNav from "@/components/opportunities/OpportunityModeNav";

export default async function OpportunitiesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "ar";

  return (
    <>
      <OpportunityModeNav locale={safeLocale} />
      {children}
    </>
  );
}
