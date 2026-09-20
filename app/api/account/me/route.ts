import { NextResponse } from "next/server";

import { getMobileAccountContext } from "@/lib/accounts/mobile-account-context";
import { getRequestUser } from "@/lib/auth/request-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const result = await getMobileAccountContext(auth.user.id);
  if (!result.ok) {
    if (result.code === "ACCOUNT_NOT_FOUND" && auth.user.email) {
      const admin = createAdminClient();
      const { data: rows, error: lookupError } = await admin.rpc(
        "lookup_other_mlamh_account_by_email",
        { p_email: auth.user.email, p_exclude_user_id: auth.user.id },
      );
      if (lookupError) {
        console.error("[api/account/me duplicate oauth lookup]", lookupError.message);
      } else {
        const otherAccount = Array.isArray(rows) ? rows[0] : null;
        if (otherAccount?.account_exists) {
          const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);
          if (deleteError) {
            console.error("[api/account/me duplicate oauth cleanup]", deleteError.message);
          }
          return NextResponse.json(
            { ok: false, code: "ACCOUNT_EXISTS_DIFFERENT_IDENTITY" },
            { status: 409 },
          );
        }
      }
    }

    const status =
      result.code === "ACCOUNT_NOT_FOUND"
        ? 404
        : result.code === "ACCOUNT_TYPE_UNSUPPORTED" ||
            result.code === "PUBLISHER_ONBOARDING_INCOMPLETE" ||
            result.code === "TALENT_ONBOARDING_INCOMPLETE"
          ? 409
          : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
