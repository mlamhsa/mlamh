import { notFound } from "next/navigation";

import QuickOpportunityCopyAdapter from "@/components/opportunities/QuickOpportunityCopyAdapter";
import { getPublishedOpportunityByIdentifier } from "@/lib/supabase/opportunities";

type OpportunityLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function OpportunityLayout({
  children,
  params,
}: OpportunityLayoutProps) {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const opportunity = await getPublishedOpportunityByIdentifier(slug);

  if (!opportunity) {
    notFound();
  }

  const isQuick = opportunity.posting_mode === "quick";

  return (
    <>
      <QuickOpportunityCopyAdapter enabled={isQuick} locale={locale} />
      {children}
    </>
  );
}
