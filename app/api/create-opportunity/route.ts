import { NextResponse } from "next/server";
import { createOpportunityAction } from "@/lib/actions/create-opportunity";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await createOpportunityAction({
      locale: body.locale,
      title: body.title,
      description: body.description,
      city: body.city,
      required_gender: body.gender,
      min_age: body.min_age,
      max_age: body.max_age,
      budget: body.budget,
      opportunity_type: body.opportunity_type,
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
      { status: 500 }
    );
  }
}