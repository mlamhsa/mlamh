import { gateway, generateText, isStepCount } from "ai";
import {
  getMarketingAIProvider,
  registerMarketingAIProvider,
  type MarketingAIProvider,
  type MarketingAIRequest,
  type MarketingAIResponse,
} from "@/lib/marketing/ai/provider";

const INVESTOR_WORKFLOW = "investor_discovery_v1";
const INVESTOR_MODELS = ["poolside/laguna-s-2.1-free", "inclusionai/ling-3.0-flash-vl-free"] as const;
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

type WebSource = { url: string; title?: string };

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

function requestPrompt(request: MarketingAIRequest, schema: object) {
  const transcript = request.messages
    .map((message) => `[${message.role.toUpperCase()}]\n${message.content}`)
    .join("\n\n");

  return [
    transcript,
    "",
    "Use the web-search results from the required search tool as the ONLY evidence source.",
    "Do not add a URL unless it appeared in the search tool results.",
    "After search completes, return one raw JSON object only. No Markdown or explanation.",
    "The JSON must conform to this schema:",
    JSON.stringify(schema),
  ].join("\n");
}

function researchInstruction() {
  return [
    "You are the MLAMH Investor Relations research engine.",
    "The first step MUST search the public web using the provided Perplexity Search tool.",
    "Search current professional/business evidence only.",
    "Never invent firms, people, emails, URLs, roles, investment claims or cheque sizes.",
    "Geography is restricted to Saudi Arabia first, UAE second, then Qatar, Kuwait, Bahrain and Oman only.",
    "For organizations, verify the official website and look for a published business email, official Contact/Apply/Pitch route, or a verified decision-maker LinkedIn /in/ profile.",
    "For individual investors, require a public professional LinkedIn /in/ profile plus evidence of actual startup investing.",
    "Public business emails must be explicitly published. Never infer an email pattern.",
    "Return fewer verified results rather than speculative results.",
    "The final JSON may reference only URLs returned by the search tool.",
  ].join("\n");
}

function extractSearchSources(toolResults: ReadonlyArray<unknown>) {
  const found = new Map<string, WebSource>();

  for (const rawResult of toolResults) {
    if (!rawResult || typeof rawResult !== "object") continue;
    const result = rawResult as Record<string, unknown>;
    if (result.toolName !== "perplexity_search") continue;

    const output = result.output;
    if (!output || typeof output !== "object" || Array.isArray(output)) continue;
    const rows = (output as Record<string, unknown>).results;
    if (!Array.isArray(rows)) continue;

    for (const rawRow of rows) {
      if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) continue;
      const row = rawRow as Record<string, unknown>;
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!/^https?:\/\//i.test(url) || found.has(url)) continue;
      const title = typeof row.title === "string" ? row.title.trim() : "";
      found.set(url, { url, ...(title ? { title } : {}) });
    }
  }

  return [...found.values()].slice(0, 60);
}

function usageTotal(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const total = (value as Record<string, unknown>).total;
  return typeof total === "number" && Number.isFinite(total) ? total : undefined;
}


async function runInvestorResearch(model: (typeof INVESTOR_MODELS)[number], request: MarketingAIRequest, schema: object) {
  return generateText({
    model,
    instructions: researchInstruction(),
    prompt: requestPrompt(request, schema),
    maxOutputTokens: 7000,
    tools: {
      perplexity_search: gateway.tools.perplexitySearch({
        maxResults: 20,
        maxTokensPerPage: 1800,
        maxTokens: 30000,
        searchLanguageFilter: ["en", "ar"],
      }),
    },
    prepareStep: ({ stepNumber }) => ({
      toolChoice:
        stepNumber === 0
          ? { type: "tool", toolName: "perplexity_search" as const }
          : "none",
    }),
    stopWhen: isStepCount(2),
  });
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

    let result: Awaited<ReturnType<typeof runInvestorResearch>> | null = null;
    let selectedModel: (typeof INVESTOR_MODELS)[number] = INVESTOR_MODELS[0];
    let lastError: unknown = null;

    for (const model of INVESTOR_MODELS) {
      try {
        result = await runInvestorResearch(model, request, schema);
        selectedModel = model;
        break;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const rateLimited = /rate.?limit|free tier requests on this model/i.test(message);
        if (!rateLimited || model === INVESTOR_MODELS[INVESTOR_MODELS.length - 1]) throw error;
      }
    }

    if (!result) {
      throw lastError instanceof Error ? lastError : new Error("[InvestorStructuredAI] No research model was available.");
    }

    const webSources = extractSearchSources(result.toolResults as ReadonlyArray<unknown>);
    if (!webSources.length) {
      throw new Error("[InvestorStructuredAI] Perplexity Search returned no verifiable web sources.");
    }

    const rawText = result.text.trim();
    if (!rawText) {
      throw new Error("[InvestorStructuredAI] Research model returned no structured output.");
    }

    const text = cleanJsonText(rawText);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const finalContent = JSON.stringify({ ...parsed, web_sources: webSources });

    const usageRecord = result.usage as unknown as Record<string, unknown>;
    const usage: Record<string, number> = {};
    const inputTokens = usageTotal(usageRecord.inputTokens);
    const outputTokens = usageTotal(usageRecord.outputTokens);
    const totalTokens =
      typeof usageRecord.totalTokens === "number" && Number.isFinite(usageRecord.totalTokens)
        ? usageRecord.totalTokens
        : undefined;
    if (inputTokens !== undefined) usage.input_tokens = inputTokens;
    if (outputTokens !== undefined) usage.output_tokens = outputTokens;
    if (totalTokens !== undefined) usage.total_tokens = totalTokens;

    return {
      content: finalContent,
      model: selectedModel,
      provider: this.id,
      usage,
      metadata: {
        ...(request.metadata ?? {}),
        structured_output: true,
        web_search_used: true,
        research_stack: "ai_sdk_v7_free_model_fallback_perplexity_search_v1",
        research_model: selectedModel,
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
