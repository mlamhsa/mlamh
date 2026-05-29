"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signUpTalentAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const user = data.user;

  if (user) {
    const adminClient = createAdminClient();

    await adminClient.from("talent_users").upsert({
      id: user.id,
      email,
      role: "talent",
    });
  }

  redirect("/talent-dashboard");
}

export async function signInTalentAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/talent-dashboard");
}

export async function signOutTalentAction() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  redirect("/talent-login");
}