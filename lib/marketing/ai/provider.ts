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

type OpenAIResponsePayload = {
  model?: string;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
  };
};

const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";
let provider: MarketingAIProvider | null = null;

function readOpenAIConfiguration() {
  const disabled = process.env.MARKETING_AI_DISABLED === "true";
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = process.env.MARKETING_AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");

  return {
    disabled,
    apiKey,
    model,
    baseUrl,
    configured: !disabled && apiKey.length > 0,
  };
}

class OpenAIResponsesMarketingProvider implements MarketingAIProvider {
  readonly id = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const input = request.messages.map((message) => ({
      role: message.role === "system" ? "developer" : message.role,
      content: message.content,
    }));

    if (request.responseFormat === "json") {
      input.unshift({
        role: "developer",
        content: "Return valid JSON only. Do not wrap the JSON in markdown fences and do not include commentary outside the JSON value.",
      });
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input,
        store: false,
      }),
      cache: "no-store",
    });

    const payload = (await response.json()) as OpenAIResponsePayload;
    if (!response.ok) {
      const message = payload.error?.message || `OpenAI request failed with HTTP ${response.status}.`;
      throw new Error(`[MarketingAI.openai] ${message}`);
    }

    const outputText = payload.output_text?.trim() ||
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .filter((item) => item.type === "output_text" && typeof item.text === "string")
        .map((item) => item.text?.trim() ?? "")
        .filter(Boolean)
        .join("\n") ||
      "";

    if (!outputText) {
      throw new Error("[MarketingAI.openai] The model returned no text output.");
    }

    const usage: Record<string, number> = {};
    if (typeof payload.usage?.input_tokens === "number") usage.input_tokens = payload.usage.input_tokens;
    if (typeof payload.usage?.output_tokens === "number") usage.output_tokens = payload.usage.output_tokens;
    if (typeof payload.usage?.total_tokens === "number") usage.total_tokens = payload.usage.total_tokens;

    return {
      content: outputText,
      model: payload.model || this.model,
      provider: this.id,
      usage,
      metadata: request.metadata,
    };
  }
}

export function registerMarketingAIProvider(nextProvider: MarketingAIProvider) {
  provider = nextProvider;
}

export function getMarketingAIConfigurationState() {
  const config = readOpenAIConfiguration();
  return {
    configured: config.configured,
    disabled: config.disabled,
    provider: "openai",
    model: config.model,
    reason: config.disabled
      ? "MARKETING_AI_DISABLED=true"
      : config.apiKey
        ? null
        : "OPENAI_API_KEY is not configured",
  };
}

export function getMarketingAIProvider() {
  if (provider) return provider;

  const config = readOpenAIConfiguration();
  if (!config.configured) {
    throw new Error(
      config.disabled
        ? "Marketing AI is disabled by configuration."
        : "Marketing AI provider is not configured. Add OPENAI_API_KEY to the server environment.",
    );
  }

  provider = new OpenAIResponsesMarketingProvider(config.apiKey, config.model, config.baseUrl);
  return provider;
}
