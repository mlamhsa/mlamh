import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getUserConversations } from "@/lib/messages/user-conversations";

export async function GET(request: Request) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  return NextResponse.json(await getUserConversations(auth.user.id));
}
