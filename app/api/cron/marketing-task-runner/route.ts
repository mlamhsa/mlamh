import { NextRequest, NextResponse } from "next/server";

import { getMarketingAIConfigurationState } from "@/lib/marketing/ai/provider";
import { runNextMarketingTask } from "@/lib/marketing/tasks/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TASKS_PER_RUN = 10;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[MarketingTaskRunnerCron] CRON_SECRET is not configured");
    return NextResponse.json(
      { success: false, error: "Cron configuration is incomplete." },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const aiState = getMarketingAIConfigurationState();
  if (!aiState.configured) {
    console.error("[MarketingTaskRunnerCron] Marketing AI is not configured", {
      provider: aiState.provider,
      reason: aiState.reason,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Marketing AI is not configured.",
        provider: aiState.provider,
        reason: aiState.reason,
      },
      { status: 503 },
    );
  }

  const workerId = `vercel-cron:${Date.now()}`;
  const results: Array<{
    taskId: number;
    status: "completed" | "failed" | "retry_queued";
    error?: string;
  }> = [];

  for (let index = 0; index < MAX_TASKS_PER_RUN; index += 1) {
    const result = await runNextMarketingTask(workerId);
    if (!result) break;

    results.push(result);

    // A retryable provider/runtime failure would otherwise reclaim the same
    // task immediately and burn all retries in one cron invocation.
    if (result.status === "retry_queued") break;
  }

  return NextResponse.json({
    success: true,
    provider: aiState.provider,
    model: aiState.model,
    processed: results.length,
    completed: results.filter((result) => result.status === "completed").length,
    failed: results.filter((result) => result.status === "failed").length,
    retryQueued: results.filter((result) => result.status === "retry_queued").length,
    results,
  });
}
