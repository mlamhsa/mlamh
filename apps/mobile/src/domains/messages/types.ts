export type QuickRequestProductState =
  | "interested"
  | "conversation_open"
  | "preliminary_selected"
  | "materials_requested"
  | "awaiting_talent_confirmation"
  | "mutually_confirmed"
  | "declined";

export type ConversationQuickWorkflow = {
  mode: "quick";
  state: QuickRequestProductState;
  requestedMaterials: string[];
  contactSharedByPublisher: boolean;
  contactSharedByTalent: boolean;
  actions: {
    canRequestMaterials: boolean;
    canPublisherConfirm: boolean;
    canTalentConfirm: boolean;
    canTalentDecline: boolean;
    canShareContact: boolean;
  };
};

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
    postingMode: "quick" | "casting";
    partyName: string;
    status: string;
    workflow: ConversationQuickWorkflow | null;
  };
  messages: MobileMessage[];
};

export type SendMessageResult =
  | { ok: true; message: MobileMessage }
  | { ok: false; code: string };
