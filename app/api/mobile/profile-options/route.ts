import { NextResponse } from "next/server";

import { NATIONALITIES } from "@/lib/data/nationalities";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";

export async function GET() {
  return NextResponse.json({
    cities: SAUDI_CITIES.map(({ slug, ar, en }) => ({ value: slug, ar, en })),
    nationalities: NATIONALITIES.map(({ slug, ar, en, code }) => ({ value: slug, ar, en, code })),
  });
}
