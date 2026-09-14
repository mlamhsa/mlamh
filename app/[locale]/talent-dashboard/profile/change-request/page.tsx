import { redirect } from "next/navigation";

import { isValidLocale } from "@/lib/i18n";

export default async function TalentProfileChangeRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = isValidLocale(localeParam) ? localeParam : "ar";

  // Core details are now self-service. Keep the legacy URL working for old links
  // and bookmarks, but route talents to the canonical direct editor.
  redirect(`/${locale}/talent-dashboard/profile/advanced#identity`);
}
