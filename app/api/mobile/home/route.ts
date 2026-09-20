import { NextResponse } from "next/server";

import { HomepageCMS } from "@/lib/cms/HomepageCMS";
import { ValuePropsCMS } from "@/lib/cms/ValuePropsCMS";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    const [hero, valueProps] = await Promise.all([
      HomepageCMS.getPublicHero(locale),
      ValuePropsCMS.getPublicValueProps(locale),
    ]);

    return NextResponse.json({
      ok: true,
      hero,
      valueProps,
    });
  } catch (error) {
    console.error("[api/mobile/home]", error);
    return NextResponse.json(
      { ok: false, code: "MOBILE_HOME_FAILED" },
      { status: 500 },
    );
  }
}