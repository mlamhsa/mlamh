import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getMobilePublisherDashboard } from "@/lib/publishers/mobile-dashboard";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const result = await getMobilePublisherDashboard({ userId: auth.user.id, locale });

  if (!result.ok) {
    const status = result.code === "ACCOUNT_RESTRICTED"
      ? 403
      : result.code === "NOT_PUBLISHER" || result.code === "PUBLISHER_NOT_FOUND"
        ? 404
        : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
