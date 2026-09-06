import { NextResponse } from "next/server";

import { recoverStaleAutonomousRunningTasks } from "@/lib/marketing/tasks/recover-stale";

export const dynamic = "force-dynamic";

function allowed() {
  return (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "fix/marketing-hub-qa-batch"
  );
}

export async function GET() {
  if (!allowed()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const result = await recoverStaleAutonomousRunningTasks();
  return NextResponse.json({ ok: true, result });
}
