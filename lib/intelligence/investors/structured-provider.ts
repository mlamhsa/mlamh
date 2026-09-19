import {
  getMarketingAIProvider,
  registerMarketingAIProvider,
  type MarketingAIProvider,
  type MarketingAIRequest,
  type MarketingAIResponse,
} from "@/lib/marketing/ai/provider";

const INVESTOR_WORKFLOW = "investor_discovery_v1";
const INVESTOR_MODEL = "perplexity/sonar";
const GATEWAY_CHAT_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
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

type ChatPayload = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  citations?: string[] | null;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string } | string;
};

type WebSource = { url: string };

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

function extractWebSources(payload: ChatPayload) {
  const found = new Set<string>();
  for (const value of payload.citations ?? []) {
    const url = typeof value === "string" ? value.trim() : "";
    if (/^https?:\/\//i.test(url)) found.add(url);
  }
  return [...found].slice(0, 40).map((url) => ({ url }));
}

function researchInstruction() {
  return [
    "You are the MLAMH Investor Relations research engine.",
    "Use your built-in live web search for current public investor evidence.",
    "Never invent firms, people, emails, URLs, roles, investment claims or cheque sizes.",
    "Geography is restricted to Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only.",
    "For organizations, verify the official website and identify a public business email, official Contact/Apply/Pitch route, or a verified decision-maker LinkedIn /in/ profile when possible.",
    "For individual investors, require a public professional LinkedIn /in/ profile plus evidence of actual startup investing.",
    "Public business emails must be explicitly published. Never infer an email pattern.",
    "Return fewer verified results rather than speculative results.",
    "Every source URL in the JSON must correspond to a source found by live web search.",
  ].join("\n");
}

class InvestorStructuredProvider implements MarketingAIProvider {
  readonly id: string;

  constructor(private readonly base: MarketingAIProvider) {
    this.id = base.id;
  }

  async generate(request: MarketingAIRequest): Promise<MarketingAIResponse> {
    const investorResearch =
      request.taskType === "lead_enrichment" &&
      request.metadata?.workflow === INVESTOR_WORKFLOW &&
      request.responseFormat === "json";

    if (!investorResearch) return this.base.generate(request);

    const phase = request.metadata?.phase === "contact_enrichment_v1" ? "contact_enrichment" : "discovery";
    const schema = phase === "contact_enrichment" ? enrichmentSchema : discoverySchema;
    const schemaName = phase === "contact_enrichment" ? "investor_contact_enrichment" : "investor_discovery";

    const messages = [
      { role: "system", content: researchInstruction() },
      ...request.messages.map((message) => ({
        role: message.role === "system" ? "system" : message.role,
        content: message.content,
      })),
    ];

    const response = await fetch(GATEWAY_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayToken()}`,
        "Content-Type": "application/json",
        "http-referer": "https://mlamh.net",
        "x-title": "MLAMH Investor Relations AI",
      },
      body: JSON.stringify({
        model: INVESTOR_MODEL,
        messages,
        stream: false,
        temperature: 0,
        max_tokens: 7000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
      cache: "no-store",
    });

    let payload: ChatPayload;
    try {
      payload = (await response.json()) as ChatPayload;
    } catch {
      throw new Error(`[InvestorStructuredAI] Invalid provider response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const message = typeof payload.error === "string" ? payload.error : payload.error?.message;
      throw new Error(`[InvestorStructuredAI] ${message || `HTTP ${response.status}`}`);
    }

    const rawText = payload.choices?.[0]?.message?.content?.trim() || "";
    if (!rawText) throw new Error("[InvestorStructuredAI] Sonar returned no research output.");

    const webSources = extractWebSources(payload);
    if (!webSources.length) {
      throw new Error("[InvestorStructuredAI] Sonar returned no verifiable web citations.");
    }

    const text = cleanJsonText(rawText);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const finalContent = JSON.stringify({ ...parsed, web_sources: webSources });

    const usage: Record<string, number> = {};
    if (typeof payload.usage?.prompt_tokens === "number") usage.input_tokens = payload.usage.prompt_tokens;
    if (typeof payload.usage?.completion_tokens === "number") usage.output_tokens = payload.usage.completion_tokens;
    if (typeof payload.usage?.total_tokens === "number") usage.total_tokens = payload.usage.total_tokens;

    return {
      content: finalContent,
      model: payload.model || INVESTOR_MODEL,
      provider: this.id,
      usage,
      metadata: {
        ...(request.metadata ?? {}),
        structured_output: true,
        web_search_used: true,
        research_stack: "perplexity_sonar_chat_completions_v1",
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
