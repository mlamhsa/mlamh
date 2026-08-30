import { createAdminClient } from "@/lib/supabase/admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";

type AutomationAction = {
  type?: string;
  agent_id?: string;
  task_type?: string;
  title?: string;
  objective?: string;
  channel?: string;
  approval_level?: "auto" | "approval_required" | "ceo_only";
};

function conditionsMatch(conditions: unknown, payload: Record<string, unknown>) {
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((condition) => {
    if (!condition || typeof condition !== "object" || Array.isArray(condition)) return false;
    const item = condition as { field?: string; equals?: unknown };
    return typeof item.field === "string" && payload[item.field] === item.equals;
  });
}

export async function dispatchMarketingAutomationEvent(
  eventName: string,
  payload: Record<string, unknown>,
) {
  const db = createAdminClient();
  const { data: rules, error } = await db
    .from("marketing_automation_rules")
    .select("id,name,conditions,actions,delay_seconds")
    .eq("event_name", eventName)
    .eq("status", "active");

  if (error) throw new Error(`[dispatchMarketingAutomationEvent] ${error.message}`);

  const createdTaskIds: number[] = [];
  for (const rule of rules ?? []) {
    if (!conditionsMatch(rule.conditions, payload)) continue;
    const actions = Array.isArray(rule.actions) ? rule.actions as AutomationAction[] : [];
    for (const action of actions) {
      if (action.type !== "create_task" || !action.task_type || !action.title) continue;
      const scheduledAt = rule.delay_seconds > 0
        ? new Date(Date.now() + rule.delay_seconds * 1000).toISOString()
        : null;
      const task = await createMarketingTask({
        agentId: action.agent_id ?? null,
        taskType: action.task_type,
        title: action.title,
        objective: action.objective ?? `Automation rule: ${rule.name}`,
        channel: action.channel ?? null,
        approvalLevel: action.approval_level,
        scheduledAt,
        source: "automation",
        input: payload,
        metadata: { automation_rule_id: rule.id, event_name: eventName },
      });
      createdTaskIds.push(task.id);
    }
  }

  return createdTaskIds;
}
