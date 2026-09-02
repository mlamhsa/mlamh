import { NextResponse } from "next/server";
import { runAutonomousMarketingCycle } from "@/lib/marketing/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const result = await runAutonomousMarketingCycle({ maxTasks: 3 });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing orchestrator failed";
    console.error("[marketing-orchestrator]", message);
    return NextResponse.json({ ok: false, error: "orchestrator_failed" }, { status: 500 });
  }
}
