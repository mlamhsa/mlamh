import type { EmailOtpType } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

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

    if (!error && data.user) {
      const user = data.user;

      const metadata = user.user_metadata ?? {};

      const accountType =
        metadata.account_type === "publisher"
          ? "publisher"
          : "talent";

      const locale =
        metadata.preferred_locale === "en"
          ? "en"
          : "ar";

      const adminClient = createAdminClient();

      const { data: existingProfile } =
        await adminClient
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } =
          await adminClient
            .from("profiles")
            .insert({
              user_id: user.id,
              account_type: accountType,

              display_name:
                typeof metadata.display_name === "string"
                  ? metadata.display_name
                  : typeof metadata.full_name === "string"
                    ? metadata.full_name
                    : null,

              phone:
                typeof metadata.phone === "string"
                  ? metadata.phone
                  : null,

              status: "active",

              onboarding_status:
                "account_created",

              onboarding_step:
                accountType === "talent"
                  ? "talent_profile"
                  : "publisher_profile",

              approval_status:
                "not_submitted",
            });

        if (profileError) {
          console.error(
            "[auth.confirm] Profile creation failed:",
            {
              userId: user.id,
              message: profileError.message,
              code: profileError.code,
              details: profileError.details,
              hint: profileError.hint,
            },
          );

          return NextResponse.redirect(
            new URL(
              `/${locale}/login?message=profile_creation_failed`,
              request.url,
            ),
          );
        }
      }

      const onboardingPath =
        accountType === "talent"
          ? `/${locale}/join/talent`
          : `/${locale}/join/publisher`;

      return NextResponse.redirect(
        new URL(
          `${onboardingPath}?message=email_verified`,
          request.url,
        ),
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