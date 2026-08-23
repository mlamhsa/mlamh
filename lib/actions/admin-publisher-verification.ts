"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type Locale = "ar" | "en";

function normalizeLocale(value: FormDataEntryValue | null): Locale {
  return value === "en" ? "en" : "ar";
}

function parsePublisherId(value: FormDataEntryValue | null) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid publisher id.");
  }

  return id;
}

function revalidatePublisherVerificationPaths() {
  revalidatePath("/admin/publishers");

  revalidatePath("/ar/publisher-dashboard");
  revalidatePath("/en/publisher-dashboard");

  revalidatePath("/ar/publisher-dashboard/profile");
  revalidatePath("/en/publisher-dashboard/profile");

  revalidatePath("/ar/publisher-dashboard/verification");
  revalidatePath("/en/publisher-dashboard/verification");

  revalidatePath("/ar/publisher-dashboard/notifications");
revalidatePath("/en/publisher-dashboard/notifications");
}

export async function approvePublisherVerificationAction(
  formData: FormData,
) {
    const adminUser =
    await requireAdminAccess();

  const id = parsePublisherId(
    formData.get("id"),
  );

  const adminClient = createAdminClient();

  const {
    data: publisher,
    error: lookupError,
  } = await adminClient
    .from("publishers")
    .select(
      "id, profile_id, publisher_type, verification_status",
    )
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !publisher) {
    throw new Error(
      "Publisher verification request was not found.",
    );
  }

  if (publisher.publisher_type === "individual") {
    throw new Error(
      "Individual publishers cannot receive organization verification.",
    );
  }

  if (publisher.verification_status !== "pending") {
    throw new Error(
      "Only pending verification requests can be approved.",
    );
  }

  const { data: profile, error: profileError } =
  await adminClient
    .from("profiles")
    .select("user_id")
    .eq("id", publisher.profile_id)
    .maybeSingle();

if (profileError || !profile?.user_id) {
  throw new Error(
    "Publisher user account was not found.",
  );
}

  const { error } = await adminClient
    .from("publishers")
    .update({
        verified: true,
        verification_status: "verified",
        verification_rejection_reason: null,
        verification_reviewed_by: adminUser.id,
        verification_reviewed_at:
          new Date().toISOString(),
      })
    .eq("id", id)
    .eq("verification_status", "pending");

  if (error) {
    throw new Error(
      `Unable to approve verification: ${error.message}`,
    );
  }

  const { error: notificationError } =
  await adminClient
    .from("notifications")
    .insert({
      recipient_type: "publisher",
      recipient_id: String(publisher.id),
      title: "تم اعتماد توثيق الجهة",
      body:
        "تم اعتماد توثيق جهتك بنجاح. يمكنك الآن استخدام صلاحيات الجهة المتاحة في ملامح.",
      is_read: false,
      created_at: new Date().toISOString(),
    });

if (notificationError) {
  console.error(
    "Failed to create publisher verification notification:",
    notificationError,
  );
}

  revalidatePublisherVerificationPaths();
}

export async function rejectPublisherVerificationAction(
  formData: FormData,
) {
    const adminUser =
    await requireAdminAccess();

  const id = parsePublisherId(
    formData.get("id"),
  );

  const locale = normalizeLocale(
    formData.get("locale"),
  );
  
  const rejectionReason = String(
    formData.get(
      "verification_rejection_reason",
    ) ?? "",
  ).trim();
  
  if (!rejectionReason) {
    throw new Error(
      locale === "ar"
        ? "سبب رفض التوثيق مطلوب."
        : "A verification rejection reason is required.",
    );
  }
  
  if (rejectionReason.length > 1000) {
    throw new Error(
      locale === "ar"
        ? "سبب رفض التوثيق طويل جدًا."
        : "The verification rejection reason is too long.",
    );
  }

  const adminClient = createAdminClient();

  const {
    data: publisher,
    error: lookupError,
  } = await adminClient
    .from("publishers")
    .select(
      "id, profile_id, publisher_type, verification_status",
    )
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !publisher) {
    throw new Error(
      "Publisher verification request was not found.",
    );
  }

  if (publisher.publisher_type === "individual") {
    throw new Error(
      "Individual publishers do not use organization verification.",
    );
  }

  if (publisher.verification_status !== "pending") {
    throw new Error(
      "Only pending verification requests can be rejected.",
    );
  }

  const { data: profile, error: profileError } =
  await adminClient
    .from("profiles")
    .select("user_id")
    .eq("id", publisher.profile_id)
    .maybeSingle();

if (profileError || !profile?.user_id) {
  throw new Error(
    "Publisher user account was not found.",
  );
}

  const { error } = await adminClient
    .from("publishers")
    .update({
        verified: false,
        verification_status: "rejected",
        verification_rejection_reason:
          rejectionReason,
        verification_reviewed_by:
          adminUser.id,
        verification_reviewed_at:
          new Date().toISOString(),
      })
    .eq("id", id)
    .eq("verification_status", "pending");

  if (error) {
    throw new Error(
      `Unable to reject verification: ${error.message}`,
    );
  }

  const { error: notificationError } =
  await adminClient
    .from("notifications")
    .insert({
      recipient_type: "publisher",
      recipient_id: String(publisher.id),
      title: "تعذر اعتماد توثيق الجهة",
      body:
        `تعذر اعتماد توثيق جهتك. سبب الرفض: ${rejectionReason}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

if (notificationError) {
  console.error(
    "Failed to create publisher verification notification:",
    notificationError,
  );
}
  revalidatePublisherVerificationPaths();
}