"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingFollowUpAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const leadRaw = Number(formData.get("lead_id"));
  const leadId = Number.isInteger(leadRaw) && leadRaw > 0 ? leadRaw : null;
  const followUpRaw = String(formData.get("follow_up_at") ?? "").trim();
  if (!followUpRaw) throw new Error("Follow-up time is required.");

  const db = createAdminClient();
  const { error } = await db.from("marketing_followups").insert({
    lead_id: leadId,
    follow_up_at: new Date(followUpRaw).toISOString(),
    reason: String(formData.get("reason") ?? "").trim() || null,
    channel: String(formData.get("channel") ?? "").trim() || null,
    owner: String(formData.get("owner") ?? "").trim() || "layan",
    sequence_step: Math.max(1, Number(formData.get("sequence_step")) || 1),
    status: "scheduled",
    next_action: String(formData.get("next_action") ?? "").trim() || null,
  });

  if (error) throw new Error(`[create follow-up] ${error.message}`);
  revalidatePath("/admin/marketing/follow-ups");
}
