import test from "node:test";
import assert from "node:assert/strict";

process.env.AI_GATEWAY_API_KEY = "qa-gateway-key";
delete process.env.VERCEL_OIDC_TOKEN;
delete process.env.OPENAI_API_KEY;
delete process.env.MARKETING_AI_DISABLED;
delete process.env.MARKETING_AI_MODEL;

const { getMarketingAIConfigurationState, getMarketingAIProvider } = await import("./provider.ts");

const originalFetch = globalThis.fetch;

test.after(() => {
  globalThis.fetch = originalFetch;
  delete process.env.AI_GATEWAY_API_KEY;
});

test("lead enrichment uses Vercel AI Gateway Responses API with web search and preserves source evidence", async () => {
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(JSON.stringify({
      model: "openai/gpt-5.6-luna",
      output_text: JSON.stringify({
        lead_research: [{
          lead_id: 10,
          readiness_status: "ready_for_review",
          candidate_contact: {
            name: "Test Contact",
            role: "Marketing Director",
            public_business_email: null,
            public_linkedin_url: "https://www.linkedin.com/in/test-contact",
            company_website: "https://example.com",
          },
          source_evidence: [{ url: "https://example.com/team", title: "Team", claim: "Role" }],
          confidence: 0.9,
          missing_fields: [],
          remaining_gaps: [],
        }],
      }),
      output: [{
        type: "message",
        content: [{
          type: "output_text",
          text: "ignored because output_text is present",
          annotations: [
            { type: "url_citation", url: "https://example.com/team", title: "Team" },
            { type: "url_citation", url: "https://example.com/team", title: "Duplicate" },
          ],
        }],
      }],
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const config = getMarketingAIConfigurationState();
  assert.deepEqual(config, {
    configured: true,
    disabled: false,
    provider: "vercel-ai-gateway",
    authMode: "gateway_api_key",
    model: "openai/gpt-5.6-luna",
    reason: null,
  });

  const response = await getMarketingAIProvider().generate({
    taskType: "lead_enrichment",
    responseFormat: "json",
    messages: [{ role: "user", content: "Research lead 10." }],
  });

  assert.equal(capturedUrl, "https://ai-gateway.vercel.sh/v1/responses");
  assert.equal(capturedInit?.method, "POST");
  assert.equal((capturedInit?.headers as Record<string, string>).Authorization, "Bearer qa-gateway-key");

  const body = JSON.parse(String(capturedInit?.body)) as {
    model: string;
    store: boolean;
    tools?: Array<{ type: string }>;
    input: Array<{ role: string; content: string }>;
  };
  assert.equal(body.model, "openai/gpt-5.6-luna");
  assert.equal(body.store, false);
  assert.deepEqual(body.tools, [{ type: "web_search" }]);
  assert.equal(body.input[0]?.role, "developer");
  assert.match(body.input[0]?.content ?? "", /publicly available professional\/business contact information/i);
  assert.equal(body.input[1]?.role, "developer");
  assert.match(body.input[1]?.content ?? "", /Return valid JSON only/i);

  const parsed = JSON.parse(response.content) as { web_sources?: Array<{ url: string; title?: string }> };
  assert.deepEqual(parsed.web_sources, [{ url: "https://example.com/team", title: "Team" }]);
  assert.equal(response.provider, "vercel-ai-gateway");
  assert.equal(response.metadata?.web_search_used, true);
  assert.equal(response.metadata?.web_source_count, 1);
  assert.deepEqual(response.usage, { input_tokens: 10, output_tokens: 20, total_tokens: 30 });
});

test("lead enrichment fails closed when the gateway rejects the request", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { message: "gateway unavailable" },
  }), { status: 503, headers: { "content-type": "application/json" } });

  await assert.rejects(
    () => getMarketingAIProvider().generate({
      taskType: "lead_enrichment",
      responseFormat: "json",
      messages: [{ role: "user", content: "Research lead 10." }],
    }),
    /\[MarketingAI\.vercel-ai-gateway\] gateway unavailable/,
  );
});
