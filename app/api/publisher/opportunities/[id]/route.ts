import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import { getPublisherOpportunityDetail, updatePublisherApplicationStatus } from "@/lib/publishers/mobile-opportunity-detail";

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
  let body: { applicationId?: unknown; status?: unknown } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 }); }
  const applicationId = Number(body.applicationId);
  if (!Number.isInteger(applicationId) || applicationId <= 0) return NextResponse.json({ ok: false, code: "INVALID_APPLICATION" }, { status: 400 });
  const result = await updatePublisherApplicationStatus(auth.user.id, opportunityId, applicationId, body.status);
  if (!result.ok) {
    const status = result.code === "FORBIDDEN" ? 403 : result.code.includes("NOT_FOUND") ? 404 : result.code === "UPDATE_FAILED" || result.code === "CONVERSATION_FAILED" ? 500 : 409;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
