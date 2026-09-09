"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ExistingAuthEmailResult = {
  exists: boolean;
  providers: string[];
  hasPassword: boolean;
  hasGoogle: boolean;
  hasApple: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function emptyResult(): ExistingAuthEmailResult {
  return {
    exists: false,
    providers: [],
    hasPassword: false,
    hasGoogle: false,
    hasApple: false,
  };
}

/**
 * Server-only duplicate-account guard for signup flows.
 *
 * Supabase Auth is the source of truth so Email, Google and Apple identities
 * resolve to one MLAMH account when they use the same normalized email.
 * Apple Hide My Email relay addresses remain distinct and are never auto-merged.
 *
 * The lookup RPC is service-role-only and performs a direct indexed auth.users
 * email lookup instead of paging through the complete Auth user list.
 */
export async function checkAuthEmailExistsAction(
  rawEmail: string,
): Promise<ExistingAuthEmailResult> {
  const email = normalizeEmail(rawEmail);

  if (!email || !email.includes("@")) {
    return emptyResult();
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("lookup_auth_email_provider", {
    p_email: email,
  });

  if (error) {
    console.error("[checkAuthEmailExistsAction]", error.message);
    // Fail open so a temporary lookup failure does not block registration.
    // Supabase Auth remains the final duplicate-signup guard.
    return emptyResult();
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.account_exists) {
    return emptyResult();
  }

  const providers = Array.isArray(row.providers)
    ? Array.from(
        new Set(
          row.providers
            .map((provider: unknown) => String(provider ?? "").toLowerCase())
            .filter(Boolean),
        ),
      )
    : [];

  return {
    exists: true,
    providers,
    hasPassword: providers.includes("email"),
    hasGoogle: providers.includes("google"),
    hasApple: providers.includes("apple"),
  };
}
