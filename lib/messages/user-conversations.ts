import type { ConversationsResponse, MobileConversation } from "@/lib/messages/conversation-contract";
import { createAdminClient } from "@/lib/supabase/admin";

type Role = "talent" | "publisher";
type Context = { role: Role; entityId: number };

async function resolveContext(userId: string): Promise<Context | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,account_type").eq("user_id", userId).maybeSingle();
  if (!profile) return null;
  if (profile.account_type === "talent") {
    const { data } = await admin.from("talents").select("id").eq("user_id", userId).maybeSingle();
    return data ? { role: "talent", entityId: data.id } : null;
  }
  if (profile.account_type === "publisher") {
    const { data } = await admin.from("publishers").select("id").eq("profile_id", profile.id).maybeSingle();
    return data ? { role: "publisher", entityId: data.id } : null;
  }
  return null;
}

export async function getUserConversations(userId: string): Promise<ConversationsResponse> {
  const admin = createAdminClient();
  const context = await resolveContext(userId);
  if (!context) return { items: [], unreadCount: 0 };

  const query = admin.from("conversations").select("id,opportunity_id,publisher_id,talent_id,conversation_type,status,updated_at").order("updated_at", { ascending: false });
  const { data: rows, error } = context.role === "talent" ? await query.eq("talent_id", context.entityId) : await query.eq("publisher_id", context.entityId);
  if (error || !rows?.length) return { items: [], unreadCount: 0 };

  const ids = rows.map((row) => row.id);
  const opportunityIds = [...new Set(rows.map((row) => row.opportunity_id))];
  const oppositeIds = [...new Set(rows.map((row) => context.role === "talent" ? row.publisher_id : row.talent_id).filter((id): id is number => id !== null))];

  const [messagesResult, opportunitiesResult, partiesResult] = await Promise.all([
    admin.from("messages").select("id,conversation_id,sender_user_id,body,read_at,created_at").in("conversation_id", ids).order("created_at", { ascending: false }),
    admin.from("opportunities").select("id,title").in("id", opportunityIds),
    context.role === "talent"
      ? admin.from("publishers").select("id,company_name,contact_name,profile_image_url").in("id", oppositeIds)
      : admin.from("talents").select("id,display_name_ar,display_name_en,name_ar,name_en,image_url").in("id", oppositeIds),
  ]);
  if (messagesResult.error || opportunitiesResult.error || partiesResult.error) return { items: [], unreadCount: 0 };

  const latest = new Map<number, any>();
  const unread = new Map<number, number>();
  for (const message of messagesResult.data ?? []) {
    if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
    if (message.sender_user_id !== userId && message.read_at === null) unread.set(message.conversation_id, (unread.get(message.conversation_id) ?? 0) + 1);
  }
  const opportunities = new Map((opportunitiesResult.data ?? []).map((item) => [item.id, item]));
  const parties = new Map((partiesResult.data ?? []).map((item: any) => [item.id, item]));

  const items: MobileConversation[] = rows.map((row) => {
    const party = parties.get(context.role === "talent" ? row.publisher_id : row.talent_id) as any;
    const last = latest.get(row.id);
    const partyName = context.role === "talent"
      ? (row.conversation_type === "mlamh_talent" ? "MLAMH" : party?.company_name || party?.contact_name || "Publisher")
      : party?.display_name_ar || party?.display_name_en || party?.name_ar || party?.name_en || "Talent";
    const partyImageUrl = context.role === "talent" ? party?.profile_image_url ?? null : party?.image_url ?? null;
    return { id: row.id, opportunityId: row.opportunity_id, opportunityTitle: opportunities.get(row.opportunity_id)?.title ?? null, partyName, partyImageUrl, status: row.status, latestMessage: last?.body?.trim() || null, lastActivityAt: last?.created_at ?? row.updated_at, unreadCount: unread.get(row.id) ?? 0 };
  });
  return { items, unreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0) };
}
