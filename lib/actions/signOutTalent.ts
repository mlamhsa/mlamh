"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOutTalent(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar");

  const authClient = await createServerSupabaseClient();

  await authClient.auth.signOut();

  redirect(`/${locale}/talent-login`);
}