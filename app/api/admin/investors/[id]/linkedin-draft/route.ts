import { NextResponse } from "next/server";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { getMarketingAIProvider } from "@/lib/marketing/ai/provider";
import { getInvestorRelationsSettings } from "@/lib/intelligence/investors/service";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseJson(content: string) {
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Try the next safe candidate.
    }
  }
  throw new Error("Investor AI returned invalid JSON.");
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requireAdminAccess();
  try {
    const { id } = await context.params;
    const investorId = Number(id);
    if (!Number.isInteger(investorId) || investorId <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid investor id." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: investor, error } = await db
      .from("investor_leads")
      .select("id,organization_name,organization_type,country_code,fit_rationale,thesis_summary,contact_name,contact_role,contact_linkedin_url,status")
      .eq("id", investorId)
      .maybeSingle();

    if (error || !investor) {
      return NextResponse.json({ ok: false, error: "Investor lead was not found." }, { status: 404 });
    }

    const linkedinUrl = typeof investor.contact_linkedin_url === "string" ? investor.contact_linkedin_url.trim() : "";
    if (!/^https:\/\/(?:[a-z]{2}\.)?linkedin\.com\/in\//i.test(linkedinUrl)) {
      return NextResponse.json({ ok: false, error: "A verified personal LinkedIn profile is required first." }, { status: 400 });
    }

    const contactName = typeof investor.contact_name === "string" ? investor.contact_name.trim() : "";
    const contactRole = typeof investor.contact_role === "string" ? investor.contact_role.trim() : "";
    if (!contactName || !contactRole) {
      return NextResponse.json({ ok: false, error: "A verified decision-maker name and role are required first." }, { status: 400 });
    }

    const settings = await getInvestorRelationsSettings();
    const provider = getMarketingAIProvider();
    const response = await provider.generate({
      taskType: "investor_linkedin_draft",
      responseFormat: "json",
      metadata: { workflow: "investor_linkedin_outreach_v1", investor_id: investorId },
      messages: [
        {
          role: "system",
          content: "Write a concise, professional first-contact LinkedIn message for MLAMH investor relations. Do not invent traction, revenue, users, funding amounts, partnerships or investor interest. Use only the supplied brief and verified investor record. Keep it natural, specific and low-pressure. Prefer 55-90 words. Choose Arabic only when the verified professional context clearly supports Arabic; otherwise use English. Return JSON only.",
        },
        {
          role: "user",
          content: `MLAMH master brief (Arabic):\n${settings.masterBriefAr}\n\nMLAMH master brief (English):\n${settings.masterBriefEn}\n\nVerified investor record:\n${JSON.stringify(investor, null, 2)}\n\nWrite a first LinkedIn message addressed to ${contactName}, ${contactRole}. Explain briefly why MLAMH may be relevant to their documented investment role or thesis without claiming prior interest. Do not include an email subject line. Return exactly:\n{\n  "message": ""\n}`,
        },
      ],
    });

    const parsed = asObject(parseJson(response.content));
    const draft = typeof parsed?.message === "string" ? parsed.message.trim().slice(0, 3000) : "";
    if (draft.length < 20) throw new Error("Investor AI returned an incomplete LinkedIn draft.");

    await db.from("investor_activity").insert({
      investor_id: investorId,
      action: "linkedin_draft_created",
      actor_type: "ai",
      summary: `LinkedIn draft prepared for ${contactName}.`,
      metadata: {
        channel: "linkedin",
        contact_name: contactName,
        contact_role: contactRole,
        linkedin_url: linkedinUrl,
        provider: response.provider,
        model: response.model ?? null,
      },
    });

    return NextResponse.json({ ok: true, draft, linkedinUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare LinkedIn outreach.";
    console.error("[InvestorRelations linkedin-draft]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
