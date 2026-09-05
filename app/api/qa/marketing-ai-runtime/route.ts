import { NextResponse } from "next/server";

import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAllowedPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === "fix/marketing-hub-qa-batch";

  if (!isAllowedPreview) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const provider = getMarketingAIProvider();
    const result = await provider.generate({
      taskType: "lead_enrichment",
      responseFormat: "json",
      metadata: { qa_probe: true },
      messages: [
        {
          role: "user",
          content:
            "QA-only public business research probe. Research Vercel using only public professional/business sources. Return one lead_research item for lead_id qa-vercel. Do not contact anyone, do not infer private data, and do not write to any database.",
        },
      ],
    });

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      parsed = null;
    }

    const parsedRecord = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
    const webSources = Array.isArray(parsedRecord?.web_sources) ? parsedRecord.web_sources : [];

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model ?? null,
      web_search_used: result.metadata?.web_search_used === true,
      web_source_count: result.metadata?.web_source_count ?? webSources.length,
      has_json_result: parsedRecord !== null,
      has_web_sources: webSources.length > 0,
      database_write: false,
      external_send: false,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown runtime probe error",
        database_write: false,
        external_send: false,
      },
      { status: 500 },
    );
  }
}
