import type { RealtimeChannel } from "@supabase/supabase-js";

import type { MobileMessage } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://mlamh.net").replace(/\/$/, "");

export async function markConversationRead(conversationId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;
  const response = await fetch(`${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
  });
  return response.ok;
}

export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function subscribeToConversationMessages({ conversationId, currentUserId, onMessage }: { conversationId: string; currentUserId: string; onMessage: (message: MobileMessage) => void }) {
  const numericConversationId = Number(conversationId);
  let channel: RealtimeChannel | null = supabase
    .channel(`mobile-conversation-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${numericConversationId}` },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (!row || Number(row.conversation_id) !== numericConversationId || typeof row.sender_user_id !== "string" || typeof row.body !== "string") return;
        onMessage({
          id: (row.id as number | string) ?? `${Date.now()}`,
          conversationId: numericConversationId,
          senderUserId: row.sender_user_id,
          body: row.body,
          readAt: typeof row.read_at === "string" ? row.read_at : null,
          createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
          isMine: row.sender_user_id === currentUserId,
        });
      },
    )
    .subscribe();

  return () => {
    if (channel) void supabase.removeChannel(channel);
    channel = null;
  };
}
