import {
  getMarketingAIProvider,
  registerMarketingAIProvider,
  type MarketingAIProvider,
  type MarketingAIRequest,
  type MarketingAIResponse,
} from "@/lib/marketing/ai/provider";

const INVESTOR_WORKFLOW = "investor_discovery_v1";
const FREE_INVESTOR_MODEL = "poolside/laguna-s-2.1-free";
const GATEWAY_V4_URL = "https://ai-gateway.vercel.sh/v4/ai/language-model";
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

type GatewayContent = {
  type?: string;
  text?: string;
  result?: unknown;
  isError?: boolean;
};

type GatewayPayload = {
  content?: GatewayContent[] | GatewayContent;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string } | string;
};

type WebSource = { url: string; title?: string };

function gatewayToken() {
  const token = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || "";
  if (!token) throw new Error("[InvestorStructuredAI] Vercel AI Gateway is not configured.");
  return token;
}

function cleanJsonText(value: string) {
  let text = value.trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) text = fenced[1].trim();
  try {
    JSON.parse(text);
    return text;
  } catch {
    const firstObject = text.indexOf("{");
    const lastObject = text.lastIndexOf("}");
    if (firstObject >= 0 && lastObject > firstObject) {
      const candidate = text.slice(firstObject, lastObject + 1);
      JSON.parse(candidate);
      return candidate;
    }
    throw new Error("Investor research returned invalid JSON.");
  }
}

function normalizeContent(payload: GatewayPayload) {
  if (Array.isArray(payload.content)) return payload.content;
  return payload.content ? [payload.content] : [];
}

function collectUrls(value: unknown, found: Map<string, WebSource>) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, found);
    return;
  }
  const record = value as Record<string, unknown>;
  const url = typeof record.url === "string" ? record.url.trim() : "";
  if (/^https?:\/\//i.test(url) && !found.has(url)) {
    const title = typeof record.title === "string" ? record.title.trim() : "";
    found.set(url, { url, ...(title ? { title } : {}) });
  }
  const webpageUrl = typeof record.webpage_url === "string" ? record.webpage_url.trim() : "";
  if (/^https?:\/\//i.test(webpageUrl) && !found.has(webpageUrl)) {
    const title = typeof record.title === "string" ? record.title.trim() : "";
    found.set(webpageUrl, { url: webpageUrl, ...(title ? { title } : {}) });
  }
  for (const nested of Object.values(record)) collectUrls(nested, found);
}

function extractWebSources(content: GatewayContent[]) {
  const found = new Map<string, WebSource>();
  for (const item of content) {
    if (item.type !== "tool-result" || item.isError) continue;
    collectUrls(item.result, found);
  }
  return [...found.values()].slice(0, 40);
}

function extractText(content: GatewayContent[]) {
  return content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function buildPrompt(request: MarketingAIRequest) {
  const system = [
    "You are the MLAMH Investor Relations research engine.",
    "You MUST use the tako_search tool before returning investor data.",
    "Research only current public professional/business evidence.",
    "Never invent firms, people, emails, URLs, roles, investment claims or cheque sizes.",
    "Geography is restricted to Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only.",
    "For organizations, verify the official website and identify a public business email, official contact/apply/pitch route, or a verified decision-maker LinkedIn /in/ profile when possible.",
    "For individual investors, require a public professional LinkedIn /in/ profile plus evidence of actual startup investing.",
    "Public business emails must be explicitly published. Never infer an email pattern.",
    "Return fewer verified results rather than speculative results.",
    "Every URL placed in the output must be supported by the search results returned by the tool.",
  ].join(" ");

  const prompt: Array<Record<string, unknown>> = [{ role: "system", content: system }];
  for (const message of request.messages) {
    if (message.role === "system") {
      prompt.push({ role: "system", content: message.content });
    } else {
      prompt.push({
        role: message.role,
        content: [{ type: "text", text: message.content }],
      });
    }
  }
  return prompt;
}

class InvestorStructuredProvider implements MarketingAIProvider {
  readonly id: string;

  constructor(private readonly base: MarketingAIProvider) {
    this.id = base.id;
  }

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const investorResearch = request.taskType === "lead_enrichment" && request.metadata?.workflow === INVESTOR_WORKFLOW && request.responseFormat === "json";
    if (!investorResearch) return this.base.generate(request);

    const phase = request.metadata?.phase === "contact_enrichment_v1" ? "contact_enrichment" : "discovery";
    const schema = phase === "contact_enrichment" ? enrichmentSchema : discoverySchema;
    const response = await fetch(GATEWAY_V4_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayToken()}`,
        "Content-Type": "application/json",
        "ai-language-model-specification-version": "4",
        "ai-language-model-id": FREE_INVESTOR_MODEL,
        "ai-language-model-streaming": "false",
        "http-referer": "https://mlamh.net",
        "x-title": "MLAMH Investor Relations AI",
      },
      body: JSON.stringify({
        prompt: buildPrompt(request),
        maxOutputTokens: 7000,
        responseFormat: {
          type: "json",
          schema,
          name: phase === "contact_enrichment" ? "investor_contact_enrichment" : "investor_discovery",
          description: "Verified GCC investor research grounded only in Tako Search public web results.",
        },
        tools: [
          {
            type: "provider",
            id: "gateway.tako_search",
            name: "tako_search",
            args: {
              effort: "fast",
              sources: {
                web: {
                  count: 12,
                  include_contents: false,
                  highlights: true,
                  snippet_max_chars: 1400,
                },
              },
              locale: "en-SA",
              timezone: "Asia/Riyadh",
            },
          },
        ],
        toolChoice: "auto",
      }),
      cache: "no-store",
    });

    let payload: GatewayPayload;
    try {
      payload = await response.json() as GatewayPayload;
    } catch {
      throw new Error(`[InvestorStructuredAI] Invalid Gateway response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
      throw new Error(`[InvestorStructuredAI] ${message || `HTTP ${response.status}`}`);
    }

    const contentParts = normalizeContent(payload);
    const webSources = extractWebSources(contentParts);
    if (!webSources.length) {
      throw new Error("[InvestorStructuredAI] Research returned no verified Tako web sources.");
    }

    const rawText = extractText(contentParts);
    if (!rawText) throw new Error("[InvestorStructuredAI] The free research model returned no output.");
    const text = cleanJsonText(rawText);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const finalContent = JSON.stringify({ ...parsed, web_sources: webSources });

    const usage: Record<string, number> = {};
    const inputTokens = payload.usage?.input_tokens ?? payload.usage?.prompt_tokens;
    const outputTokens = payload.usage?.output_tokens ?? payload.usage?.completion_tokens;
    if (typeof inputTokens === "number") usage.input_tokens = inputTokens;
    if (typeof outputTokens === "number") usage.output_tokens = outputTokens;
    if (typeof payload.usage?.total_tokens === "number") usage.total_tokens = payload.usage.total_tokens;

    return {
      content: finalContent,
      model: payload.model || FREE_INVESTOR_MODEL,
      provider: this.id,
      usage,
      metadata: {
        ...(request.metadata ?? {}),
        structured_output: true,
        web_search_used: true,
        research_stack: "gateway_v4_laguna_free_tako_v1",
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
