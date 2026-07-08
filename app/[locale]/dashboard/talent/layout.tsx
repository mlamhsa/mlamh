import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/getUserRole";

export default async function TalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return <>{children}</>;
}