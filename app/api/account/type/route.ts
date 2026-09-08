import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";

type AccountType = "talent" | "publisher";

function isAccountType(value: unknown): value is AccountType {
  return value === "talent" || value === "publisher";
}

export async function POST(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let payload: { accountType?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  if (!isAccountType(payload.accountType)) {
    return NextResponse.json({ ok: false, code: "INVALID_ACCOUNT_TYPE" }, { status: 400 });
  }

  const accountType = payload.accountType;
  const admin = createAdminClient();
  const { data: existingProfile, error: lookupError } = await admin
    .from("profiles")
    .select("id,account_type,display_name,onboarding_status,approval_status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ ok: false, code: "PROFILE_LOOKUP_FAILED" }, { status: 500 });
  }

  if (existingProfile?.account_type === "admin") {
    return NextResponse.json({ ok: false, code: "ACCOUNT_TYPE_CONFLICT" }, { status: 409 });
  }

  if (existingProfile?.account_type === "talent" || existingProfile?.account_type === "publisher") {
    if (existingProfile.account_type !== accountType) {
      return NextResponse.json({ ok: false, code: "ACCOUNT_TYPE_CONFLICT", accountType: existingProfile.account_type }, { status: 409 });
    }
    return NextResponse.json({ ok: true, accountType: existingProfile.account_type, existing: true });
  }

  const metadata = auth.user.metadata ?? {};
  const displayName = String(
    existingProfile?.display_name ??
      metadata.display_name ??
      metadata.full_name ??
      metadata.name ??
      auth.user.email ??
      "MLAMH User",
  ).trim() || "MLAMH User";

  if (existingProfile) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        account_type: accountType,
        display_name: existingProfile.display_name || displayName,
        onboarding_status: existingProfile.onboarding_status ?? "account_created",
        approval_status: existingProfile.approval_status ?? "not_submitted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .eq("user_id", auth.user.id);

    if (updateError) {
      return NextResponse.json({ ok: false, code: "PROFILE_UPDATE_FAILED" }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin.from("profiles").insert({
      user_id: auth.user.id,
      account_type: accountType,
      display_name: displayName,
      status: "active",
      onboarding_status: "account_created",
      approval_status: "not_submitted",
    });

    if (insertError) {
      return NextResponse.json({ ok: false, code: "PROFILE_CREATE_FAILED" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, accountType, existing: false });
}
