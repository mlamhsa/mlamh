"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isValidLocale } from "@/lib/i18n";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeLocale(locale?: string) {
  return locale && isValidLocale(locale) ? locale : "ar";
}

function loginPath(locale?: string, error?: string) {
  const safe = safeLocale(locale);

  return error
    ? `/${safe}/talent-login?error=${encodeURIComponent(error)}`
    : `/${safe}/talent-login`;
}

async function ensureTalentUser(userId: string, email?: string | null) {
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("talent_users").upsert({
    id: userId,
    email: email ?? null,
    role: "talent",
  });

  if (error) {
    throw new Error(`[ensureTalentUser] ${error.message}`);
  }
}

export async function signUpTalentAction(
  formData: FormData,
  locale = "ar"
): Promise<void> {
  const safe = safeLocale(locale);

  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect(loginPath(safe, "missing_credentials"));
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(loginPath(safe, error.message));
  }

  if (!data.user) {
    redirect(loginPath(safe, "signup_failed"));
  }

  await ensureTalentUser(data.user.id, data.user.email ?? email);

  redirect("/ar/talent-dashboard/profile");
}

export async function signInTalentAction(
  formData: FormData,
  locale = "ar"
): Promise<void> {
  const safe = safeLocale(locale);

  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect(loginPath(safe, "missing_credentials"));
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect(loginPath(safe, error?.message || "invalid_login"));
  }

  await ensureTalentUser(data.user.id, data.user.email ?? email);

  redirect("/ar/talent-dashboard/profile");
}

export async function signOutTalentAction(
  _formData: FormData
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  redirect("/ar/talent-login");
}