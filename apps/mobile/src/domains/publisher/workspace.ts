import { mobileApiRequest } from "@/src/api/client";

export type PublisherQuickWorkflow = {
  state:
    | "interested"
    | "conversation_open"
    | "preliminary_selected"
    | "materials_requested"
    | "awaiting_talent_confirmation"
    | "mutually_confirmed"
    | "declined";
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

export type PublisherOpportunityApplicant = {
  applicationId: number;
  rawStatus: string;
  displayState: string;
  createdAt: string | null;
  updatedAt: string | null;
  conversationId: number | null;
  conversationStatus: string | null;
  quickWorkflow: PublisherQuickWorkflow | null;
  talent: {
    id: number;
    slug: string | null;
    nameAr: string | null;
    nameEn: string | null;
    imageUrl: string | null;
    cityAr: string | null;
    cityEn: string | null;
    role: string | null;
  } | null;
};

export type PublisherOpportunityWorkspaceResponse = {
  ok: true;
  opportunity: {
    id: number;
    title: string;
    slug: string | null;
    postingMode: "quick" | "casting";
    status: string;
    cityAr: string | null;
    cityEn: string | null;
    talentType: string | null;
    createdAt: string | null;
  };
  applicants: PublisherOpportunityApplicant[];
  counts: {
    total: number;
    pending: number;
    selected: number;
    rejected: number;
    conversations: number;
  };
};

export function getPublisherOpportunityWorkspace(id: number) {
  return mobileApiRequest<PublisherOpportunityWorkspaceResponse>(`/api/mobile/publisher/opportunities/${id}`);
}
