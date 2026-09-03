import type { ConversationDetailResponse, MobileMessage, SendMessageResult } from "@/lib/messages/message-contract";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_MESSAGE_LENGTH = 4000;

type ConversationContext = { adminClient: ReturnType<typeof createAdminClient>; conversation: any; role: "talent" | "publisher" };

async function getConversationContext(userId: string, conversationId: number): Promise<ConversationContext | null> {
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient.from("profiles").select("id,account_type").eq("user_id", userId).maybeSingle();
  if (!profile) return null;

  if (profile.account_type === "talent") {
    const { data: talent } = await adminClient.from("talents").select("id").eq("user_id", userId).maybeSingle();
    if (!talent) return null;
    const { data: conversation } = await adminClient.from("conversations").select("id,opportunity_id,publisher_id,talent_id,conversation_type,status").eq("id", conversationId).eq("talent_id", talent.id).maybeSingle();
    return conversation ? { adminClient, conversation, role: "talent" } : null;
  }

  if (profile.account_type === "publisher") {
    const { data: publisher } = await adminClient.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    if (!publisher) return null;
    const { data: conversation } = await adminClient.from("conversations").select("id,opportunity_id,publisher_id,talent_id,conversation_type,status").eq("id", conversationId).eq("publisher_id", publisher.id).maybeSingle();
    return conversation ? { adminClient, conversation, role: "publisher" } : null;
  }

  return null;
}

export async function getTalentConversationDetail(userId: string, conversationId: number): Promise<ConversationDetailResponse | null> {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return null;
  const context = await getConversationContext(userId, conversationId);
  if (!context) return null;
  const { adminClient, conversation, role } = context;

  const [messagesResult, opportunityResult, publisherResult, talentResult] = await Promise.all([
    adminClient.from("messages").select("id,conversation_id,sender_user_id,body,read_at,created_at").eq("conversation_id", conversation.id).order("created_at", { ascending: true }).limit(200),
    adminClient.from("opportunities").select("id,title").eq("id", conversation.opportunity_id).maybeSingle(),
    conversation.publisher_id !== null ? adminClient.from("publishers").select("id,company_name,contact_name").eq("id", conversation.publisher_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    conversation.talent_id !== null ? adminClient.from("talents").select("id,display_name_ar,display_name_en,name_ar,name_en").eq("id", conversation.talent_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (messagesResult.error) throw new Error(`[getConversationDetail] ${messagesResult.error.message}`);

  const talentName = talentResult.data?.display_name_ar || talentResult.data?.display_name_en || talentResult.data?.name_ar || talentResult.data?.name_en || "Talent";
  const publisherName = conversation.conversation_type === "mlamh_talent" ? "MLAMH" : (publisherResult.data?.company_name || publisherResult.data?.contact_name || "Publisher");
  const partyName = role === "publisher" ? talentName : publisherName;
  const messages: MobileMessage[] = (messagesResult.data ?? []).map((message) => ({ id: message.id, conversationId: message.conversation_id, senderUserId: message.sender_user_id, body: message.body, readAt: message.read_at ?? null, createdAt: message.created_at, isMine: message.sender_user_id === userId }));

  return { conversation: { id: conversation.id, opportunityId: conversation.opportunity_id, opportunityTitle: opportunityResult.data?.title ?? null, partyName, status: conversation.status }, messages };
}

export async function sendTalentMessage(userId: string, conversationId: number, rawBody: unknown): Promise<SendMessageResult> {
  if (!Number.isInteger(conversationId) || conversationId <= 0) return { ok: false, code: "INVALID_CONVERSATION" };
  const body = typeof rawBody === "string" ? rawBody.trim() : "";
  if (!body) return { ok: false, code: "EMPTY_MESSAGE" };
  if (body.length > MAX_MESSAGE_LENGTH) return { ok: false, code: "MESSAGE_TOO_LONG" };
  const context = await getConversationContext(userId, conversationId);
  if (!context) return { ok: false, code: "NOT_FOUND" };
  const { adminClient, conversation } = context;
  if (conversation.status !== "active") return { ok: false, code: "CONVERSATION_NOT_ACTIVE" };

  const { data, error } = await adminClient.from("messages").insert({ conversation_id: conversation.id, sender_user_id: userId, body }).select("id,conversation_id,sender_user_id,body,read_at,created_at").single();
  if (error || !data) { console.error("[sendConversationMessage]", error); return { ok: false, code: "INSERT_FAILED" }; }
  await adminClient.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversation.id);
  return { ok: true, message: { id: data.id, conversationId: data.conversation_id, senderUserId: data.sender_user_id, body: data.body, readAt: data.read_at ?? null, createdAt: data.created_at, isMine: true } };
}
