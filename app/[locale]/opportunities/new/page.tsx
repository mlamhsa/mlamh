import CreateOpportunityForm from "@/components/publisher/CreateOpportunityForm";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function CreateOpportunityPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  await requirePublisher(locale);

  return <CreateOpportunityForm locale={locale} isRtl={isRtl} />;
}