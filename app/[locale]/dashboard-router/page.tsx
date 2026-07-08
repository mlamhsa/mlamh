import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const { data: profile } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  const accountType = profile?.account_type ?? user.user_metadata?.role;

  if (accountType === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  if (accountType === "publisher") {
    redirect(`/${locale}/publisher-dashboard`);
  }

  if (accountType === "admin") {
    redirect("/admin");
  }

  redirect(`/${locale}/login`);
}