import { createAdminClient } from "@/lib/supabase/admin";

import type { EventTarget } from "../event-targets";
import type { EventType } from "../event-types";

type NotificationContent = {
  title: string;
  body: string;
};

function getMetadataString(
  metadata: Record<string, unknown>,
  key: string,
) {
  const value = metadata[key];

  return typeof value === "string"
    ? value.trim()
    : value === null || value === undefined
      ? ""
      : String(value).trim();
}

function buildNotification(
  type: EventType,
  metadata: Record<string, unknown>,
): NotificationContent | null {
  const locale =
  getMetadataString(metadata, "locale") === "en"
    ? "en"
    : "ar";

  const isArabic = locale === "ar";
  const title = getMetadataString(metadata, "title");
  const companyName = getMetadataString(
    metadata,
    "company_name",
  );

  switch (type) {
    case "publisher_verified":
      return {
        title: isArabic
          ? "تم اعتماد حساب الناشر"
          : "Publisher approved",
        body: isArabic
          ? "تم اعتماد حساب الناشر الخاص بك."
          : "Your publisher account has been approved.",
      };

    case "opportunity_pending_review":
      return {
        title: isArabic
          ? "فرصة جديدة بانتظار المراجعة"
          : "New opportunity waiting for review",
        body: title,
      };

    case "opportunity_published":
      return {
        title: isArabic
          ? "تم اعتماد الفرصة"
          : "Opportunity approved",
        body: title,
      };

    case "opportunity_rejected":
      return {
        title: isArabic
          ? "تم رفض الفرصة"
          : "Opportunity rejected",
        body: title,
      };

    case "opportunity_needs_changes":
      return {
        title: isArabic
          ? "الفرصة بحاجة إلى تعديلات"
          : "Opportunity needs changes",
        body: title,
      };

      case "opportunity_invitation":
  return {
    title: isArabic
      ? "دعوة للتقديم"
      : "Invitation to apply",

    body: isArabic
      ? companyName
        ? `تدعوك ${companyName} للتقديم على فرصة "${title}".`
        : `تمت دعوتك للتقديم على فرصة "${title}".`
      : companyName
        ? `${companyName} invited you to apply for "${title}".`
        : `You were invited to apply for "${title}".`,
  };

    case "application_created":
      return {
        title: isArabic
          ? "تم استلام طلب تقديم جديد"
          : "New application received",
        body: title,
      };

    case "application_accepted":
      return {
        title: isArabic
          ? "تم قبول طلب التقديم"
          : "Application accepted",
        body: title,
      };

    case "application_rejected":
      return {
        title: isArabic
          ? "تم رفض طلب التقديم"
          : "Application rejected",
        body: title,
      };

    default:
      return null;
  }
}

export class NotificationHandler {
  static async handle({
    eventId,
    type,
    target,
    targetId,
    metadata,
  }: {
    eventId: number;
    type: EventType;
    target: EventTarget;
    targetId: string | number;
    metadata: Record<string, unknown>;
  }) {
    const notification = buildNotification(
      type,
      metadata,
    );

    if (!notification) {
      return;
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("notifications")
      .insert({
        event_id: eventId,
        recipient_type: target,
        recipient_id: String(targetId),
        title: notification.title,
        body: notification.body,
      });

    if (error) {
      console.error(
        "[NotificationHandler]",
        error.message,
      );
    }
  }
}