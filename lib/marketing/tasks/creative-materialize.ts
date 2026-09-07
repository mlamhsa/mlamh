import { createMarketingTask } from "@/lib/marketing/tasks/service";
import { createAdminClient } from "@/lib/supabase/admin";

type SourceTask = {
  id: number;
  agent_id: string | null;
  task_type: string;
  title: string;
};

type SocialTarget = "instagram" | "facebook";

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().replace(/\\n/g, "\n")
    : null;
}

function publicSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  const vercel = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return "https://mlamh.net";
}

function creativeAspectRatio(target: SocialTarget, contentType: string | null) {
  const type = (contentType ?? "").toLowerCase();
  if (["story", "reel", "video"].includes(type)) return "9:16";
  if (target === "facebook") return "1.91:1";
  return "1:1";
}

function instagramCta(value: string | null) {
  const withoutUrl = value?.replace(/https?:\/\/\S+|(?:www\.)?mlamh\.net\/?/gi, "").trim();
  return withoutUrl || "سجّل من الرابط في البايو";
}

export async function materializeCreativeBrief(task: SourceTask, output: Record<string, unknown>) {
  const db = createAdminClient();
  const { data: sourceTask, error: taskError } = await db
    .from("marketing_tasks")
    .select("content_id,campaign_id,channel,input")
    .eq("id", task.id)
    .maybeSingle();

  if (taskError || !sourceTask?.content_id) {
    return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeCreated: 0, socialApprovalsCreated: 0 };
  }

  const { data: content, error: contentError } = await db
    .from("marketing_content")
    .select("id,title,hook,caption,cta,content_type,channel,asset_references,campaign_id")
    .eq("id", sourceTask.content_id)
    .maybeSingle();

  if (contentError || !content) {
    return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeCreated: 0, socialApprovalsCreated: 0 };
  }

  const input = record(sourceTask.input);
  const targetValue = (text(input.target) ?? text(sourceTask.channel) ?? text(content.channel))?.toLowerCase();
  if (targetValue !== "instagram" && targetValue !== "facebook") {
    return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeCreated: 0, socialApprovalsCreated: 0 };
  }
  const target = targetValue as SocialTarget;
  const caption = text(content.caption) ?? "";
  const title = text(content.title) ?? text(content.hook) ?? `MLAMH content #${content.id}`;
  if (!caption) {
    return { contentCreated: 0, outreachCreated: 0, approvalsCreated: 0, creativeCreated: 0, socialApprovalsCreated: 0 };
  }

  const { data: existingCreative } = await db
    .from("marketing_creatives")
    .select("id,preview_path,storage_path,status")
    .eq("content_id", content.id)
    .eq("platform", target)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let creativeId = existingCreative?.id ?? null;
  let creativeCreated = 0;
  if (!creativeId) {
    const { data: created, error } = await db.from("marketing_creatives").insert({
      content_id: content.id,
      campaign_id: sourceTask.campaign_id ?? content.campaign_id ?? null,
      type: "image",
      platform: target,
      aspect_ratio: creativeAspectRatio(target, content.content_type),
      status: "approved",
      storage_path: null,
      preview_path: null,
      created_by_agent_id: task.agent_id ?? "sarah",
      version: 1,
      metadata: {
        source: "mlamh_brand_renderer",
        source_task_id: task.id,
        autonomous: true,
        generated_template: "mlamh_premium_v1",
        ai_brief: output,
      },
    }).select("id").single();
    if (error || !created) throw new Error(`[marketing_materialize.creative] ${error?.message ?? "insert failed"}`);
    creativeId = created.id;
    creativeCreated = 1;
  }

  const assetUrl = `${publicSiteUrl()}/api/marketing/creative/${creativeId}`;
  const existingAssets = Array.isArray(content.asset_references)
    ? content.asset_references.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : [];
  const assetReferences = [...new Set([...existingAssets.filter((value) => !value.endsWith("/og-image.png")), assetUrl])];
  const now = new Date().toISOString();

  const { error: creativeUpdateError } = await db.from("marketing_creatives").update({
    status: "approved",
    preview_path: assetUrl,
    updated_at: now,
  }).eq("id", creativeId);
  if (creativeUpdateError) throw new Error(`[marketing_materialize.creative.update] ${creativeUpdateError.message}`);

  const finalCta = target === "instagram" ? instagramCta(text(content.cta)) : text(content.cta);
  const finalCaption = target === "instagram"
    ? caption.replace(/(?:https?:\/\/)?(?:www\.)?mlamh\.net\/?/gi, "").replace(/\n{3,}/g, "\n\n").trim()
    : caption;

  const { error: contentUpdateError } = await db.from("marketing_content").update({
    caption: finalCaption,
    cta: finalCta,
    asset_references: assetReferences,
    status: "review",
    updated_at: now,
  }).eq("id", content.id);
  if (contentUpdateError) throw new Error(`[marketing_materialize.creative.content] ${contentUpdateError.message}`);

  const socialTask = await createMarketingTask({
    agentId: "reem",
    taskType: "social_publish",
    title: `Review social publish · ${title}`,
    objective: `Review the completed ${target} visual and final copy before external publishing. The visual is required and Buffer execution remains approval-gated.`,
    priority: "high",
    channel: "buffer",
    approvalLevel: "approval_required",
    contentId: content.id,
    campaignId: sourceTask.campaign_id ?? content.campaign_id ?? null,
    parentTaskId: task.id,
    source: "autonomous_materializer",
    input: {
      provider: "buffer",
      target,
      text: finalCaption,
      caption: finalCaption,
      cta: finalCta,
      asset_urls: assetReferences,
      content_id: content.id,
      source_task_id: task.id,
      creative_id: creativeId,
      visual_required: true,
      test_mode: false,
    },
    metadata: {
      source_task_id: task.id,
      autonomous: true,
      creative_id: creativeId,
      visual_verified: true,
    },
    idempotencyKey: `social-publish-content-${content.id}-${target}`,
  });

  return {
    contentCreated: 0,
    outreachCreated: 0,
    approvalsCreated: 1,
    creativeCreated,
    socialApprovalsCreated: 1,
    creativeId,
    socialTaskId: socialTask.id,
    assetUrl,
  };
}
