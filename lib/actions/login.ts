"use server";

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loginAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/${locale}/login?error=missing_credentials`);
  }

  // 🟢 CLIENT for auth ONLY (important fix)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("LOGIN USER:", data.user?.id);
console.log("LOGIN SESSION:", Boolean(data.session));
console.log("LOGIN ERROR:", error?.message);

  if (error || !data.user) {
    redirect(`/${locale}/login?error=invalid_login`);
  }

  // admin check (server safe)
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", data.user.id)
    .maybeSingle();
    console.log("LOGIN PROFILE:", profile);
    
  if (profile?.account_type === "talent") {
    redirect(`/${locale}/talent-dashboard`);
  }

  if (profile?.account_type === "publisher") {
    redirect(`/${locale}/publisher-dashboard`);
  }

  if (profile?.account_type === "admin") {
    redirect(`/admin`);
  }

  await supabase.auth.signOut();
  redirect(`/${locale}/login?error=no_profile`);
}