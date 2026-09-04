export const EVENT_TYPES = {
  opportunity_created: "opportunity_created",
  opportunity_pending_review: "opportunity_pending_review",
  opportunity_published: "opportunity_published",
  opportunity_rejected: "opportunity_rejected",
  opportunity_needs_changes: "opportunity_needs_changes",
  opportunity_invitation: "opportunity_invitation",

  application_created: "application_created",
  application_shortlisted: "application_shortlisted",
  application_accepted: "application_accepted",
  application_rejected: "application_rejected",
  message_report_reviewed:
  "message_report_reviewed",

  /*
   * Talent review workflow
   */
  talent_created: "talent_created",
  talent_approved: "talent_approved",
  talent_changes_requested: "talent_changes_requested",
  talent_rejected: "talent_rejected",
  talent_profile_recovery_reminder_sent:
  "talent_profile_recovery_reminder_sent",

  /*
   * Publisher review workflow
   */
  publisher_created: "publisher_created",
  publisher_verified: "publisher_verified",
  publisher_changes_requested: "publisher_changes_requested",
  publisher_rejected: "publisher_rejected",
  incomplete_registration_reminder_sent:
  "incomplete_registration_reminder_sent",
} as const;

export type EventType =
  (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];