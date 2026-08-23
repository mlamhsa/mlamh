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

  const title =
    getMetadataString(metadata, "title");

  const companyName =
    getMetadataString(
      metadata,
      "company_name",
    );

  const reason =
    getMetadataString(
      metadata,
      "reason",
    );

  switch (type) {
    /*
     * Talent review
     */
    case "talent_created":
  return {
    title: isArabic
      ? "ملف موهبة جديد بانتظار المراجعة"
      : "New talent profile waiting for review",

    body:
      getMetadataString(
        metadata,
        "talent_name",
      ) ||
      (isArabic
        ? "تم إرسال ملف موهبة جديد للمراجعة."
        : "A new talent profile has been submitted for review."),
  };
  case "talent_approved":
    return {
      title: isArabic
        ? "تم اعتماد ملفك"
        : "Your talent profile is approved",
      body: isArabic
        ? "تم اعتماد ملفك في ملامح، ويمكنك الآن التقديم على الفرص."
        : "Your MLAMH talent profile has been approved. You can now apply to opportunities.",
    };

    case "talent_changes_requested":
  return {
    title: isArabic
      ? "ملفك بحاجة إلى تعديل"
      : "Your talent profile needs changes",
    body: reason
      ? isArabic
        ? `التعديلات المطلوبة: ${reason}`
        : `Required changes: ${reason}`
      : isArabic
        ? "يرجى مراجعة ملفك وإجراء التعديلات المطلوبة ثم إرساله للمراجعة مرة أخرى."
        : "Please review your profile, make the requested changes, and submit it again.",
  };

  case "talent_rejected":
    return {
      title: isArabic
        ? "لم يتم اعتماد ملفك"
        : "Your talent profile was not approved",
      body: reason
        ? isArabic
          ? `سبب عدم الاعتماد: ${reason}`
          : `Reason: ${reason}`
        : isArabic
          ? "لم يتم اعتماد ملفك في المراجعة الحالية."
          : "Your talent profile was not approved in the current review.",
    };

    /*
     * Publisher review
     */
    case "publisher_verified":
      return {
        title: isArabic
          ? "تم اعتماد حساب الناشر"
          : "Publisher approved",
        body: isArabic
          ? "تم اعتماد حساب الناشر الخاص بك."
          : "Your publisher account has been approved.",
      };

    case "publisher_changes_requested":
      return {
        title: isArabic
          ? "حساب الناشر بحاجة إلى تعديل"
          : "Publisher profile needs changes",
        body: reason
          ? reason
          : isArabic
            ? "يرجى استكمال التعديلات المطلوبة ثم إعادة إرسال الحساب للمراجعة."
            : "Please make the requested changes and submit your publisher profile again.",
      };

    case "publisher_rejected":
      return {
        title: isArabic
          ? "تم رفض حساب الناشر"
          : "Publisher profile rejected",
        body: reason
          ? reason
          : isArabic
            ? "لم يتم اعتماد حساب الناشر."
            : "Your publisher account was not approved.",
      };

    /*
     * Opportunities
     */
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
      
          body: reason
            ? isArabic
              ? `${title ? `الفرصة: ${title}\n` : ""}سبب الرفض: ${reason}`
              : `${title ? `Opportunity: ${title}\n` : ""}Reason: ${reason}`
            : title ||
              (isArabic
                ? "تم رفض الفرصة."
                : "The opportunity was rejected."),
        };
      
      case "opportunity_needs_changes":
        return {
          title: isArabic
            ? "الفرصة بحاجة إلى تعديلات"
            : "Opportunity needs changes",
      
          body: reason
            ? isArabic
              ? `${title ? `الفرصة: ${title}\n` : ""}التعديلات المطلوبة: ${reason}`
              : `${title ? `Opportunity: ${title}\n` : ""}Required changes: ${reason}`
            : title ||
              (isArabic
                ? "يرجى مراجعة الفرصة وإجراء التعديلات المطلوبة."
                : "Please review the opportunity and make the requested changes."),
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

    /*
 * Applications
 */
case "application_created":
  return {
    title: isArabic
      ? "تم استلام طلب تقديم جديد"
      : "New application received",

    body: title
      ? isArabic
        ? `تم استلام طلب تقديم جديد على فرصة "${title}".`
        : `A new application was received for "${title}".`
      : isArabic
        ? "تم استلام طلب تقديم جديد."
        : "A new application was received.",
  };

case "application_shortlisted":
  return {
    title: isArabic
      ? "تم ترشيح طلبك"
      : "Application shortlisted",

    body: title
      ? isArabic
        ? `تم ترشيح طلبك للمرحلة التالية في فرصة "${title}".`
        : `Your application for "${title}" has been shortlisted.`
      : isArabic
        ? "تم ترشيح طلبك للمرحلة التالية."
        : "Your application has been shortlisted.",
  };

case "application_accepted":
  return {
    title: isArabic
      ? "تم قبول طلب التقديم"
      : "Application accepted",

    body: title
      ? isArabic
        ? `تم قبول طلبك في فرصة "${title}".`
        : `Your application for "${title}" has been accepted.`
      : isArabic
        ? "تم قبول طلب التقديم الخاص بك."
        : "Your application has been accepted.",
  };

case "application_rejected":
  return {
    title: isArabic
      ? "تم رفض طلب التقديم"
      : "Application rejected",

    body: reason
      ? isArabic
        ? `${title ? `الفرصة: ${title}\n` : ""}سبب الرفض: ${reason}`
        : `${title ? `Opportunity: ${title}\n` : ""}Reason: ${reason}`
      : title
        ? isArabic
          ? `لم يتم قبول طلبك في فرصة "${title}".`
          : `Your application for "${title}" was not accepted.`
        : isArabic
          ? "لم يتم قبول طلب التقديم الخاص بك."
          : "Your application was not accepted.",
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
    const notification =
      buildNotification(
        type,
        metadata,
      );

    if (!notification) {
      return;
    }

    const adminClient =
      createAdminClient();

    const { error } =
      await adminClient
        .from("notifications")
        .insert({
          event_id: eventId,
          recipient_type: target,
          recipient_id:
            String(targetId),
          title:
            notification.title,
          body:
            notification.body,
        });

    if (error) {
      console.error(
        "[NotificationHandler]",
        error.message,
      );
    }
  }
}