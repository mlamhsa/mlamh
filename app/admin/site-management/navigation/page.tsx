import { redirect } from "next/navigation";

export default async function PlannedSiteManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const query = await searchParams;
  const language = query.lang === "en" ? "en" : "ar";
  redirect(`/admin/site-management?lang=${language}`);
}
