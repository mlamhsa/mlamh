import { NextResponse } from "next/server";

import { isCountryCode } from "@/lib/markets/countries";
import { getPublicOpportunityByIdentifier } from "@/lib/opportunities/public-read";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const requestedMarket = (url.searchParams.get("market") ?? "SA")
    .trim()
    .toUpperCase();
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  if (!isCountryCode(requestedMarket)) {
    return NextResponse.json(
      { error: { code: "INVALID_MARKET", message: "Unsupported market code." } },
      { status: 400 },
    );
  }

  const item = await getPublicOpportunityByIdentifier({
    identifier: id,
    countryCode: requestedMarket,
    locale,
  });

  if (!item) {
    return NextResponse.json(
      { error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ item, market: requestedMarket, locale });
}
