"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getPublisherForCurrentUser() {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized.");
  }

  const { data: profile, error: profileError } =
    await adminClient
      .from("profiles")
      .select("id, account_type")
      .eq("user_id", user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `[getPublisherForCurrentUser profile] ${profileError.message}`,
    );
  }

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (profile.account_type !== "publisher") {
    throw new Error("Publisher access required.");
  }

  const { data: publisher, error: publisherError } =
    await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

  if (publisherError) {
    throw new Error(
      `[getPublisherForCurrentUser publisher] ${publisherError.message}`,
    );
  }

  if (!publisher) {
    throw new Error("Publisher not found.");
  }

  return {
    adminClient,
    publisher,
  };
}

export async function markPublisherNotificationsReadAction(
  formData: FormData,
) {
  const locale = String(
    formData.get("locale") ?? "ar",
  );

  const { adminClient, publisher } =
    await getPublisherForCurrentUser();

  const { error } = await adminClient
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("recipient_type", "publisher")
    .eq("recipient_id", String(publisher.id))
    .eq("is_read", false);

  if (error) {
    throw new Error(
      `[markPublisherNotificationsReadAction] ${error.message}`,
    );
  }

  revalidatePath(
    `/${locale}/publisher-dashboard/notifications`,
  );

  revalidatePath(
    `/${locale}/publisher-dashboard`,
  );
}
