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
    this.assert(
      id > 0,
      "Invalid publisher id",
    );

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
    this.assert(
      id > 0,
      "Invalid publisher id",
    );

    this.assert(
      Boolean(reviewerUserId),
      "Reviewer user id is required",
    );

    const publisher =
      await PublisherRepository.getById(id);

    if (!publisher) {
      throw new Error(
        "Publisher not found.",
      );
    }

    const cleanReason =
      reason?.trim() || null;

    const cleanAdminNote =
      adminNote?.trim() || null;

    if (
      decision === "changes_requested" &&
      !cleanReason
    ) {
      throw new Error(
        locale === "ar"
          ? "سبب طلب التعديل مطلوب."
          : "A reason for requesting changes is required.",
      );
    }

    if (
      decision === "rejected" &&
      !cleanReason
    ) {
      throw new Error(
        locale === "ar"
          ? "سبب الرفض مطلوب."
          : "A rejection reason is required.",
      );
    }

    const previousStatus:
      PublisherApprovalStatus =
        publisher.approval_status ??
        "not_submitted";

    const previousVerified =
      publisher.verified;

    /*
     * المصدر الرئيسي للحالة:
     * profiles.approval_status
     */
    await PublisherRepository.updateApprovalStatus(
      publisher.profile_id,
      decision,
    );

    /*
     * publishers.verified أصبح حالة تشغيلية فقط.
     * لا يكون true إلا عند الاعتماد.
     */
    try {
      await PublisherRepository.updateVerification(
        id,
        decision === "approved",
      );
    } catch (error) {
      /*
       * Rollback لحالة profile إذا فشل
       * تحديث publishers.
       */
      await PublisherRepository.updateApprovalStatus(
        publisher.profile_id,
        previousStatus,
      );

      throw error;
    }

    /*
     * تسجيل القرار في سجل المراجعة الموحد.
     */
    const adminClient =
      createAdminClient();

    const {
      error: historyError,
    } = await adminClient
      .from("profile_review_history")
      .insert({
        profile_id:
          publisher.profile_id,

        account_type:
          "publisher",

        talent_id:
          null,

        reviewer_user_id:
          reviewerUserId,

        decision,

        reason:
          cleanReason,

        admin_note:
          cleanAdminNote,

        previous_status:
          previousStatus,

        new_status:
          decision,
      });

    if (historyError) {
      /*
       * سجل المراجعة جزء أساسي من القرار،
       * لذلك نعيد الحالة السابقة إذا فشل.
       */
      await Promise.all([
        PublisherRepository.updateApprovalStatus(
          publisher.profile_id,
          previousStatus,
        ),

        PublisherRepository.updateVerification(
          id,
          previousVerified,
        ),
      ]);

      throw new Error(
        `[PublisherService.review.history] ${historyError.message}`,
      );
    }

    /*
     * Events تستخدم للإشعارات فقط،
     * وليست المصدر الأساسي لسجل المراجعة.
     */
    const eventType =
      decision === "approved"
        ? EVENT_TYPES.publisher_verified
        : decision === "changes_requested"
          ? EVENT_TYPES.publisher_changes_requested
          : EVENT_TYPES.publisher_rejected;

    await createEvent({
      type: eventType,
      target:
        EVENT_TARGETS.PUBLISHER,
      targetId: id,
      actorId:
        reviewerUserId,
      metadata: {
        publisherId: id,
        profileId:
          publisher.profile_id,
        locale,
        reason:
          cleanReason,
      },
    });

    return {
      success: true,
      status: decision,
    };
  }

  static async approve(
    id: number,
    options: PublisherReviewOptions,
  ) {
    return this.review(
      id,
      "approved",
      options,
    );
  }

  static async requestChanges(
    id: number,
    options: PublisherReviewOptions,
  ) {
    return this.review(
      id,
      "changes_requested",
      options,
    );
  }

  static async reject(
    id: number,
    options: PublisherReviewOptions,
  ) {
    return this.review(
      id,
      "rejected",
      options,
    );
  }

  /*
   * أبقينا markPending مؤقتًا فقط
   * للتوافق مع أي جزء قديم من المشروع.
   *
   * لا نستخدمه في واجهة المراجعة الجديدة.
   */
  static async markPending(
    id: number,
  ) {
    this.assert(
      id > 0,
      "Invalid publisher id",
    );

    const publisher =
      await PublisherRepository.getById(id);

    if (!publisher) {
      throw new Error(
        "Publisher not found.",
      );
    }

    await Promise.all([
      PublisherRepository.updateApprovalStatus(
        publisher.profile_id,
        "pending",
      ),

      PublisherRepository.updateVerification(
        id,
        false,
      ),
    ]);
  }
}