import { createAdminClient } from "@/lib/supabase/admin";

export type MarkConversationReadResult =
  | { ok: true; count: number }
  | { ok: false; code: "INVALID_CONVERSATION" | "NOT_FOUND" | "UPDATE_FAILED" };

export async function markTalentConversationRead(userId: string, conversationId: number): Promise<MarkConversationReadResult> {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return { ok: false, code: "INVALID_CONVERSATION" };
  const adminClient = createAdminClient();
  const { data: talent, error: talentError } = await adminClient.from("talents").select("id").eq("user_id", userId).maybeSingle();
  if (talentError || !talent) return { ok: false, code: "NOT_FOUND" };
  const { data: conversation, error: conversationError } = await adminClient.from("conversations").select("id").eq("id", conversationId).eq("talent_id", talent.id).maybeSingle();
  if (conversationError || !conversation) return { ok: false, code: "NOT_FOUND" };

  const { data, error } = await adminClient.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", conversation.id).neq("sender_user_id", userId).is("read_at", null).select("id");
  if (error) return { ok: false, code: "UPDATE_FAILED" };
  return { ok: true, count: data?.length ?? 0 };
}
