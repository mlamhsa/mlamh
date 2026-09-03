import { NextResponse } from "next/server";

import type { ApplyOpportunityResult } from "@/lib/applications/apply-contract";
import { isValidOpportunityId } from "@/lib/applications/apply-rules";
import { applyToOpportunity } from "@/lib/applications/apply-service";
import { getRequestUser } from "@/lib/auth/request-user";

function getFailureStatus(result: Extract<ApplyOpportunityResult, { ok: false }>) {
  switch (result.code) {
    case "INVALID_OPPORTUNITY":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "ACCOUNT_RESTRICTED":
    case "TALENT_NOT_APPROVED":
      return 403;
    case "NOT_TALENT":
    case "PROFILE_INCOMPLETE":
      return 422;
    case "OPPORTUNITY_NOT_AVAILABLE":
    case "APPLICATION_WINDOW_CLOSED":
      return 409;
    case "ALREADY_APPLIED":
      return 409;
    default:
      return 500;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const opportunityId = Number(id);

  if (!isValidOpportunityId(opportunityId)) {
    const result: ApplyOpportunityResult = {
      ok: false,
      code: "INVALID_OPPORTUNITY",
    };
    return NextResponse.json(result, { status: 400 });
  }

  const auth = await getRequestUser(request);
  if (!auth.ok) {
    const result: ApplyOpportunityResult = {
      ok: false,
      code: "UNAUTHENTICATED",
    };
    return NextResponse.json(result, { status: 401 });
  }

  const result = await applyToOpportunity({
    userId: auth.user.id,
    opportunityId,
  });

  if (!result.ok) {
    return NextResponse.json(result, {
      status: getFailureStatus(result),
    });
  }

  return NextResponse.json(result, { status: 201 });
}
