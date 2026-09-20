import { NextResponse } from "next/server";

const BUNDLE_ID = "net.mlamh.app";
const VERIFIED_APPLE_TEAM_ID = "ATJ4SFSJZZ";
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
  "/ar/talent",
  "/ar/talent/*",
  "/ar/talents",
  "/ar/talents/*",
  "/en/talent",
  "/en/talent/*",
  "/en/talents",
  "/en/talents/*",
  "/messages/*",
  "/conversations/*",
  "/applications",
  "/ar/applications",
  "/en/applications",
  "/casting",
  "/casting/*",
  "/ar/casting",
  "/ar/casting/*",
  "/en/casting",
  "/en/casting/*",
  "/scene",
  "/scene/*",
  "/ar/scene",
  "/ar/scene/*",
  "/en/scene",
  "/en/scene/*",
];

export const dynamic = "force-dynamic";

export async function GET() {
  const configuredTeamId = (
    process.env.MLAMH_APPLE_TEAM_ID?.trim() || process.env.APPLE_TEAM_ID?.trim()
  );
  const teamId = configuredTeamId && /^[A-Z0-9]{10}$/.test(configuredTeamId)
    ? configuredTeamId
    : VERIFIED_APPLE_TEAM_ID;

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
