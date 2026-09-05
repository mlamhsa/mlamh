import { NextResponse } from "next/server";

const BUNDLE_ID = "net.mlamh.app";
const LINK_PATHS = [
  "/opportunities",
  "/opportunities/*",
  "/ar/opportunities",
  "/ar/opportunities/*",
  "/en/opportunities",
  "/en/opportunities/*",
  "/talent",
  "/talent/*",
  "/talents",
  "/talents/*",
  "/ar/talent/*",
  "/ar/talents/*",
  "/en/talent/*",
  "/en/talents/*",
  "/messages/*",
  "/conversations/*",
  "/applications",
  "/notifications",
  "/publisher/*",
  "/profile*",
  "/casting*",
  "/ar/casting*",
  "/en/casting*",
  "/support",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/complaints",
  "/ar/privacy",
  "/ar/terms",
  "/ar/refund-policy",
  "/ar/complaints",
  "/en/privacy",
  "/en/terms",
  "/en/refund-policy",
  "/en/complaints",
  "/reset-password*",
  "/forgot-password*",
  "/ar/reset-password*",
  "/ar/forgot-password*",
  "/en/reset-password*",
  "/en/forgot-password*",
];

export const dynamic = "force-dynamic";

export async function GET() {
  const teamId = process.env.MLAMH_APPLE_TEAM_ID?.trim();
  if (!teamId || !/^[A-Z0-9]{10}$/.test(teamId)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${teamId}.${BUNDLE_ID}`,
            paths: LINK_PATHS,
          },
        ],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Content-Type": "application/json",
      },
    },
  );
}
