"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireMarketingAdminAccess } from "@/lib/auth/require-marketing-admin";
import { testAndPersistBufferConnection } from "@/lib/marketing/channels/buffer";
import { createZohoOAuthRequest, getZohoMailRuntimeConfig } from "@/lib/marketing/channels/zoho-mail";

export type BufferConnectionActionState = {
  ok: boolean | null;
  message: string | null;
};

export async function testBufferConnectionAction(
  _previousState: BufferConnectionActionState,
): Promise<BufferConnectionActionState> {
  try {
    await requireMarketingAdminAccess("marketing.integrations.manage");
    const result = await testAndPersistBufferConnection();

    revalidatePath("/admin/marketing/integrations");
    revalidatePath("/admin/marketing");

    if (!result.ok) {
      return { ok: false, message: result.error ?? "Buffer connection test failed." };
    }

    return {
      ok: true,
      message: "Buffer connected successfully. Instagram @mlamhco and Facebook MLAMH were verified.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Buffer connection test failed.",
    };
  }
}

export async function beginZohoMailOAuthAction() {
  await requireMarketingAdminAccess("marketing.integrations.manage");
  const config = await getZohoMailRuntimeConfig();
  const oauth = createZohoOAuthRequest(config);
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set("mlamh_zoho_oauth_state", oauth.state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  cookieStore.set("mlamh_zoho_pkce_verifier", oauth.codeVerifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  redirect(oauth.authorizationUrl);
}
