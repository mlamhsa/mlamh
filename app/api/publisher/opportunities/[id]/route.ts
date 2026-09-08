import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getPublisherOpportunityDetail, updatePublisherApplicationStatus } from "@/lib/publishers/mobile-opportunity-detail";
import { manageMobilePublisherOpportunity } from "@/lib/publishers/mobile-opportunity-manage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await context.params;
  const opportunityId = Number(id);
  const locale = new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ar";
  const detail = await getPublisherOpportunityDetail(auth.user.id, opportunityId, locale);
  if (!detail) return NextResponse.json({ ok: false, code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, ...detail });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return NextResponse.json({ ok: false, code: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await context.params;
  const opportunityId = Number(id);
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) return NextResponse.json({ ok: false, code: "INVALID_OPPORTUNITY" }, { status: 400 });

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }

  if (typeof body.action === "string") {
    const result = await manageMobilePublisherOpportunity(auth.user.id, opportunityId, body);
    if (!result.ok) {
      const status = result.code === "FORBIDDEN" ? 403 : result.code === "NOT_FOUND" ? 404 : result.code === "LOOKUP_FAILED" || result.code === "UPDATE_FAILED" ? 500 : 409;
      return NextResponse.json(result, { status });
    }
    return NextResponse.json(result);
  }

  const applicationId = Number(body.applicationId);
  if (!Number.isInteger(applicationId) || applicationId <= 0) return NextResponse.json({ ok: false, code: "INVALID_APPLICATION" }, { status: 400 });
  const result = await updatePublisherApplicationStatus(auth.user.id, opportunityId, applicationId, body.status);
  if (!result.ok) {
    const status = result.code === "FORBIDDEN" ? 403 : result.code.includes("NOT_FOUND") ? 404 : result.code === "UPDATE_FAILED" || result.code === "CONVERSATION_FAILED" ? 500 : 409;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
