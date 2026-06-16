import { NextResponse } from "next/server";
import { getOpportunities } from "@/lib/api/opportunities";

export async function GET() {
  const data = await getOpportunities();

  return NextResponse.json(data);
}