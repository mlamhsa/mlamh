export type MobileMessage = {
  id: number | string;
  conversationId: number;
  senderUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  isMine: boolean;
};

export type ConversationDetailResponse = {
  conversation: {
    id: number;
    opportunityId: number;
    opportunityTitle: string | null;
    partyName: string;
    status: string;
    participantRole: "talent" | "publisher";
    startPolicy: "publisher_starts";
    canSend: boolean;
  };
  messages: MobileMessage[];
};

export type SendMessageResult =
  | { ok: true; message: MobileMessage }
  | {
      ok: false;
      code:
        | "INVALID_CONVERSATION"
        | "NOT_FOUND"
        | "CONVERSATION_NOT_ACTIVE"
        | "PUBLISHER_MUST_START"
        | "EMPTY_MESSAGE"
        | "MESSAGE_TOO_LONG"
        | "INSERT_FAILED";
    };
