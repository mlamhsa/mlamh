import { NextResponse } from "next/server";

import { deleteMlamhAccount } from "@/lib/accounts/delete-account";
import { getRequestUser } from "@/lib/auth/request-user";

export async function DELETE(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const result = await deleteMlamhAccount(auth.user.id);
  if (result.ok) return NextResponse.json(result);

  const status = result.code === "LOOKUP_FAILED" ? 500 : result.code === "AUTH_DELETE_FAILED" ? 500 : 500;
  return NextResponse.json(result, { status });
}
