"use server";

import { revalidatePath } from "next/cache";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

type BufferTarget = "instagram" | "facebook";

function parseBufferTargets(formData: FormData, fallbackChannel: string | null): BufferTarget[] {
  const explicit = formData.getAll("targets").map(String).filter((value): value is BufferTarget => value === "instagram" || value === "facebook");
  if (explicit.length) return [...new Set(explicit)];
  const normalized = (fallbackChannel ?? "").toLowerCase();
  if (normalized === "instagram") return ["instagram"];
  if (normalized === "facebook") return ["facebook"];
  if (["buffer", "social", "instagram+facebook", "facebook+instagram"].includes(normalized)) return ["instagram", "facebook"];
  return [];
}

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

export async function requestContentPublishingApprovalAction(formData: FormData) {
  await requireMarketingAdminAccess("marketing.manage");
  const contentId = Number(formData.get("content_id"));
  if (!Number.isInteger(contentId) || contentId <= 0) throw new Error("Invalid content id.");
  const db = createAdminClient();
  const { data: content, error } = await db.from("marketing_content").select("id,title,caption,body,cta,channel,agent_id,status,campaign_id,asset_references").eq("id", contentId).single();
  if (error || !content) throw new Error("Content not found.");
  if (!["draft", "review", "ready"].includes(content.status)) throw new Error("Content is not ready to request publishing approval.");

  const targets = parseBufferTargets(formData, content.channel);
  if (targets.length === 0) throw new Error("Select Instagram, Facebook, or both as Buffer targets.");
  const assetUrls = Array.isArray(content.asset_references) ? content.asset_references.filter((value): value is string => typeof value === "string") : [];

  for (const target of targets) {
    await createMarketingTask({
      agentId: content.agent_id ?? "reem",
      taskType: "social_publish",
      title: `Approve ${target} publishing: ${content.title ?? `content #${content.id}`}`,
      objective: `Review the proposed ${target} content. Approval creates a ready job only; it does not publish automatically.`,
      channel: "buffer",
      approvalLevel: "approval_required",
      contentId: content.id,
      campaignId: content.campaign_id,
      source: "content_studio",
      input: { content_id: content.id, provider: "buffer", target, text: content.caption ?? content.body ?? "", cta: content.cta ?? null, asset_urls: assetUrls },
      idempotencyKey: `buffer-publish-content-${content.id}-${target}`,
    });
  }

  await db.from("marketing_content").update({ status: "approval", updated_at: new Date().toISOString() }).eq("id", content.id);
  revalidatePath("/admin/marketing/content");
  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/social");
}
