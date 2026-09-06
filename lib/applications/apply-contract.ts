export type ApplyOpportunityCode =
  | "SUCCESS"
  | "INVALID_OPPORTUNITY"
  | "UNAUTHENTICATED"
  | "NOT_TALENT"
  | "ACCOUNT_RESTRICTED"
  | "TALENT_NOT_APPROVED"
  | "PROFILE_INCOMPLETE"
  | "PROFILE_LOOKUP_FAILED"
  | "TALENT_LOOKUP_FAILED"
  | "OPPORTUNITY_LOOKUP_FAILED"
  | "OPPORTUNITY_NOT_AVAILABLE"
  | "APPLICATION_WINDOW_CLOSED"
  | "ALREADY_APPLIED"
  | "APPLICATION_LOOKUP_FAILED"
  | "APPLICATION_INSERT_FAILED";

export type ApplyOpportunityResult =
  | {
      ok: true;
      code: "SUCCESS";
      applicationId: number | string;
      opportunityId: number;
      opportunitySlug: string | null;
    }
  | {
      ok: false;
      code: Exclude<ApplyOpportunityCode, "SUCCESS">;
      details?: Record<string, unknown>;
    };

/**
 * Cross-client contract for Web and Mobile application flows.
 * Keep this file free of Next.js, Supabase service-role clients, UI strings,
 * and platform-specific session handling.
 */
export type ApplyOpportunityInput = {
  opportunityId: number;
};
