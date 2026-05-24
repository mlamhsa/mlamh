import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(
    "admin_auth",
    process.env.ADMIN_PASSWORD!,
    {
      httpOnly: true,
      secure: false,
      path: "/",
    },
  );

  return response;
}