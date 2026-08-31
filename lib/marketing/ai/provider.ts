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

type ResponsesPayload = {
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

type MarketingAIConfiguration = {
  disabled: boolean;
  configured: boolean;
  provider: "vercel-ai-gateway" | "openai" | "unconfigured";
  authMode: "vercel_oidc" | "gateway_api_key" | "openai_api_key" | "none";
  apiKey: string;
  model: string;
  baseUrl: string;
};

const DEFAULT_MODEL = "gpt-5.6-luna";
const VERCEL_AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
let provider: MarketingAIProvider | null = null;

function gatewayModel(model: string) {
  return model.includes("/") ? model : `openai/${model}`;
}

function directOpenAIModel(model: string) {
  return model.startsWith("openai/") ? model.slice("openai/".length) : model;
}

function readMarketingAIConfiguration(): MarketingAIConfiguration {
  const disabled = process.env.MARKETING_AI_DISABLED === "true";
  const requestedModel = process.env.MARKETING_AI_MODEL?.trim() || DEFAULT_MODEL;
  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim() ?? "";
  const vercelOidcToken = process.env.VERCEL_OIDC_TOKEN?.trim() ?? "";
  const openAIApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

  if (!disabled && (gatewayApiKey || vercelOidcToken)) {
    return {
      disabled,
      configured: true,
      provider: "vercel-ai-gateway",
      authMode: gatewayApiKey ? "gateway_api_key" : "vercel_oidc",
      apiKey: gatewayApiKey || vercelOidcToken,
      model: gatewayModel(requestedModel),
      baseUrl: VERCEL_AI_GATEWAY_BASE_URL,
    };
  }

  if (!disabled && openAIApiKey) {
    return {
      disabled,
      configured: true,
      provider: "openai",
      authMode: "openai_api_key",
      apiKey: openAIApiKey,
      model: directOpenAIModel(requestedModel),
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
    };
  }

  return {
    disabled,
    configured: false,
    provider: "unconfigured",
    authMode: "none",
    apiKey: "",
    model: requestedModel,
    baseUrl: "",
  };
}

class ResponsesMarketingProvider implements MarketingAIProvider {
  constructor(
    public readonly id: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const input = request.messages.map((message) => ({
      type: "message",
      role: message.role === "system" ? "developer" : message.role,
      content: message.content,
    }));

    if (request.responseFormat === "json") {
      input.unshift({
        type: "message",
        role: "developer",
        content: "Return valid JSON only. Do not wrap the JSON in markdown fences and do not include commentary outside the JSON value.",
      });
    }

    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "http-referer": "https://mlamh.net",
        "x-title": "MLAMH Marketing Hub",
      },
      body: JSON.stringify({
        model: this.model,
        input,
        store: false,
      }),
      cache: "no-store",
    });

    let payload: ResponsesPayload;
    try {
      payload = (await response.json()) as ResponsesPayload;
    } catch {
      throw new Error(`[MarketingAI.${this.id}] Invalid JSON response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const message = payload.error?.message || `AI request failed with HTTP ${response.status}.`;
      throw new Error(`[MarketingAI.${this.id}] ${message}`);
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
      throw new Error(`[MarketingAI.${this.id}] The model returned no text output.`);
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
  const config = readMarketingAIConfiguration();
  return {
    configured: config.configured,
    disabled: config.disabled,
    provider: config.provider,
    authMode: config.authMode,
    model: config.model,
    reason: config.disabled
      ? "MARKETING_AI_DISABLED=true"
      : config.configured
        ? null
        : "No Vercel AI Gateway/OIDC or OpenAI credential is available",
  };
}

export function getMarketingAIProvider() {
  if (provider) return provider;

  const config = readMarketingAIConfiguration();
  if (!config.configured) {
    throw new Error(
      config.disabled
        ? "Marketing AI is disabled by configuration."
        : "Marketing AI provider is not configured. Vercel OIDC/AI Gateway or OPENAI_API_KEY is required.",
    );
  }

  provider = new ResponsesMarketingProvider(
    config.provider,
    config.apiKey,
    config.model,
    config.baseUrl,
  );
  return provider;
}
