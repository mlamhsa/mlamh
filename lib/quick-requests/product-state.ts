export type QuickRequestProductState =
  | "interested"
  | "conversation_open"
  | "preliminary_selected"
  | "materials_requested"
  | "awaiting_talent_confirmation"
  | "mutually_confirmed"
  | "declined";

export type QuickRequestViewerRole = "talent" | "publisher";

export type QuickRequestWorkflowEvent = {
  eventType: string;
  metadata?: Record<string, unknown> | null;
};

export type QuickRequestProductStateResult = {
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

const EVENT = {
  materialsRequested: "quick_request_materials_requested",
  publisherConfirmed: "quick_request_selection_confirmed",
  talentConfirmed: "quick_request_talent_confirmed",
  talentDeclined: "quick_request_talent_declined",
  contactShared: "quick_request_contact_shared",
} as const;

function hasEvent(events: QuickRequestWorkflowEvent[], eventType: string) {
  return events.some((event) => event.eventType === eventType);
}

function requestedMaterialKeys(events: QuickRequestWorkflowEvent[]) {
  return Array.from(
    new Set(
      events
        .filter((event) => event.eventType === EVENT.materialsRequested)
        .map((event) => String(event.metadata?.requestType ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function contactSharedBy(
  events: QuickRequestWorkflowEvent[],
  role: QuickRequestViewerRole,
) {
  return events.some(
    (event) =>
      event.eventType === EVENT.contactShared &&
      String(event.metadata?.sharedBy ?? "") === role,
  );
}

export function resolveQuickRequestProductState(input: {
  applicationStatus: string | null | undefined;
  hasConversation: boolean;
  viewerRole: QuickRequestViewerRole;
  events?: QuickRequestWorkflowEvent[];
}): QuickRequestProductStateResult {
  const events = input.events ?? [];
  const requestedMaterials = requestedMaterialKeys(events);
  const publisherConfirmed = hasEvent(events, EVENT.publisherConfirmed);
  const talentConfirmed = hasEvent(events, EVENT.talentConfirmed);
  const talentDeclined = hasEvent(events, EVENT.talentDeclined);
  const contactSharedByPublisher = contactSharedBy(events, "publisher");
  const contactSharedByTalent = contactSharedBy(events, "talent");
  const preliminarySelected = input.applicationStatus === "accepted";

  let state: QuickRequestProductState;
  if (talentDeclined) state = "declined";
  else if (talentConfirmed) state = "mutually_confirmed";
  else if (publisherConfirmed) state = "awaiting_talent_confirmation";
  else if (requestedMaterials.length > 0) state = "materials_requested";
  else if (preliminarySelected) state = "preliminary_selected";
  else if (input.hasConversation) state = "conversation_open";
  else state = "interested";

  const workflowActive = preliminarySelected && !talentDeclined && !talentConfirmed;
  const canRequestMaterials =
    input.viewerRole === "publisher" && workflowActive && !publisherConfirmed;
  const canPublisherConfirm =
    input.viewerRole === "publisher" && workflowActive && !publisherConfirmed;
  const canTalentConfirm =
    input.viewerRole === "talent" && publisherConfirmed && !talentDeclined && !talentConfirmed;
  const canTalentDecline = canTalentConfirm;
  const viewerSharedContact =
    input.viewerRole === "publisher"
      ? contactSharedByPublisher
      : contactSharedByTalent;
  const canShareContact =
    talentConfirmed && !talentDeclined && !viewerSharedContact;

  return {
    state,
    requestedMaterials,
    contactSharedByPublisher,
    contactSharedByTalent,
    actions: {
      canRequestMaterials,
      canPublisherConfirm,
      canTalentConfirm,
      canTalentDecline,
      canShareContact,
    },
  };
}
