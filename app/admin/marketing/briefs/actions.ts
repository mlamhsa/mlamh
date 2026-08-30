"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { trackMarketingEvent } from "@/lib/marketing/events/track";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingBriefAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const db = createAdminClient();
  const leadIdRaw = Number(formData.get("lead_id"));
  const leadId = Number.isInteger(leadIdRaw) && leadIdRaw > 0 ? leadIdRaw : null;
  const talentCountRaw = Number(formData.get("talent_count"));
  const budgetRaw = Number(formData.get("budget"));
  const status = String(formData.get("status") ?? "draft");
  const safeStatus = ["draft", "partial", "complete"].includes(status) ? status : "draft";
  const talentType = String(formData.get("talent_type") ?? "");

  const { data: brief, error } = await db.from("marketing_briefs").insert({
    project_type: String(formData.get("project_type") ?? "").trim() || null,
    talent_type: ["actor", "model", "mixed"].includes(talentType) ? talentType : null,
    talent_count: Number.isInteger(talentCountRaw) && talentCountRaw > 0 ? talentCountRaw : null,
    city: String(formData.get("city") ?? "").trim() || null,
    location_notes: String(formData.get("location_notes") ?? "").trim() || null,
    shoot_date: String(formData.get("shoot_date") ?? "").trim() || null,
    time_window: String(formData.get("time_window") ?? "").trim() || null,
    requirements: { text: String(formData.get("requirements") ?? "").trim() },
    compensation: String(formData.get("compensation") ?? "").trim() || null,
    budget: Number.isFinite(budgetRaw) && budgetRaw >= 0 ? budgetRaw : null,
    source: String(formData.get("source") ?? "").trim() || "admin",
    lead_id: leadId,
    status: safeStatus,
  }).select("id").single();

  if (error) throw new Error(`[create brief] ${error.message}`);

  if (leadId && safeStatus === "complete") {
    await db.from("marketing_leads").update({ brief_status: "complete", stage: "brief_received", updated_at: new Date().toISOString() }).eq("id", leadId);
  }

  if (safeStatus === "complete") {
    await trackMarketingEvent({
      eventName: "brief_received",
      entityType: "marketing_brief",
      entityId: String(brief.id),
      metadata: { lead_id: leadId, talent_type: talentType || null },
    });
  }

  revalidatePath("/admin/marketing/briefs");
  revalidatePath("/admin/marketing/leads");
  revalidatePath("/admin/marketing");
}
