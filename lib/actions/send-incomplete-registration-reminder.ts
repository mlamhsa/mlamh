"use server";

import { revalidatePath } from "next/cache";

import { sendIncompleteRegistrationReminder } from "@/lib/incomplete-registration/send-reminder";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import { requireAdminAccess } from "@/lib/auth/require-admin";

type SendReminderResult = {
  success: boolean;
  message: string;
};

export async function sendIncompleteRegistrationReminderAction(
  userId: string,
  locale: "ar" | "en" = "ar",
): Promise<SendReminderResult> {
  const adminUser =
    await requireAdminAccess();

  const result =
    await sendIncompleteRegistrationReminder({
      userId,
      locale,
    });

  if (!result.success) {
    return {
      success: false,
      message: result.message,
    };
  }

  try {
    await createEvent({
      type:
        EVENT_TYPES
          .incomplete_registration_reminder_sent,
      target:
        EVENT_TARGETS.AUTH_USER,
      targetId: userId,
      actorId: adminUser.id,
      metadata: {
        locale,
        email: result.email,
        provider:
          result.provider,
        registration_created_at:
          result.registrationCreatedAt,
        reminder_channel: "email",
        reminder_reason:
          "incomplete_registration",
        reminder_source: "admin",
      },
    });
  } catch (eventError) {
    console.error(
      "[IncompleteRegistrationReminder.event]",
      eventError,
    );
  }

  revalidatePath(
    "/admin/action-center",
  );

  return {
    success: true,
    message:
      locale === "ar"
        ? "تم إرسال تذكير إكمال التسجيل."
        : "Registration reminder sent.",
  };
}