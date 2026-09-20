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
  | "APPLICATION_INSERT_FAILED"
  | "QUICK_CONVERSATION_FAILED";

export type OpportunityResponseMode = "quick" | "casting";

export type ApplyOpportunityResult =
  | {
      ok: true;
      code: "SUCCESS";
      applicationId: number | string;
      opportunityId: number;
      opportunitySlug: string | null;
      postingMode: OpportunityResponseMode;
      conversationId: number | null;
    }
  | {
      ok: false;
      code: Exclude<ApplyOpportunityCode, "SUCCESS">;
      details?: Record<string, unknown>;
    };

/**
 * Cross-client contract for Web and Mobile application / interest flows.
 * Keep this file free of Next.js, Supabase service-role clients, UI strings,
 * and platform-specific session handling.
 *
 * `postingMode` is product-semantic:
 * - `quick` means the talent is expressing interest and a request-linked
 *   conversation should exist immediately.
 * - `casting` means the talent is submitting a normal casting application.
 */
export type ApplyOpportunityInput = {
  opportunityId: number;
};
