"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createMarketingContentAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const db = createAdminClient();
  const contentType = String(formData.get("content_type") ?? "post").trim();
  const language = String(formData.get("language") ?? "ar");
  const campaignRaw = Number(formData.get("campaign_id"));

  const { error } = await db.from("marketing_content").insert({
    title: String(formData.get("title") ?? "").trim() || null,
    hook: String(formData.get("hook") ?? "").trim() || null,
    caption: String(formData.get("caption") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    cta: String(formData.get("cta") ?? "").trim() || null,
    content_type: contentType,
    channel: String(formData.get("channel") ?? "").trim() || null,
    objective: String(formData.get("objective") ?? "").trim() || null,
    campaign_id: Number.isInteger(campaignRaw) && campaignRaw > 0 ? campaignRaw : null,
    agent_id: String(formData.get("agent_id") ?? "").trim() || "reem",
    language: language === "en" ? "en" : "ar",
    status: "draft",
  });

  if (error) throw new Error(`[create content] ${error.message}`);
  revalidatePath("/admin/marketing/content");
}
