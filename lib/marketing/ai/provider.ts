export type MarketingAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type MarketingAIRequest = {
  taskType: string;
  messages: MarketingAIMessage[];
  responseFormat?: "text" | "json";
  metadata?: Record<string, unknown>;
};

export type MarketingAIResponse = {
  content: string;
  model?: string;
  provider: string;
  usage?: Record<string, number>;
  metadata?: Record<string, unknown>;
};

export interface MarketingAIProvider {
  readonly id: string;
  generate(request: MarketingAIRequest): Promise<MarketingAIResponse>;
}

let provider: MarketingAIProvider | null = null;

export function registerMarketingAIProvider(nextProvider: MarketingAIProvider) {
  provider = nextProvider;
}

export function getMarketingAIProvider() {
  if (!provider) {
    throw new Error("Marketing AI provider is not configured.");
  }
  return provider;
}
