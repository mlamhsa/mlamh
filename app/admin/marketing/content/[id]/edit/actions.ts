"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function updateMarketingContentDraftAction(formData: FormData) {
  const user = await requireMarketingAdminAccess("marketing.manage");
  const contentId = Number(formData.get("content_id"));
  if (!Number.isInteger(contentId) || contentId <= 0) throw new Error("Invalid content id.");

  const lang = text(formData.get("lang")) === "en" ? "en" : "ar";
  const mode = text(formData.get("mode"));
  const caption = text(formData.get("caption"));
  const body = text(formData.get("body"));
  if (!caption && !body) throw new Error("Content text is required.");

  const db = createAdminClient();
  const { data: current, error: readError } = await db.from("marketing_content")
    .select("id,status")
    .eq("id", contentId)
    .single();
  if (readError || !current) throw new Error("Content not found.");
  if (!["idea", "draft", "review", "ready"].includes(current.status)) {
    throw new Error("This content must be edited from its approval workspace or is already published.");
  }

  const now = new Date().toISOString();
  const nextStatus = mode === "ready" ? "ready" : mode === "review" ? "review" : "draft";
  const { error } = await db.from("marketing_content").update({
    title: text(formData.get("title")) || null,
    hook: text(formData.get("hook")) || null,
    caption: caption || null,
    body: body || caption || null,
    cta: text(formData.get("cta")) || null,
    objective: text(formData.get("objective")) || null,
    content_type: text(formData.get("content_type")) || "post",
    channel: text(formData.get("channel")) || null,
    language: text(formData.get("language")) === "en" ? "en" : "ar",
    status: nextStatus,
    updated_at: now,
  }).eq("id", contentId);
  if (error) throw new Error(`[edit marketing content] ${error.message}`);

  await db.from("marketing_agent_activity").insert({
    task_id: null,
    action: "content_edited_before_publish",
    reason: "Marketing content edited by admin before publishing approval.",
    channel: text(formData.get("channel")) || "content",
    result: { content_id: contentId, edited_by: user.id, previous_status: current.status, next_status: nextStatus },
  });

  for (const path of [
    "/admin/marketing/content",
    "/admin/marketing/content/review",
    `/admin/marketing/content/${contentId}/edit`,
    "/admin/marketing/activity",
  ]) revalidatePath(path);

  redirect(`/admin/marketing/content/review?lang=${lang}&edited=${contentId}`);
}
