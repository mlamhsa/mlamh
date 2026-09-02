import { createAdminClient } from "@/lib/supabase/admin";
import { runGovernedChannelWorker } from "@/lib/marketing/channels/autonomous-executor";
import { runNextMarketingTask } from "@/lib/marketing/tasks/runner";

type DailyMission = {
  agentId: string;
  taskType: string;
  title: string;
  objective: string;
  channel: string;
  priority: "normal" | "high";
};

const DAILY_MISSIONS: DailyMission[] = [
  { agentId: "rakan", taskType: "growth_analytics", title: "Daily growth intelligence", objective: "Analyze MLAMH live marketplace metrics, identify the strongest signal, the largest bottleneck, and the three highest-impact actions for today. Use only supplied data.", channel: "internal", priority: "high" },
  { agentId: "nora", taskType: "growth_strategy", title: "Daily marketing direction", objective: "Turn current MLAMH marketplace signals into a focused daily marketing direction. Prioritize talent supply, publisher demand, opportunity liquidity and applications. Produce decisions and internal assignments only.", channel: "internal", priority: "high" },
  { agentId: "reem", taskType: "content_strategy", title: "Daily social content plan", objective: "Prepare today's MLAMH social content plan for Instagram and Facebook using current marketplace signals. Include hooks, Arabic-first copy direction, CTA, format and intended outcome. Draft only; do not publish.", channel: "instagram", priority: "high" },
  { agentId: "sarah", taskType: "creative_brief", title: "Daily creative production brief", objective: "Create production-ready creative briefs for today's approved MLAMH social content direction: visual hierarchy, story/feed format, on-creative copy, brand treatment and asset requirements. Do not publish.", channel: "instagram", priority: "normal" },
  { agentId: "salman", taskType: "opportunity_research", title: "Daily demand opportunity scan", objective: "Identify internal demand-generation opportunities and prospect segments MLAMH should pursue today. Do not invent named external leads when no verified source data is supplied and do not contact anyone.", channel: "research", priority: "high" },
  { agentId: "layan", taskType: "acquisition_plan", title: "Daily publisher acquisition plan", objective: "Build a focused publisher acquisition plan for today. Email is the currently preferred outbound channel. WhatsApp and LinkedIn are paused. Prepare targeting logic and next actions; do not send externally.", channel: "email", priority: "high" },
  { agentId: "faisal", taskType: "community_growth", title: "Daily talent community plan", objective: "Prepare today's organic talent-growth actions for MLAMH across Instagram and Facebook, focused on qualified Actor and Model supply and opportunity applications. Draft only; do not publish.", channel: "instagram", priority: "normal" },
  { agentId: "dana", taskType: "outbound_email", title: "Daily Zoho outbound pipeline", objective: "Prepare the next professional MLAMH publisher/client outreach batch for Zoho email from hello@mlamh.net. Use only qualified/verified lead data available to the system. Draft personalized outreach and follow-up actions; do not send without execution governance.", channel: "email", priority: "high" },
];

function riyadhDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function seedDailyMarketingCycle(now = new Date()) {
  const db = createAdminClient();
  const day = riyadhDayKey(now);
  const rows = DAILY_MISSIONS.map((mission) => ({
    agent_id: mission.agentId,
    task_type: mission.taskType,
    title: mission.title,
    objective: mission.objective,
    priority: mission.priority,
    status: "queued",
    channel: mission.channel,
    source: "autonomous_orchestrator",
    input: { cycle: "daily", market_timezone: "Asia/Riyadh", day },
    approval_level: "auto",
    approval_status: "not_required",
    idempotency_key: `autonomous:${day}:${mission.agentId}:${mission.taskType}`,
    metadata: { orchestrated: true, external_execution: false, day },
  }));

  const { data, error } = await db.from("marketing_tasks").upsert(rows, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("id,agent_id,status");
  if (error) throw new Error(`[marketing_orchestrator.seed] ${error.message}`);
  return { day, seeded: data?.length ?? 0 };
}

export async function runAutonomousMarketingCycle({ maxTasks = 3, maxChannelJobs = 2 }: { maxTasks?: number; maxChannelJobs?: number } = {}) {
  const seeded = await seedDailyMarketingCycle();
  const executed: Array<{ taskId: number; status: string; error?: string }> = [];
  for (let index = 0; index < maxTasks; index += 1) {
    const result = await runNextMarketingTask(`autonomous-marketing-${seeded.day}`);
    if (!result) break;
    executed.push(result);
  }

  const channels = await runGovernedChannelWorker({ maxJobs: maxChannelJobs });

  return {
    ...seeded,
    executed,
    channels,
    remainingForNextTick: executed.length === maxTasks,
  };
}
