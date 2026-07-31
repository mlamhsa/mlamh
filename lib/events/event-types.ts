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

  talent_created: "talent_created",
  talent_approved: "talent_approved",

  publisher_created: "publisher_created",
  publisher_verified: "publisher_verified",
} as const;

export type EventType =
  (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];