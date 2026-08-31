import { bufferServerAdapter } from "./buffer";
import type { MarketingChannelAdapter, MarketingChannelCapability, MarketingChannelStatus } from "./types";

class SetupRequiredAdapter implements MarketingChannelAdapter {
  constructor(
    public readonly provider: string,
    public readonly capabilities: readonly MarketingChannelCapability[],
    private readonly status: MarketingChannelStatus = "setup_required",
  ) {}

  async getStatus(): Promise<MarketingChannelStatus> {
    return this.status;
  }
}

export const MetaAdapter = new SetupRequiredAdapter("meta", ["publish", "analytics", "comments", "messages", "webhooks"]);
export const WhatsAppAdapter = new SetupRequiredAdapter("whatsapp", ["messages", "webhooks", "templates", "delivery_status"]);
export const LinkedInAdapter = new SetupRequiredAdapter("linkedin", ["publish", "analytics"]);
export const EmailAdapter = new SetupRequiredAdapter("email", ["messages", "webhooks", "delivery_status"]);
export const BufferAdapter = bufferServerAdapter;

export const marketingChannelAdapters: Record<string, MarketingChannelAdapter> = {
  meta: MetaAdapter,
  whatsapp: WhatsAppAdapter,
  linkedin: LinkedInAdapter,
  email: EmailAdapter,
  buffer: BufferAdapter,
};

export function getMarketingChannelAdapter(provider: string) {
  return marketingChannelAdapters[provider] ?? null;
}
