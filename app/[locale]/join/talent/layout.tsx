import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function JoinTalentLayout({ children, params }: Props) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return children;

  const [{ data: profile }, { data: talent }] = await Promise.all([
    supabase
      .from("profiles")
      .select("account_type,onboarding_status,onboarding_step")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("talents")
      .select("id,primary_role,status,published")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profile?.account_type === "publisher") {
    redirect(`/${locale}/publisher-dashboard`);
  }

  if (talent && profile?.account_type === "talent") {
    const hasPrimaryRole = talent.primary_role === "actor" || talent.primary_role === "model";
    const isLegacyActive = talent.published === true || talent.status === "active";
    const onboardingFinished =
      profile.onboarding_status === "completed" || profile.onboarding_step === "dashboard";

    if (isLegacyActive || onboardingFinished) {
      redirect(`/${locale}/talent-dashboard`);
    }

    if (hasPrimaryRole) {
      redirect(`/${locale}/talent-dashboard/profile`);
    }
  }

  return children;
}
