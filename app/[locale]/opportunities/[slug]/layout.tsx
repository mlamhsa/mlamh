import { notFound } from "next/navigation";

import { getPublishedOpportunityByIdentifier } from "@/lib/supabase/opportunities";

type OpportunityLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function OpportunityLayout({
  children,
  params,
}: OpportunityLayoutProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const opportunity = await getPublishedOpportunityByIdentifier(slug);

  if (!opportunity) {
    notFound();
  }

  return children;
}
