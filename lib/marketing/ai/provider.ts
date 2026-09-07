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

type ResponseAnnotation = {
  type?: string;
  url?: string;
  title?: string;
};

type ResponsesPayload = {
  model?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: ResponseAnnotation[];
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

type ExpiredFreeModelFallback = {
  model: string;
  providerOptions: {
    gateway: {
      has: ["free"];
    };
  };
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

export function expiredFreeModelFallback(model: string, message: string): ExpiredFreeModelFallback | null {
  const requested = model.trim();
  const normalized = requested.toLowerCase();
  if (!normalized.endsWith("-free")) return null;
  if (!/(model .*not found|free tier.*ended|free.*ended)/i.test(message)) return null;

  const baseModel = requested.slice(0, -"-free".length);
  if (!baseModel) return null;
  return {
    model: baseModel,
    providerOptions: {
      gateway: {
        has: ["free"],
      },
    },
  };
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

function uniqueWebSources(payload: ResponsesPayload) {
  const sources = new Map<string, { url: string; title?: string }>();
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        const url = typeof annotation.url === "string" ? annotation.url.trim() : "";
        if (!/^https?:\/\//i.test(url)) continue;
        if (!sources.has(url)) sources.set(url, { url, ...(annotation.title?.trim() ? { title: annotation.title.trim() } : {}) });
      }
    }
  }
  return [...sources.values()].slice(0, 20);
}

function attachResearchSources(content: string, sources: Array<{ url: string; title?: string }>) {
  if (!sources.length) return content;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return content;
    return JSON.stringify({
      ...(parsed as Record<string, unknown>),
      web_sources: sources,
    });
  } catch {
    return content;
  }
}

const LEAD_RESEARCH_GUIDANCE = `You may use web search only to research publicly available professional/business contact information relevant to the supplied company lead.
Use a staged search strategy instead of stopping after one exact-name query:
1. Entity resolution: search the exact organization name with city/country and service keywords, then identify the official company website and reputable company LinkedIn page when available. Search English and Arabic/transliterated name variants when the lead name may be localized or ambiguous.
2. Company evidence: inspect official About, Team, Leadership, Contact, Services and relevant job/casting pages to confirm the entity, website, public business email and the kinds of roles likely to own talent/casting or partnerships.
3. Decision-maker discovery: search named employees from reputable company pages together with the company name and decision roles. Prioritize Founder/CEO, Producer/Executive Producer, Casting Director/Manager, Head of Production, Business Development, Partnerships and closely related roles.
4. Person verification: prefer a personal LinkedIn /in/ profile or official company/team page that explicitly supports the person's current company and professional role. A company LinkedIn page may identify employee names, but it is not a personal outreach channel. A job posting proves the company needs a role, not that a named person currently holds it.
5. Evidence quality: prefer official company sources and LinkedIn professional pages. A reputable public business directory may be used as secondary evidence, but do not rely on gated data or inferred contact details. Never infer an email format from a domain or a title from a generic team inbox.
6. Fail closed: if you cannot source a real person + professional role + public business email or personal LinkedIn profile, return the partial company evidence and missing fields instead of fabricating readiness.
For each researched lead, return lead_research items with lead_id, readiness_status, candidate_contact {name, role, public_business_email, public_linkedin_url, company_website}, source_evidence [{url,title,claim}], confidence, missing_fields, remaining_gaps. Every non-null candidate field must be supported by claim-level source evidence; otherwise use null. Never claim that a candidate has been verified into MLAMH records, approved, or contacted.`;

class ResponsesMarketingProvider implements MarketingAIProvider {
  public readonly id: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(id: string, apiKey: string, model: string, baseUrl: string) {
    this.id = id;
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const leadResearch = request.taskType === "lead_enrichment";
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

    if (leadResearch) {
      input.unshift({
        type: "message",
        role: "developer",
        content: LEAD_RESEARCH_GUIDANCE,
      });
    }

    const baseBody: Record<string, unknown> = {
      input,
      store: false,
    };
    if (leadResearch) baseBody.tools = [{ type: "web_search" }];

    const executeRequest = async (model: string, providerOptions?: ExpiredFreeModelFallback["providerOptions"]) => {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "http-referer": "https://mlamh.net",
          "x-title": "MLAMH Marketing Hub",
        },
        body: JSON.stringify({
          ...baseBody,
          model,
          ...(providerOptions ? { providerOptions } : {}),
        }),
        cache: "no-store",
      });

      let payload: ResponsesPayload;
      try {
        payload = (await response.json()) as ResponsesPayload;
      } catch {
        throw new Error(`[MarketingAI.${this.id}] Invalid JSON response (HTTP ${response.status}).`);
      }
      return { response, payload };
    };

    let activeModel = this.model;
    let fallbackFromExpiredFree = false;
    let freeOnlyFallback = false;
    let { response, payload } = await executeRequest(activeModel);

    if (!response.ok && this.id === "vercel-ai-gateway") {
      const message = payload.error?.message || `AI request failed with HTTP ${response.status}.`;
      const fallback = expiredFreeModelFallback(activeModel, message);
      if (fallback && fallback.model !== activeModel) {
        activeModel = fallback.model;
        fallbackFromExpiredFree = true;
        freeOnlyFallback = true;
        ({ response, payload } = await executeRequest(activeModel, fallback.providerOptions));
      }
    }

    if (!response.ok) {
      const message = payload.error?.message || `AI request failed with HTTP ${response.status}.`;
      throw new Error(`[MarketingAI.${this.id}] ${message}`);
    }

    let outputText = payload.output_text?.trim() ||
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

    const webSources = leadResearch ? uniqueWebSources(payload) : [];
    if (leadResearch && request.responseFormat === "json") {
      outputText = attachResearchSources(outputText, webSources);
    }

    const usage: Record<string, number> = {};
    if (typeof payload.usage?.input_tokens === "number") usage.input_tokens = payload.usage.input_tokens;
    if (typeof payload.usage?.output_tokens === "number") usage.output_tokens = payload.usage.output_tokens;
    if (typeof payload.usage?.total_tokens === "number") usage.total_tokens = payload.usage.total_tokens;

    return {
      content: outputText,
      model: payload.model || activeModel,
      provider: this.id,
      usage,
      metadata: {
        ...(request.metadata ?? {}),
        ...(fallbackFromExpiredFree ? {
          expired_free_model_fallback: true,
          requested_model: this.model,
          fallback_model: activeModel,
          free_only_fallback: freeOnlyFallback,
          gateway_requirements: ["free"],
        } : {}),
        ...(leadResearch ? {
          web_search_used: true,
          web_source_count: webSources.length,
          research_strategy: "entity_resolution_then_decision_maker_v1",
        } : {}),
      },
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
