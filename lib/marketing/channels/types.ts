export type MarketingChannelCapability =
  | "publish"
  | "analytics"
  | "comments"
  | "messages"
  | "webhooks"
  | "templates"
  | "delivery_status";

export type MarketingChannelStatus =
  | "connected"
  | "setup_required"
  | "connecting"
  | "error"
  | "paused"
  | "limited";

export type MarketingPublishInput = {
  contentId: number;
  text?: string;
  assetUrls?: string[];
  scheduledAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type MarketingPublishResult = {
  ok: boolean;
  externalId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export interface MarketingChannelAdapter {
  readonly provider: string;
  readonly capabilities: readonly MarketingChannelCapability[];
  getStatus(): Promise<MarketingChannelStatus>;
  publish?(input: MarketingPublishInput): Promise<MarketingPublishResult>;
  verifyWebhook?(headers: Headers, rawBody: string): Promise<boolean> | boolean;
}
