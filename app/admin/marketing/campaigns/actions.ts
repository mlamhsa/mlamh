"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingCampaignAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Campaign name is required.");
  const db = createAdminClient();
  const budgetRaw = Number(formData.get("budget"));
  const channels = String(formData.get("channels") ?? "").split(",").map((value) => value.trim()).filter(Boolean);

  const { data: campaign, error } = await db.from("marketing_campaigns").insert({
    name,
    objective: String(formData.get("objective") ?? "").trim() || null,
    status: "draft",
    start_at: String(formData.get("start_at") ?? "").trim() || null,
    end_at: String(formData.get("end_at") ?? "").trim() || null,
    budget: Number.isFinite(budgetRaw) && budgetRaw >= 0 ? budgetRaw : null,
    channels,
    owner: String(formData.get("owner") ?? "").trim() || "nora",
    goal: { text: String(formData.get("goal") ?? "").trim() },
    utm_campaign: String(formData.get("utm_campaign") ?? "").trim() || null,
    created_by: "admin",
  }).select("id").single();
  if (error) throw new Error(`[create campaign] ${error.message}`);

  await createMarketingTask({
    agentId: "nora",
    taskType: "create_campaign",
    title: `Approve campaign: ${name}`,
    objective: "Review and approve a new marketing campaign before activation.",
    priority: "normal",
    approvalLevel: "approval_required",
    campaignId: campaign.id,
    source: "admin",
    input: { campaign_id: campaign.id, campaign_name: name, channels, budget: Number.isFinite(budgetRaw) ? budgetRaw : null },
  });

  revalidatePath("/admin/marketing/campaigns");
  revalidatePath("/admin/marketing/approvals");
}
