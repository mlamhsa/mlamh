import { NextResponse } from "next/server";

import { getMobileAccountContext } from "@/lib/accounts/mobile-account-context";
import { getRequestUser } from "@/lib/auth/request-user";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const result = await getMobileAccountContext(auth.user.id);
  if (!result.ok) {
    const status =
      result.code === "ACCOUNT_NOT_FOUND"
        ? 404
        : result.code === "ACCOUNT_TYPE_UNSUPPORTED"
          ? 409
          : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
