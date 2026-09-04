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

function targetRequiresVisual(target: BufferTarget, contentType: string | null) {
  if (target === "instagram") return true;
  return ["reel", "story", "carousel", "video"].includes((contentType ?? "").toLowerCase());
}

function hasUsableCreative(rows: Array<{ platform: string | null; status: string | null; storage_path: string | null; preview_path: string | null }>, target: BufferTarget) {
  return rows.some((row) => {
    const platform = (row.platform ?? "").toLowerCase();
    const platformMatches = !platform || platform === target || platform === "buffer" || platform === "social";
    const ready = ["ready", "approved", "published"].includes((row.status ?? "").toLowerCase());
    const hasAsset = Boolean(row.storage_path?.trim() || row.preview_path?.trim());
    return platformMatches && ready && hasAsset;
  });
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
  const { data: content, error } = await db.from("marketing_content").select("id,title,caption,body,cta,channel,content_type,agent_id,status,campaign_id,asset_references").eq("id", contentId).single();
  if (error || !content) throw new Error("Content not found.");
  if (!["draft", "review", "ready"].includes(content.status)) throw new Error("Content is not ready to request publishing approval.");

  const targets = parseBufferTargets(formData, content.channel);
  if (targets.length === 0) throw new Error("Select Instagram, Facebook, or both as Buffer targets.");
  const assetUrls = Array.isArray(content.asset_references) ? content.asset_references.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [];
  const { data: creatives } = await db
    .from("marketing_creatives")
    .select("platform,status,storage_path,preview_path")
    .eq("content_id", content.id);
  const creativeRows = creatives ?? [];
  let approvalsCreated = 0;
  let creativeBlocked = false;

  for (const target of targets) {
    const visualRequired = targetRequiresVisual(target, content.content_type);
    const hasCreative = assetUrls.length > 0 || hasUsableCreative(creativeRows, target);

    if (visualRequired && !hasCreative) {
      creativeBlocked = true;
      await createMarketingTask({
        agentId: "sarah",
        taskType: "creative_brief",
        title: `Creative required: ${content.title ?? `content #${content.id}`}`,
        objective: `Prepare and attach a production-ready ${target} visual before this content can enter publishing approval.`,
        priority: "high",
        channel: target,
        approvalLevel: "auto",
        contentId: content.id,
        campaignId: content.campaign_id,
        source: "content_studio_visual_gate",
        input: {
          content_id: content.id,
          target,
          content_type: content.content_type,
          caption: content.caption ?? content.body ?? "",
          cta: content.cta ?? null,
          required_asset: true,
          publishing_gate: "visual_required",
        },
        metadata: { creative_gate: true, blocked_publish: true },
        idempotencyKey: `creative-production-content-${content.id}-${target}`,
      });
      continue;
    }

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
    approvalsCreated += 1;
  }

  await db.from("marketing_content").update({
    status: approvalsCreated > 0 ? "approval" : creativeBlocked ? "review" : content.status,
    updated_at: new Date().toISOString(),
  }).eq("id", content.id);

  revalidatePath("/admin/marketing/content");
  revalidatePath("/admin/marketing/creative");
  revalidatePath("/admin/marketing/tasks");
  revalidatePath("/admin/marketing/approvals");
  revalidatePath("/admin/marketing/social");
}
