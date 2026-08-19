import { NextResponse } from "next/server";

import { createOpportunityAction } from "@/lib/actions/create-opportunity";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createOpportunityAction({
      locale: body.locale,
      posting_mode: body.posting_mode,
    
      title: body.title,
      description: body.description,

      city: body.city,

      required_gender: body.required_gender,

      min_age: body.min_age,
      max_age: body.max_age,

      compensation_type: body.compensation_type,
      budget: body.budget,

      opportunity_type: body.opportunity_type,

      application_days: body.application_days,

      required_count: body.required_count,
work_date: body.work_date,
work_time: body.work_time,
work_duration: body.work_duration,

      role_requirements: body.role_requirements,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create opportunity",
      },
      {
        status: 500,
      },
    );
  }
}