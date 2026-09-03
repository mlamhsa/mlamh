import type { ConversationDetailResponse, MobileMessage, SendMessageResult } from "@/lib/messages/message-contract";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_MESSAGE_LENGTH = 4000;

type Context = { role: "talent" | "publisher"; admin: ReturnType<typeof createAdminClient>; conversation: any };

async function getContext(userId: string, conversationId: number): Promise<Context | null> {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,account_type").eq("user_id", userId).maybeSingle();
  if (!profile) return null;
  if (profile.account_type === "talent") {
    const { data: talent } = await admin.from("talents").select("id").eq("user_id", userId).maybeSingle();
    if (!talent) return null;
    const { data: conversation } = await admin.from("conversations").select("id,opportunity_id,publisher_id,talent_id,conversation_type,status").eq("id", conversationId).eq("talent_id", talent.id).maybeSingle();
    return conversation ? { role: "talent", admin, conversation } : null;
  }
  if (profile.account_type === "publisher") {
    const { data: publisher } = await admin.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    if (!publisher) return null;
    const { data: conversation } = await admin.from("conversations").select("id,opportunity_id,publisher_id,talent_id,conversation_type,status").eq("id", conversationId).eq("publisher_id", publisher.id).maybeSingle();
    return conversation ? { role: "publisher", admin, conversation } : null;
  }
  return null;
}

export async function getUserConversationDetail(userId: string, conversationId: number): Promise<ConversationDetailResponse | null> {
  const context = await getContext(userId, conversationId);
  if (!context) return null;
  const { admin, conversation, role } = context;
  const [messagesResult, opportunityResult, publisherResult, talentResult] = await Promise.all([
    admin.from("messages").select("id,conversation_id,sender_user_id,body,read_at,created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(200),
    admin.from("opportunities").select("id,title").eq("id", conversation.opportunity_id).maybeSingle(),
    role === "talent" && conversation.publisher_id !== null ? admin.from("publishers").select("id,company_name,contact_name").eq("id", conversation.publisher_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    role === "publisher" ? admin.from("talents").select("id,display_name_ar,display_name_en,name_ar,name_en").eq("id", conversation.talent_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (messagesResult.error) throw new Error(`[getUserConversationDetail] ${messagesResult.error.message}`);
  const partyName = role === "talent"
    ? (conversation.conversation_type === "mlamh_talent" ? "MLAMH" : publisherResult.data?.company_name || publisherResult.data?.contact_name || "Publisher")
    : talentResult.data?.display_name_ar || talentResult.data?.display_name_en || talentResult.data?.name_ar || talentResult.data?.name_en || "Talent";
  const messages: MobileMessage[] = (messagesResult.data ?? []).map((message) => ({ id: message.id, conversationId: message.conversation_id, senderUserId: message.sender_user_id, body: message.body, readAt: message.read_at ?? null, createdAt: message.created_at, isMine: message.sender_user_id === userId }));
  return { conversation: { id: conversation.id, opportunityId: conversation.opportunity_id, opportunityTitle: opportunityResult.data?.title ?? null, partyName, status: conversation.status }, messages };
}

export async function sendUserMessage(userId: string, conversationId: number, rawBody: unknown): Promise<SendMessageResult> {
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!Number.isInteger(conversationId) || conversationId <= 0) return { ok: false, code: "INVALID_CONVERSATION" };
  if (!body) return { ok: false, code: "EMPTY_MESSAGE" };
  if (body.length > MAX_MESSAGE_LENGTH) return { ok: false, code: "MESSAGE_TOO_LONG" };
  const context = await getContext(userId, conversationId);
  if (!context) return { ok: false, code: "NOT_FOUND" };
  if (context.conversation.status !== "active") return { ok: false, code: "CONVERSATION_NOT_ACTIVE" };
  const { data, error } = await context.admin.from("messages").insert({ conversation_id: conversationId, sender_user_id: userId, body }).select("id,conversation_id,sender_user_id,body,read_at,created_at").single();
  if (error || !data) return { ok: false, code: "INSERT_FAILED" };
  await context.admin.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return { ok: true, message: { id: data.id, conversationId: data.conversation_id, senderUserId: data.sender_user_id, body: data.body, readAt: data.read_at ?? null, createdAt: data.created_at, isMine: true } };
}

export async function markUserConversationRead(userId: string, conversationId: number) {
  const context = await getContext(userId, conversationId);
  if (!context) return { ok: false as const, code: "NOT_FOUND" as const };
  const { data, error } = await context.admin.from("messages").update({ read_at: new Date().toISOString() }).eq("conversation_id", conversationId).neq("sender_user_id", userId).is("read_at", null).select("id");
  if (error) return { ok: false as const, code: "UPDATE_FAILED" as const };
  return { ok: true as const, count: data?.length ?? 0 };
}
