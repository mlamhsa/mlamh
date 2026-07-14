import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TalentRequestsRedirectPage({
  params,
}: PageProps) {
  const { locale } = await params;

  redirect(`/${locale}/talent-dashboard/applications`);
}