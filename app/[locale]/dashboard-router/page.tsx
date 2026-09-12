import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const KNOWN_ACCOUNT_TYPES = new Set(["talent", "publisher", "admin"]);

function normalizeAccountType(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export default async function DashboardRouterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const authClient = await createServerSupabaseClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const adminClient = createAdminClient();

  const [{ data: profile }, { data: legacyTalent }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id,account_type")
      .eq("user_id", user.id)
      .maybeSingle(),
    adminClient
      .from("talents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const profileAccountType = normalizeAccountType(profile?.account_type);
  const metadataAccountType = normalizeAccountType(
    user.user_metadata?.account_type ?? user.user_metadata?.role,
  );

  // Some early accounts still carry the old generic `user` profile default while
  // their auth metadata already identifies them as talent/publisher. Do not let
  // that stale legacy value override a valid account type and bounce a signed-in
  // user back to /login.
  const accountType = KNOWN_ACCOUNT_TYPES.has(profileAccountType)
    ? profileAccountType
    : KNOWN_ACCOUNT_TYPES.has(metadataAccountType)
      ? metadataAccountType
      : profileAccountType || metadataAccountType;

  if (accountType === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  if (accountType === "publisher") {
    redirect(`/${locale}/publisher-dashboard`);
  }

  if (accountType === "admin") {
    redirect("/admin");
  }

  // Very old talent accounts can predate the current profiles lifecycle and have
  // a valid talent row while profiles.account_type still contains a legacy value.
  // The existing talent row is enough evidence to restore the user to the talent
  // dashboard without asking them to choose an account type again.
  if (legacyTalent) {
    redirect(`/${locale}/talent-dashboard`);
  }

  // Keep authenticated legacy users inside the signed-in recovery path rather
  // than sending them back to the login screen in a loop.
  redirect(`/${locale}/join/account-type`);
}
