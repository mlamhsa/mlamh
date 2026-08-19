import type { EmailOtpType } from "@supabase/supabase-js";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash =
    request.nextUrl.searchParams.get("token_hash");

  const type =
    request.nextUrl.searchParams.get(
      "type",
    ) as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase =
      await createServerSupabaseClient();

    const { data, error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    if (!error) {
      const locale =
        data.user?.user_metadata
          ?.preferred_locale === "en"
          ? "en"
          : "ar";

      return NextResponse.redirect(
        new URL(`/${locale}/join`, request.url),
      );
    }
  }

  return NextResponse.redirect(
    new URL(
      "/ar/login?message=verification_failed",
      request.url,
    ),
  );
}