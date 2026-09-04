import { NextResponse } from "next/server";

const BUNDLE_ID = "net.mlamh.app";
const LINK_PATHS = [
  "/opportunities/*",
  "/ar/opportunities/*",
  "/en/opportunities/*",
  "/messages/*",
  "/conversations/*",
  "/applications",
  "/notifications",
  "/publisher/*",
  "/profile*",
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
