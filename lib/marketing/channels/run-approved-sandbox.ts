import { createAdminClient } from "@/lib/supabase/admin";

import { executeMarketingChannelJob } from "./executor";
import { executeMarketingEmailJob } from "./email-executor";

type SandboxJob = {
  id: number;
  channel: string;
  status: string;
  payload: unknown;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Executes only explicitly test-marked jobs belonging to one approved action.
 * Production jobs are deliberately ignored; this helper is for the controlled
 * launch sandbox and never broadens the global execution gate.
 */
export async function runApprovedSandboxJobsForApproval(approvalId: number) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("marketing_channel_jobs")
    .select("id,channel,status,payload")
    .eq("approval_id", approvalId)
    .eq("status", "approved")
    .contains("payload", { test_mode: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`[sandbox_run_now.read] ${error.message}`);

  const executed: number[] = [];
  for (const row of (data ?? []) as SandboxJob[]) {
    const payload = asRecord(row.payload);
    if (payload.test_mode !== true) continue;

    if (row.channel === "email") {
      if (payload.kind !== "outreach_email") continue;
      await executeMarketingEmailJob(row.id);
      executed.push(row.id);
      continue;
    }

    if (row.channel === "buffer") {
      await executeMarketingChannelJob(row.id, "publish_now");
      executed.push(row.id);
    }
  }

  return executed;
}
