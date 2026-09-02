import { bufferServerAdapter } from "./buffer";
import { metaServerAdapter } from "./meta";
import { whatsappServerAdapter } from "./whatsapp";
import { zohoMailServerAdapter } from "./zoho-mail";
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

export const MetaAdapter = metaServerAdapter;
export const WhatsAppAdapter = whatsappServerAdapter;
export const LinkedInAdapter = new SetupRequiredAdapter("linkedin", ["publish", "analytics"]);
export const EmailAdapter = zohoMailServerAdapter;
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
