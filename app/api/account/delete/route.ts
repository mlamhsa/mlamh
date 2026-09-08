import { NextResponse } from "next/server";

import { deleteMlamhAccount } from "@/lib/accounts/delete-account";
import { getRequestUser } from "@/lib/auth/request-user";

export async function DELETE(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });

  const result = await deleteMlamhAccount(auth.user.id);
  if (result.ok) return NextResponse.json(result);

  return NextResponse.json(result, { status: 500 });
}
