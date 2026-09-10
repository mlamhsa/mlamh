import { redirect } from "next/navigation";

export default async function TalentAdvancedProfileRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale === "en" ? "en" : "ar"}/talent-dashboard/profile/details`);
}
