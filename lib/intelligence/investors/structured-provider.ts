import {
  getMarketingAIProvider,
  registerMarketingAIProvider,
  type MarketingAIProvider,
  type MarketingAIRequest,
  type MarketingAIResponse,
} from "@/lib/marketing/ai/provider";

type Annotation = { url?: string; title?: string };
type ResponsesPayload = {
  model?: string;
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string; annotations?: Annotation[] }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  error?: { message?: string };
};

const INVESTOR_WORKFLOW = "investor_discovery_v1";
let installed = false;

function nullableString() {
  return { type: ["string", "null"] } as const;
}
function nullableNumber() {
  return { type: ["number", "null"] } as const;
}

const discoverySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    investors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          organization_name: { type: "string" },
          organization_type: { type: "string", enum: ["vc", "angel", "family_office", "corporate_vc", "strategic", "accelerator", "government", "other"] },
          website_url: nullableString(),
          company_profile_url: nullableString(),
          country_code: nullableString(),
          city: nullableString(),
          investment_stage: { type: "array", items: { type: "string" } },
          sector_focus: { type: "array", items: { type: "string" } },
          geography_focus: { type: "array", items: { type: "string" } },
          cheque_min: nullableNumber(),
          cheque_max: nullableNumber(),
          cheque_currency: nullableString(),
          thesis_summary: { type: "string" },
          fit_score: { type: "number" },
          fit_rationale: { type: "string" },
          contact_name: nullableString(),
          contact_role: nullableString(),
          contact_profile_url: nullableString(),
          source_urls: { type: "array", items: { type: "string" } },
        },
        required: ["organization_name", "organization_type", "website_url", "company_profile_url", "country_code", "city", "investment_stage", "sector_focus", "geography_focus", "cheque_min", "cheque_max", "cheque_currency", "thesis_summary", "fit_score", "fit_rationale", "contact_name", "contact_role", "contact_profile_url", "source_urls"],
      },
    },
  },
  required: ["investors"],
} as const;

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enrichments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          lead_id: { type: "number" },
          website_url: nullableString(),
          contact_email: nullableString(),
          contact_name: nullableString(),
          contact_role: nullableString(),
          contact_profile_url: nullableString(),
          contact_route_url: nullableString(),
          contact_route_type: { type: ["string", "null"], enum: ["email", "application_form", "contact_form", "linkedin", "website", null] },
          source_evidence: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                url: { type: "string" },
                supports: { type: "array", items: { type: "string" } },
                claim: { type: "string" },
              },
              required: ["url", "supports", "claim"],
            },
          },
        },
        required: ["lead_id", "website_url", "contact_email", "contact_name", "contact_role", "contact_profile_url", "contact_route_url", "contact_route_type", "source_evidence"],
      },
    },
  },
  required: ["enrichments"],
} as const;

function config() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || "";
  const openAIKey = process.env.OPENAI_API_KEY?.trim() || "";
  const requested = process.env.MARKETING_AI_MODEL?.trim() || "gpt-5.6-luna";
  if (gatewayKey) {
    return {
      key: gatewayKey,
      baseUrl: "https://ai-gateway.vercel.sh/v1",
      model: requested.includes("/") ? requested : `openai/${requested}`,
    };
  }
  if (openAIKey) {
    return {
      key: openAIKey,
      baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: requested.startsWith("openai/") ? requested.slice("openai/".length) : requested,
    };
  }
  throw new Error("Investor structured research provider is not configured.");
}

function sources(payload: ResponsesPayload) {
  const found = new Map<string, { url: string; title?: string }>();
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      for (const annotation of part.annotations ?? []) {
        const url = typeof annotation.url === "string" ? annotation.url.trim() : "";
        if (!/^https?:\/\//i.test(url)) continue;
        if (!found.has(url)) found.set(url, { url, ...(annotation.title?.trim() ? { title: annotation.title.trim() } : {}) });
      }
    }
  }
  return [...found.values()].slice(0, 40);
}

function outputText(payload: ResponsesPayload) {
  return payload.output_text?.trim() || payload.output
    ?.flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n") || "";
}

class InvestorStructuredProvider implements MarketingAIProvider {
  readonly id: string;
  constructor(private readonly base: MarketingAIProvider) {
    this.id = base.id;
  }

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const investorResearch = request.taskType === "lead_enrichment" && request.metadata?.workflow === INVESTOR_WORKFLOW && request.responseFormat === "json";
    if (!investorResearch) return this.base.generate(request);

    const settings = config();
    const phase = request.metadata?.phase === "contact_enrichment_v1" ? "contact_enrichment" : "discovery";
    const schema = phase === "contact_enrichment" ? enrichmentSchema : discoverySchema;
    const input = [
      {
        type: "message",
        role: "developer",
        content: "Use web search for current public investor evidence. Never invent firms, people, emails, URLs, roles or investment claims. Return only schema-compliant data. Use only Saudi Arabia, UAE, Qatar, Kuwait, Bahrain and Oman, prioritizing Saudi Arabia then UAE. Public business emails must be explicitly published. Personal professional profiles must be public LinkedIn /in/ pages. Prefer fewer verified results over speculation.",
      },
      ...request.messages.map((message) => ({
        type: "message",
        role: message.role === "system" ? "developer" : message.role,
        content: message.content,
      })),
    ];

    const response = await fetch(`${settings.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.key}`,
        "Content-Type": "application/json",
        "http-referer": "https://mlamh.net",
        "x-title": "MLAMH Investor Relations AI",
      },
      body: JSON.stringify({
        model: settings.model,
        store: false,
        input,
        tools: [{ type: "web_search" }],
        text: {
          format: {
            type: "json_schema",
            name: phase === "contact_enrichment" ? "investor_contact_enrichment" : "investor_discovery",
            strict: true,
            schema,
          },
        },
      }),
      cache: "no-store",
    });

    let payload: ResponsesPayload;
    try {
      payload = await response.json() as ResponsesPayload;
    } catch {
      throw new Error(`[InvestorStructuredAI] Invalid provider response (HTTP ${response.status}).`);
    }
    if (!response.ok) throw new Error(`[InvestorStructuredAI] ${payload.error?.message || `HTTP ${response.status}`}`);

    const text = outputText(payload);
    if (!text) throw new Error("[InvestorStructuredAI] The model returned no structured output.");
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("Investor research returned invalid JSON.");
    }
    const webSources = sources(payload);
    const content = JSON.stringify({ ...parsed, web_sources: webSources });
    const usage: Record<string, number> = {};
    if (typeof payload.usage?.input_tokens === "number") usage.input_tokens = payload.usage.input_tokens;
    if (typeof payload.usage?.output_tokens === "number") usage.output_tokens = payload.usage.output_tokens;
    if (typeof payload.usage?.total_tokens === "number") usage.total_tokens = payload.usage.total_tokens;

    return {
      content,
      model: payload.model || settings.model,
      provider: this.id,
      usage,
      metadata: {
        ...(request.metadata ?? {}),
        structured_output: true,
        web_search_used: true,
        web_source_count: webSources.length,
        web_sources: webSources,
      },
    };
  }
}

export function ensureInvestorStructuredProvider() {
  if (installed) return;
  const base = getMarketingAIProvider();
  registerMarketingAIProvider(new InvestorStructuredProvider(base));
  installed = true;
}
