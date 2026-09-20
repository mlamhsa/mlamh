import { NextResponse } from "next/server";

import { getRequestUser } from "@/lib/auth/request-user";
import {
  updatePublisherApplicationStatus,
  type PublisherApplicationStatus,
} from "@/lib/applications/publisher-application-status-service";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";

type RouteContext = { params: Promise<{ id: string }> };
type Payload = { status?: "accepted" | "rejected" };

function fail(code: string, status: number, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function mapError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  if (message === "Profile not found." || message === "Publisher account not found.") {
    return fail("PUBLISHER_NOT_FOUND", 404, message);
  }
  if (
    message === "Publisher access required." ||
    message === "Publisher account is not approved." ||
    message === "Publisher account is not active." ||
    message === "Access denied."
  ) {
    return fail("FORBIDDEN", 403, message);
  }
  if (message === "Application not found." || message === "Opportunity not found.") {
    return fail("NOT_FOUND", 404, message);
  }
  if (message.startsWith("Invalid status transition:")) {
    return fail("INVALID_TRANSITION", 409, message);
  }
  if (message.includes("Talent role does not match")) {
    return fail("ROLE_MISMATCH", 409, message);
  }
  if (message.includes("changed before the update could complete")) {
    return fail("CONCURRENT_UPDATE", 409, message);
  }
  console.error("[mobile publisher application status]", error);
  return fail("UPDATE_FAILED", 500, "Unable to update application status.");
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await getRequestUser(request);
  if (!auth.ok) return fail("UNAUTHENTICATED", 401, "Authentication required.");

  const { id } = await context.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return fail("INVALID_APPLICATION_ID", 400, "Invalid application ID.");
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return fail("INVALID_BODY", 400, "Invalid request body.");
  }

  if (payload.status !== "accepted" && payload.status !== "rejected") {
    return fail("INVALID_STATUS", 400, "Status must be accepted or rejected.");
  }

  try {
    const rate = await consumeServerRateLimit({
      namespace: "mobile-publisher-application-status",
      identifier: `${auth.user.id}:${applicationId}`,
      limit: 8,
      windowSeconds: 600,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED" },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    console.error("[mobile publisher application status rate-limit]", error);
    return fail("RATE_LIMIT_UNAVAILABLE", 503, "Please try again shortly.");
  }

  try {
    const result = await updatePublisherApplicationStatus({
      userId: auth.user.id,
      applicationId,
      status: payload.status as PublisherApplicationStatus,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return mapError(error);
  }
}
