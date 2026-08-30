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

export type MarketingMessageInput = {
  recipient: Record<string, unknown>;
  text: string;
  templateKey?: string | null;
  metadata?: Record<string, unknown>;
};

export type MarketingExecutionResult = {
  ok: boolean;
  externalId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

export type MarketingPublishResult = MarketingExecutionResult;
export type MarketingMessageResult = MarketingExecutionResult;

export interface MarketingChannelAdapter {
  readonly provider: string;
  readonly capabilities: readonly MarketingChannelCapability[];
  getStatus(): Promise<MarketingChannelStatus>;
  publish?(input: MarketingPublishInput): Promise<MarketingPublishResult>;
  sendMessage?(input: MarketingMessageInput): Promise<MarketingMessageResult>;
  verifyWebhook?(headers: Headers, rawBody: string): Promise<boolean> | boolean;
}
