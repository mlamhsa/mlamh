import { trackMarketingEvent } from "@/lib/marketing/events/track";

import { processCommercialInquiry } from "./service";

export type SupportCommercialIntakeInput = {
  ticketNumber: string;
  createdAt?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string | null;
  subject: string;
  message: string;
  category: string;
};

/**
 * Support is only a source adapter. The commercial intake contract is channel-agnostic;
 * future Email/Instagram/WhatsApp/Website/LinkedIn adapters can map into the same service.
 */
export async function processSupportCommercialIntake(input: SupportCommercialIntakeInput) {
  const result = await processCommercialInquiry({
    sourceChannel: "support",
    sourceReference: `support-ticket:${input.ticketNumber}`,
    occurredAt: input.createdAt ?? new Date().toISOString(),
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    senderPhone: input.senderPhone ?? null,
    subject: input.subject,
    message: input.message,
    category: input.category,
  });

  if (result.status === "prepared" && !result.deduplicated) {
    try {
      await trackMarketingEvent({
        eventName: "brief_received",
        source: "support",
        medium: "commercial_inbound",
        entityType: "brief",
        entityId: String(result.briefId),
        metadata: {
          demand_key: result.demandKey,
          lead_id: result.leadId,
          contact_id: result.contactId,
          conversation_id: result.conversationId,
          source_reference: `support-ticket:${input.ticketNumber}`,
          outcome_verified_server_side: true,
        },
      });
    } catch (error) {
      console.error("[processSupportCommercialIntake.briefAttribution]", error);
    }
  }

  return result;
}
