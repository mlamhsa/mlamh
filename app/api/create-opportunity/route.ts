import { NextResponse } from "next/server";

import { createOpportunityAction } from "@/lib/actions/create-opportunity";
import { consumeServerRateLimit } from "@/lib/security/server-rate-limit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CREATE_OPPORTUNITY_LIMIT = 20;
const CREATE_OPPORTUNITY_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthenticated" },
      { status: 401 },
    );
  }

  try {
    const rateLimit = await consumeServerRateLimit({
      namespace: "create-opportunity",
      identifier: user.id,
      limit: CREATE_OPPORTUNITY_LIMIT,
      windowSeconds: CREATE_OPPORTUNITY_WINDOW_SECONDS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many opportunity creation attempts" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(1, rateLimit.retryAfterSeconds)),
          },
        },
      );
    }
  } catch (error) {
    console.error("[create-opportunity:rate-limit]", error);
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    const result = await createOpportunityAction({
      locale: typeof body.locale === "string" ? body.locale : undefined,
      posting_mode:
        body.posting_mode === "quick" || body.posting_mode === "project"
          ? body.posting_mode
          : undefined,
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : "",
      city: typeof body.city === "string" ? body.city : "",
      required_gender:
        typeof body.required_gender === "string" ? body.required_gender : "",
      min_age: body.min_age as string | number | null | undefined,
      max_age: body.max_age as string | number | null | undefined,
      compensation_type:
        body.compensation_type === "fixed" ||
        body.compensation_type === "negotiable" ||
        body.compensation_type === "unpaid"
          ? body.compensation_type
          : null,
      budget: body.budget as string | number | null | undefined,
      opportunity_type:
        typeof body.opportunity_type === "string" ? body.opportunity_type : null,
      application_days:
        body.application_days as string | number | null | undefined,
      required_count:
        body.required_count as string | number | null | undefined,
      work_date: typeof body.work_date === "string" ? body.work_date : null,
      work_time: typeof body.work_time === "string" ? body.work_time : null,
      work_duration:
        typeof body.work_duration === "string" ? body.work_duration : null,
      role_requirements:
        body.role_requirements &&
        typeof body.role_requirements === "object" &&
        !Array.isArray(body.role_requirements)
          ? (body.role_requirements as Record<string, unknown>)
          : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[create-opportunity]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create opportunity",
      },
      { status: 500 },
    );
  }
}
