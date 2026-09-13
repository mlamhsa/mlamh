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
  const companyName = getMetadataString(metadata, "company_name");
  const talentName = getMetadataString(metadata, "talent_name");
  const reason = getMetadataString(metadata, "reason");

  switch (type) {
    case "talent_created":
      return {
        title: isArabic
          ? "ملف موهبة جديد بانتظار المراجعة"
          : "New talent profile waiting for review",
        body:
          talentName ||
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
        body:
          reason ||
          (isArabic
            ? "يرجى استكمال التعديلات المطلوبة ثم إعادة إرسال الحساب للمراجعة."
            : "Please make the requested changes and submit your publisher profile again."),
      };

    case "publisher_rejected":
      return {
        title: isArabic
          ? "تم رفض حساب الناشر"
          : "Publisher profile rejected",
        body:
          reason ||
          (isArabic
            ? "لم يتم اعتماد حساب الناشر."
            : "Your publisher account was not approved."),
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
          ? "دعوة لطلب أو فرصة"
          : "Invitation to an opportunity",
        body: isArabic
          ? companyName
            ? `تدعوك ${companyName} للتواصل بخصوص «${title || "طلب"}».`
            : `لديك دعوة جديدة بخصوص «${title || "طلب"}».`
          : companyName
            ? `${companyName} invited you to connect about “${title || "an opportunity"}”.`
            : `You have a new invitation for “${title || "an opportunity"}”.`,
      };

    case "quick_request_interest":
      return {
        title: isArabic
          ? "موهبة مهتمة بطلبك"
          : "Talent interested in your request",
        body: title
          ? isArabic
            ? `${talentName || "موهبة"} أبدت اهتمامها بطلب «${title}». يمكنك بدء المحادثة الآن.`
            : `${talentName || "A talent"} is interested in “${title}”. You can start the conversation now.`
          : isArabic
            ? `${talentName || "موهبة"} أبدت اهتمامها بطلبك. يمكنك بدء المحادثة الآن.`
            : `${talentName || "A talent"} is interested in your request. You can start the conversation now.`,
      };

    case "opportunity_invitation_accepted":
      return {
        title: isArabic
          ? "تم قبول دعوتك"
          : "Your invitation was accepted",
        body: title
          ? isArabic
            ? `${talentName || "الموهبة"} قبلت دعوتك بخصوص «${title}».`
            : `${talentName || "The talent"} accepted your invitation for “${title}”.`
          : isArabic
            ? `${talentName || "الموهبة"} قبلت دعوتك.`
            : `${talentName || "The talent"} accepted your invitation.`,
      };

    case "opportunity_invitation_declined":
      return {
        title: isArabic
          ? "اعتذرت الموهبة عن الدعوة"
          : "Talent declined the invitation",
        body: title
          ? isArabic
            ? `${talentName || "الموهبة"} اعتذرت عن دعوتك بخصوص «${title}».`
            : `${talentName || "The talent"} declined your invitation for “${title}”.`
          : isArabic
            ? `${talentName || "الموهبة"} اعتذرت عن دعوتك.`
            : `${talentName || "The talent"} declined your invitation.`,
      };

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
    const notification = buildNotification(type, metadata);

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