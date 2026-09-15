import { NextResponse } from "next/server";

import { deleteMlamhAccount } from "@/lib/accounts/delete-account";
import { getRequestUser } from "@/lib/auth/request-user";

function statusForDeleteFailure(code: string) {
  if (code === "APPLE_REAUTH_REQUIRED") return 409;
  if (code === "APPLE_REVOCATION_CONFIG_MISSING") return 503;
  if (code === "APPLE_TOKEN_EXCHANGE_FAILED" || code === "APPLE_REVOCATION_FAILED") return 502;
  return 500;
}

export async function DELETE(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  let appleAuthorizationCode: string | null = null;
  try {
    const payload = (await request.json()) as { appleAuthorizationCode?: unknown };
    if (typeof payload?.appleAuthorizationCode === "string") {
      appleAuthorizationCode = payload.appleAuthorizationCode.trim() || null;
    }
  } catch {
    // DELETE requests from non-Apple accounts may legitimately have no JSON body.
  }

  const result = await deleteMlamhAccount(auth.user.id, { appleAuthorizationCode });
  if (result.ok) return NextResponse.json(result);

  return NextResponse.json(result, { status: statusForDeleteFailure(result.code) });
}
