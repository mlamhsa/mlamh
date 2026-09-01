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
  return processCommercialInquiry({
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
}
