import type {
  ConversationsResponse,
  MobileConversation,
} from "@/lib/messages/conversation-contract";
import { createAdminClient } from "@/lib/supabase/admin";

type ConversationRow = {
  id: number;
  opportunity_id: number;
  publisher_id: number | null;
  talent_id: number;
  conversation_type: string | null;
  status: string | null;
  updated_at: string | null;
};

type MessageRow = {
  id: number | string;
  conversation_id: number;
  sender_user_id: string;
  body: string | null;
  read_at: string | null;
  created_at: string | null;
};

export async function getTalentConversations(
  userId: string,
): Promise<ConversationsResponse> {
  const adminClient = createAdminClient();

  const { data: talent, error: talentError } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (talentError || !talent) {
    return { items: [], unreadCount: 0 };
  }

  const { data: conversationsData, error: conversationsError } = await adminClient
    .from("conversations")
    .select("id,opportunity_id,publisher_id,talent_id,conversation_type,status,updated_at")
    .eq("talent_id", talent.id)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    console.error("[getTalentConversations conversations]", conversationsError);
    return { items: [], unreadCount: 0 };
  }

  const conversations = (conversationsData ?? []) as ConversationRow[];
  if (conversations.length === 0) {
    return { items: [], unreadCount: 0 };
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const opportunityIds = [...new Set(conversations.map((conversation) => conversation.opportunity_id))];
  const publisherIds = [...new Set(conversations.map((conversation) => conversation.publisher_id).filter((id): id is number => id !== null))];

  const [messagesResult, opportunitiesResult, publishersResult] = await Promise.all([
    adminClient
      .from("messages")
      .select("id,conversation_id,sender_user_id,body,read_at,created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
    adminClient
      .from("opportunities")
      .select("id,title")
      .in("id", opportunityIds),
    publisherIds.length > 0
      ? adminClient
          .from("publishers")
          .select("id,company_name,contact_name,profile_image_url")
          .in("id", publisherIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (messagesResult.error || opportunitiesResult.error || publishersResult.error) {
    console.error("[getTalentConversations related data]", {
      messages: messagesResult.error,
      opportunities: opportunitiesResult.error,
      publishers: publishersResult.error,
    });
    return { items: [], unreadCount: 0 };
  }

  const messages = (messagesResult.data ?? []) as MessageRow[];
  const latestMessageByConversation = new Map<number, MessageRow>();
  const unreadByConversation = new Map<number, number>();

  for (const message of messages) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }

    if (message.sender_user_id !== userId && message.read_at === null) {
      unreadByConversation.set(
        message.conversation_id,
        (unreadByConversation.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  const opportunityMap = new Map(
    (opportunitiesResult.data ?? []).map((item) => [item.id, item]),
  );
  const publisherMap = new Map(
    (publishersResult.data ?? []).map((item) => [item.id, item]),
  );

  const items: MobileConversation[] = conversations.map((conversation) => {
    const isMlamhConversation = conversation.conversation_type === "mlamh_talent";
    const publisher = conversation.publisher_id !== null
      ? publisherMap.get(conversation.publisher_id)
      : undefined;
    const latestMessage = latestMessageByConversation.get(conversation.id);

    return {
      id: conversation.id,
      opportunityId: conversation.opportunity_id,
      opportunityTitle: opportunityMap.get(conversation.opportunity_id)?.title ?? null,
      partyName: isMlamhConversation
        ? "MLAMH"
        : publisher?.company_name || publisher?.contact_name || "Publisher",
      partyImageUrl: publisher?.profile_image_url ?? null,
      status: conversation.status,
      latestMessage: latestMessage?.body?.trim() || null,
      lastActivityAt: latestMessage?.created_at ?? conversation.updated_at,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
    };
  });

  return {
    items,
    unreadCount: items.reduce((total, item) => total + item.unreadCount, 0),
  };
}
