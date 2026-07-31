"use server";

import { redirect } from "next/navigation";

import { isValidLocale, type Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AccountType = "admin" | "publisher" | "talent";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function safeLocale(locale?: string): Locale {
  return locale && isValidLocale(locale) ? locale : "ar";
}

function loginPath(locale: Locale, error?: string) {
  return error
    ? `/${locale}/login?error=${encodeURIComponent(error)}`
    : `/${locale}/login`;
}

function dashboardPath(locale: Locale, accountType: AccountType) {
  if (accountType === "admin") {
    return "/admin";
  }

  if (accountType === "publisher") {
    return `/${locale}/publisher-dashboard`;
  }

  return `/${locale}/talent-dashboard`;
}

function normalizeAccountType(
  value: string | null | undefined,
): AccountType | null {
  if (
    value === "admin" ||
    value === "publisher" ||
    value === "talent"
  ) {
    return value;
  }

  return null;
}

async function getAccountType(
  userId: string,
): Promise<AccountType | null> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("profiles")
    .select("account_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `[getAccountType:profiles] ${error.message}`,
    );
  }

  return normalizeAccountType(data?.account_type);
}

async function createTalentAccount(
  userId: string,
  email?: string | null,
) {
  const adminClient = createAdminClient();

  const { data: existingProfile, error: profileLookupError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", userId)
      .maybeSingle();

  if (profileLookupError) {
    throw new Error(
      `[createTalentAccount:profile_lookup] ${profileLookupError.message}`,
    );
  }

  /*
   * لا نسمح بتحويل حساب موجود من admin أو publisher إلى talent.
   */
  if (
    existingProfile &&
    existingProfile.account_type !== "talent"
  ) {
    throw new Error("ACCOUNT_TYPE_CONFLICT");
  }

  if (!existingProfile) {
    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .insert({
        user_id: userId,
        account_type: "talent",
        display_name: email ?? "Talent",
        status: "active",
      });

    if (profileInsertError) {
      throw new Error(
        `[createTalentAccount:profiles] ${profileInsertError.message}`,
      );
    }
  }

  const { error: talentUserError } = await adminClient
    .from("talent_users")
    .upsert(
      {
        id: userId,
        email: email ?? null,
        role: "talent",
      },
      {
        onConflict: "id",
      },
    );

  if (talentUserError) {
    throw new Error(
      `[createTalentAccount:talent_users] ${talentUserError.message}`,
    );
  }
}

/*
 * تستخدم فقط عند اختيار المستخدم إنشاء حساب موهبة جديد.
 */
export async function signUpTalentAction(
  formData: FormData,
  locale = "ar",
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

  try {
    await createTalentAccount(
      data.user.id,
      data.user.email ?? email,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ACCOUNT_TYPE_CONFLICT"
    ) {
      await supabase.auth.signOut();
      redirect(loginPath(safe, "account_type_conflict"));
    }

    throw error;
  }

  redirect(`/${safe}/talent-dashboard/profile`);
}

/*
 * صفحة الدخول موحدة لكل أنواع الحسابات.
 * لا تنشئ سجلات ولا تغير account_type أثناء تسجيل الدخول.
 */
export async function signInTalentAction(
  formData: FormData,
  locale = "ar",
): Promise<void> {
  const safe = safeLocale(locale);

  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect(loginPath(safe, "missing_credentials"));
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.user) {
    redirect(
      loginPath(
        safe,
        error?.message || "invalid_login",
      ),
    );
  }

  let accountType: AccountType | null = null;

  try {
    accountType = await getAccountType(data.user.id);
  } catch {
    await supabase.auth.signOut();
    redirect(loginPath(safe, "profile_lookup_failed"));
  }

  if (!accountType) {
    await supabase.auth.signOut();
    redirect(loginPath(safe, "account_type_not_found"));
  }

  redirect(dashboardPath(safe, accountType));
}

export async function signOutTalentAction(
  formData: FormData,
): Promise<void> {
  const locale = safeLocale(
    getString(formData, "locale"),
  );

  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  redirect(loginPath(locale));
}