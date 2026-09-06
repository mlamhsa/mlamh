import { NextResponse } from "next/server";

import { getOpportunities } from "@/lib/api/opportunities";
import { isCountryCode } from "@/lib/markets/countries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedMarket = (url.searchParams.get("market") ?? "SA")
    .trim()
    .toUpperCase();
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  if (!isCountryCode(requestedMarket)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_MARKET",
          message: "Unsupported market code.",
        },
      },
      { status: 400 },
    );
  }

  const data = await getOpportunities({
    countryCode: requestedMarket,
    locale,
  });

  return NextResponse.json(data);
}
