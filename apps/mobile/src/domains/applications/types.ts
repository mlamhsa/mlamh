export type TalentApplicationDisplayState =
  | "pending"
  | "reviewing"
  | "shortlisted"
  | "accepted"
  | "rejected"
  | "interested"
  | "conversation_open"
  | "preliminary_selected"
  | "materials_requested"
  | "awaiting_talent_confirmation"
  | "mutually_confirmed"
  | "declined";

export type TalentApplicationNextAction =
  | "open_conversation"
  | "confirm_or_decline"
  | "share_contact"
  | null;

export type TalentApplicationItem = {
  id: number | string;
  status: "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected";
  displayState: TalentApplicationDisplayState;
  requiresAction: boolean;
  nextAction: TalentApplicationNextAction;
  createdAt: string | null;
  opportunity: {
    id: number | string;
    title: string | null;
    slug: string | null;
    city: string | null;
    countryCode: string | null;
    opportunityType: string | null;
    postingMode: "quick" | "casting";
    status: string | null;
    createdAt: string | null;
  } | null;
  conversationId: string | null;
};

export type TalentApplicationsResponse = {
  ok: true;
  items: TalentApplicationItem[];
  counts: Record<"total" | "pending" | "reviewing" | "shortlisted" | "accepted" | "rejected", number>;
};
