export type MobileConversation = {
  id: number;
  opportunityId: number;
  opportunityTitle: string | null;
  postingMode: "quick" | "casting";
  partyName: string;
  partyImageUrl: string | null;
  status: string | null;
  latestMessage: string | null;
  lastActivityAt: string | null;
  unreadCount: number;
};

export type ConversationsResponse = {
  items: MobileConversation[];
  unreadCount: number;
};
