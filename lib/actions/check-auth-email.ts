"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ExistingAuthEmailResult = {
  exists: boolean;
  providers: string[];
  hasPassword: boolean;
  hasGoogle: boolean;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Server-only duplicate-account guard for signup flows.
 *
 * We intentionally check Supabase Auth (not profiles) so an account created
 * through Google and an account created through email/password are treated as
 * the same person when they use the same email address.
 *
 * This action is read-only and never mutates an existing user.
 */
export async function checkAuthEmailExistsAction(
  rawEmail: string,
): Promise<ExistingAuthEmailResult> {
  const email = normalizeEmail(rawEmail);

  if (!email || !email.includes("@")) {
    return {
      exists: false,
      providers: [],
      hasPassword: false,
      hasGoogle: false,
    };
  }

  const admin = createAdminClient();
  const perPage = 200;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("[checkAuthEmailExistsAction]", error.message);
      // Fail open here so a temporary admin lookup problem does not block all
      // registrations. Supabase Auth still remains the final duplicate guard.
      return {
        exists: false,
        providers: [],
        hasPassword: false,
        hasGoogle: false,
      };
    }

    const matched = data.users.find(
      (user) => normalizeEmail(user.email ?? "") === email,
    );

    if (matched) {
      const providers = Array.from(
        new Set(
          (matched.identities ?? [])
            .map((identity) => String(identity.provider ?? "").toLowerCase())
            .filter(Boolean),
        ),
      );

      return {
        exists: true,
        providers,
        hasPassword: providers.includes("email"),
        hasGoogle: providers.includes("google"),
      };
    }

    if (data.users.length < perPage) {
      break;
    }
  }

  return {
    exists: false,
    providers: [],
    hasPassword: false,
    hasGoogle: false,
  };
}
