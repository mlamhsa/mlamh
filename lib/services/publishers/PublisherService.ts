import { BaseService } from "../base/BaseService";

import {
  createEvent,
  EVENT_TARGETS,
  EVENT_TYPES,
} from "@/lib/events";

import {
  PublisherRepository,
  type PublisherApprovalStatus,
} from "@/lib/repositories/publishers/PublisherRepository";

import { createAdminClient } from "@/lib/supabase/admin";

type PublisherReviewDecision =
  | "approved"
  | "changes_requested"
  | "rejected";

type PublisherReviewOptions = {
  reviewerUserId: string;
  locale?: "ar" | "en";
  reason?: string | null;
  adminNote?: string | null;
};

type PublisherReviewResult = {
  success: boolean;
  status: PublisherReviewDecision;
};

export class PublisherService extends BaseService {
  static async getAll() {
    return PublisherRepository.getAll();
  }

  static async getById(id: number) {
    this.assert(id > 0, "Invalid publisher id");
    return PublisherRepository.getById(id);
  }

  static async review(
    id: number,
    decision: PublisherReviewDecision,
    {
      reviewerUserId,
      locale = "ar",
      reason = null,
      adminNote = null,
    }: PublisherReviewOptions,
  ): Promise<PublisherReviewResult> {
    this.assert(id > 0, "Invalid publisher id");
    this.assert(Boolean(reviewerUserId), "Reviewer user id is required");

    const publisher = await PublisherRepository.getById(id);
    if (!publisher) throw new Error("Publisher not found.");

    const cleanReason = reason?.trim() || null;
    const cleanAdminNote = adminNote?.trim() || null;

    if (decision === "changes_requested" && !cleanReason) {
      throw new Error(
        locale === "ar"
          ? "سبب طلب التعديل مطلوب."
          : "A reason for requesting changes is required.",
      );
    }

    if (decision === "rejected" && !cleanReason) {
      throw new Error(
        locale === "ar" ? "سبب الرفض مطلوب." : "A rejection reason is required.",
      );
    }

    const previousStatus: PublisherApprovalStatus =
      publisher.approval_status ?? "not_submitted";

    /*
     * Account approval and organization verification are intentionally separate.
     * profiles.approval_status controls whether the publisher account may operate.
     * publishers.verified / verification_status are changed only by the dedicated
     * publisher verification workflow.
     */
    await PublisherRepository.updateApprovalStatus(
      publisher.profile_id,
      decision,
    );

    const adminClient = createAdminClient();
    const { error: historyError } = await adminClient
      .from("profile_review_history")
      .insert({
        profile_id: publisher.profile_id,
        account_type: "publisher",
        talent_id: null,
        reviewer_user_id: reviewerUserId,
        decision,
        reason: cleanReason,
        admin_note: cleanAdminNote,
        previous_status: previousStatus,
        new_status: decision,
      });

    if (historyError) {
      await PublisherRepository.updateApprovalStatus(
        publisher.profile_id,
        previousStatus,
      );

      throw new Error(
        `[PublisherService.review.history] ${historyError.message}`,
      );
    }

    const eventType =
      decision === "approved"
        ? EVENT_TYPES.publisher_approved
        : decision === "changes_requested"
          ? EVENT_TYPES.publisher_changes_requested
          : EVENT_TYPES.publisher_rejected;

    try {
      await createEvent({
        type: eventType,
        target: EVENT_TARGETS.PUBLISHER,
        targetId: id,
        actorId: reviewerUserId,
        metadata: {
          publisherId: id,
          profileId: publisher.profile_id,
          locale,
          reason: cleanReason,
        },
      });
    } catch (eventError) {
      console.error("[PublisherService.review.event]", eventError);
    }

    return {
      success: true,
      status: decision,
    };
  }

  static async approve(id: number, options: PublisherReviewOptions) {
    return this.review(id, "approved", options);
  }

  static async requestChanges(id: number, options: PublisherReviewOptions) {
    return this.review(id, "changes_requested", options);
  }

  static async reject(id: number, options: PublisherReviewOptions) {
    return this.review(id, "rejected", options);
  }

  /*
   * Legacy compatibility only. Returning an account to pending review must not
   * alter its independent organization-verification state.
   */
  static async markPending(id: number) {
    this.assert(id > 0, "Invalid publisher id");

    const publisher = await PublisherRepository.getById(id);
    if (!publisher) throw new Error("Publisher not found.");

    await PublisherRepository.updateApprovalStatus(
      publisher.profile_id,
      "pending",
    );
  }
}