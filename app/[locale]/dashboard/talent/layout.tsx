import { redirect } from "next/navigation";

import { TalentFeaturedEntryPoint } from "@/components/payments/TalentFeaturedEntryPoint";
import { getUserRole } from "@/lib/auth/getUserRole";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TalentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole(user.id);

  // حماية فقط للـ talent
  if (role !== "talent") {
    redirect("/dashboard");
  }

  return (
    <>
      {children}
      <TalentFeaturedEntryPoint locale={locale} userId={user.id} />
    </>
  );
}
