import { redirect } from "next/navigation";

import { AccountPageClient } from "@/components/account/AccountPageClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";

  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const accountType = String(
    profile?.account_type ?? user.user_metadata?.account_type ?? user.user_metadata?.role ?? "",
  )
    .trim()
    .toLowerCase();

  return (
    <AccountPageClient
      locale={locale}
      email={user.email ?? ""}
      accountType={accountType}
    />
  );
}
