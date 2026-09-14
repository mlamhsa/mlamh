import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ensureTalentAccountFromSignupData,
  talentSignupDataFromMetadata,
} from "@/lib/talent/ensure-talent-account";

type AccountType = "talent" | "publisher";

type RequestUser = {
  id: string;
  email: string | null;
  metadata: Record<string, unknown>;
};

type AccountDetailsPayload = {
  displayName?: unknown;
  phone?: unknown;
  accountType?: unknown;
  accessToken?: unknown;
};

function isAccountType(value: unknown): value is AccountType {
  return value === "talent" || value === "publisher";
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return trimmed.replace(/\D/g, "");
  return `+${trimmed.replace(/\D/g, "")}`;
}

function isValidPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

function normalizeUserMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function resolveRequestUser(request: Request, fallbackAccessToken?: string): Promise<RequestUser | null> {
  const bearerAuth = await getRequestUser(request);
  if (bearerAuth.ok) return bearerAuth.user;

  // Browser sessions are normally available through Supabase SSR cookies.
  const serverSupabase = await createServerSupabaseClient();
  const {
    data: { user: cookieUser },
    error: cookieError,
  } = await serverSupabase.auth.getUser();

  if (!cookieError && cookieUser) {
    return {
      id: cookieUser.id,
      email: cookieUser.email ?? null,
      metadata: normalizeUserMetadata(cookieUser.user_metadata),
    };
  }

  // Mobile Safari can verify an OTP before its auth cookie is observable by the
  // next same-origin request. In that narrow window, verify the exact OTP-issued
  // access token directly with Supabase Admin. The token is never logged or stored.
  if (fallbackAccessToken) {
    const admin = createAdminClient();
    const {
      data: { user: tokenUser },
      error: tokenError,
    } = await admin.auth.getUser(fallbackAccessToken);

    if (!tokenError && tokenUser) {
      return {
        id: tokenUser.id,
        email: tokenUser.email ?? null,
        metadata: normalizeUserMetadata(tokenUser.user_metadata),
      };
    }
  }

  return null;
}

export async function POST(request: Request) {
  let payload: AccountDetailsPayload = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const fallbackAccessToken = typeof payload.accessToken === "string" ? payload.accessToken.trim() : "";
  const user = await resolveRequestUser(request, fallbackAccessToken || undefined);
  if (!user) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const displayName = typeof payload.displayName === "string" ? payload.displayName.trim().replace(/\s+/g, " ") : "";
  const phone = normalizePhone(payload.phone);
  if (!isAccountType(payload.accountType)) return NextResponse.json({ ok: false, code: "INVALID_ACCOUNT_TYPE" }, { status: 400 });
  if (displayName.length < 2 || displayName.length > 100) return NextResponse.json({ ok: false, code: "INVALID_DISPLAY_NAME" }, { status: 400 });
  if (!isValidPhone(phone)) return NextResponse.json({ ok: false, code: "INVALID_PHONE" }, { status: 400 });

  const accountType = payload.accountType;
  const admin = createAdminClient();

  if (accountType === "talent") {
    const signupData = talentSignupDataFromMetadata(user.metadata ?? {}, { displayName, phone });
    if (!signupData) {
      return NextResponse.json({ ok: false, code: "MISSING_TALENT_SIGNUP_DATA" }, { status: 400 });
    }

    try {
      await ensureTalentAccountFromSignupData(user.id, signupData);
    } catch (error) {
      console.error("[account/details.ensureTalentAccount]", error);
      return NextResponse.json({ ok: false, code: "TALENT_ACCOUNT_FINALIZE_FAILED" }, { status: 500 });
    }

    const currentMetadata = user.metadata ?? {};
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...currentMetadata,
        full_name: signupData.displayName,
        display_name: signupData.displayName,
        phone: signupData.phone,
        phone_verified: false,
        account_type: "talent",
        onboarding_status: "profile_in_progress",
        onboarding_step: "talent_profile",
      },
    });
    if (authUpdateError) return NextResponse.json({ ok: false, code: "AUTH_METADATA_UPDATE_FAILED" }, { status: 500 });

    return NextResponse.json({ ok: true, accountType: "talent", displayName: signupData.displayName, phone: signupData.phone, phoneVerified: false });
  }

  const { data: existingProfile, error: lookupError } = await admin
    .from("profiles")
    .select("id,account_type")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ ok: false, code: "PROFILE_LOOKUP_FAILED" }, { status: 500 });
  if (existingProfile?.account_type && existingProfile.account_type !== accountType) {
    return NextResponse.json({ ok: false, code: "ACCOUNT_TYPE_CONFLICT", accountType: existingProfile.account_type }, { status: 409 });
  }

  if (existingProfile) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        display_name: displayName,
        phone,
        account_type: accountType,
        onboarding_status: "profile_in_progress",
        onboarding_step: "account_details",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .eq("user_id", user.id);
    if (updateError) return NextResponse.json({ ok: false, code: "PROFILE_UPDATE_FAILED" }, { status: 500 });
  } else {
    const { error: insertError } = await admin.from("profiles").insert({
      user_id: user.id,
      account_type: accountType,
      display_name: displayName,
      phone,
      status: "active",
      onboarding_status: "profile_in_progress",
      onboarding_step: "account_details",
      approval_status: "not_submitted",
    });
    if (insertError) return NextResponse.json({ ok: false, code: "PROFILE_CREATE_FAILED" }, { status: 500 });
  }

  const currentMetadata = user.metadata ?? {};
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...currentMetadata,
      full_name: displayName,
      contact_name: displayName,
      phone,
      phone_verified: false,
      account_type: accountType,
    },
  });
  if (authUpdateError) return NextResponse.json({ ok: false, code: "AUTH_METADATA_UPDATE_FAILED" }, { status: 500 });

  return NextResponse.json({ ok: true, accountType, displayName, phone, phoneVerified: false });
}
