import { BaseRepository } from "@/lib/repositories/base/BaseRepository";

export type PublisherApprovalStatus =
  | "not_submitted"
  | "pending"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "suspended";

export type AdminPublisher = {
  id: number;
  profile_id: number;

  publisher_type: string;
  company_name: string | null;
  contact_name: string | null;

  city: string | null;
  website: string | null;
  instagram: string | null;
  company_size: string | null;
  founded_year: number | null;
  description: string | null;
  
  account_email: string | null;
  address: string | null;
  
  tiktok_url: string | null;
  snapchat_url: string | null;
  linkedin_url: string | null;

  verified: boolean;
  created_at: string;

  approval_status: PublisherApprovalStatus;

  account_phone: string | null;
  display_name: string | null;

  onboarding_status: string | null;
  onboarding_step: string | null;

  /*
   * آخر تحديث على حساب الناشر.
   * نستخدمه لاحقًا لترتيب الحسابات
   * التي عادت للمراجعة.
   */
  account_updated_at: string | null;

  /*
   * آخر قرار مراجعة مسجل.
   */
  last_review_decision:
    | PublisherApprovalStatus
    | null;

  /*
   * وقت آخر قرار مراجعة.
   */
  last_review_at: string | null;

  /*
   * true عندما:
   *
   * الحالة الحالية pending
   * وآخر قرار كان changes_requested
   *
   * وهذا يعني أن الناشر عدّل ملفه
   * وأعاده للإدارة للمراجعة.
   */
  is_resubmitted_after_changes: boolean;
  total_opportunities: number;
  pending_opportunities: number;
};

type PublisherRow = {
  id: number;
  profile_id: number;

  publisher_type: string;
  company_name: string | null;
  contact_name: string | null;

  city: string | null;
  company_size: string | null;
  founded_year: number | null;
  description: string | null;

  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;

  instagram: string | null;
  tiktok_url: string | null;
  snapchat_url: string | null;
  linkedin_url: string | null;

  verified: boolean | null;
  created_at: string;
};

type ProfileRow = {
  id: number;
  user_id: string;

  display_name: string | null;
  phone: string | null;

  approval_status:
    | PublisherApprovalStatus
    | null;

  onboarding_status: string | null;
  onboarding_step: string | null;

  updated_at: string | null;
};

type ProfileReviewHistoryRow = {
  profile_id: number;

  decision: PublisherApprovalStatus;

  created_at: string;
};

type PublisherOpportunityRow = {
  publisher_id: number;
  status: string | null;
};

function getApprovalStatus(
  profile?: ProfileRow,
): PublisherApprovalStatus {
  return (
    profile?.approval_status ??
    "not_submitted"
  );
}

function getAuthAccountPhone(authUser: any): string | null {
  const metadata =
    authUser?.user_metadata &&
    typeof authUser.user_metadata === "object"
      ? authUser.user_metadata
      : {};

  const candidates = [
    authUser?.phone,
    metadata.phone,
    metadata.mobile,
    metadata.phone_number,
    metadata.full_phone,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function isResubmittedAfterChanges({
  approvalStatus,
  latestReview,
}: {
  approvalStatus: PublisherApprovalStatus;
  latestReview:
    | ProfileReviewHistoryRow
    | undefined;
}) {
  return (
    approvalStatus === "pending" &&
    latestReview?.decision ===
      "changes_requested"
  );
}

export class PublisherRepository extends BaseRepository {
  static async getAll(): Promise<
    AdminPublisher[]
  > {
    const adminClient =
      this.client();

    /*
     * 1) الناشرون
     */
    const {
      data: publisherData,
      error: publisherError,
    } = await adminClient
      .from("publishers")
      .select(
        `
          id,
          profile_id,
          publisher_type,
          company_name,
          contact_name,
          city,
          company_size,
          founded_year,
          description,
          phone,
          email,
          website,
          address,
          instagram,
          tiktok_url,
          snapchat_url,
          linkedin_url,
          verified,
          created_at
        `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (publisherError) {
      throw new Error(
        `[PublisherRepository.getAll.publishers] ${publisherError.message}`,
      );
    }

    const publishers =
      (publisherData ??
        []) as PublisherRow[];

    if (publishers.length === 0) {
      return [];
    }

    const profileIds = [
      ...new Set(
        publishers.map(
          (publisher) =>
            publisher.profile_id,
        ),
      ),
    ];

    /*
     * 2) بيانات الحسابات
     *
     * approval_status هو المصدر
     * الرئيسي لحالة المراجعة.
     */
    const {
      data: profileData,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select(
        `
          id,
          user_id,
          display_name,
          phone,
          approval_status,
          onboarding_status,
          onboarding_step,
          updated_at
        `,
      )
      .in(
        "id",
        profileIds,
      );

    if (profileError) {
      throw new Error(
        `[PublisherRepository.getAll.profiles] ${profileError.message}`,
      );
    }

    const profiles =
      (profileData ??
        []) as ProfileRow[];

    const profileMap =
      new Map<
        number,
        ProfileRow
      >(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ],
        ),
      );
/*
 * بيانات الحساب الأصلية من Supabase Auth.
 * نستخدمها للحصول على البريد الذي
 * تم إنشاء الحساب به.
 */
const authAccountMap =
  new Map<
    string,
    {
      email: string | null;
      phone: string | null;
    }
  >();

await Promise.all(
  profiles.map(async (profile) => {
    if (!profile.user_id) {
      return;
    }

    const {
      data,
      error,
    } =
      await adminClient.auth.admin.getUserById(
        profile.user_id,
      );

    if (error) {
      console.error(
        "[PublisherRepository.getAll.authUser]",
        profile.user_id,
        error,
      );

      authAccountMap.set(
        profile.user_id,
        {
          email: null,
          phone: null,
        },
      );

      return;
    }

    const authUser = data.user;

    authAccountMap.set(
      profile.user_id,
      {
        email: authUser?.email ?? null,
        phone: getAuthAccountPhone(authUser),
      },
    );
  }),
);
    /*
     * 3) سجل المراجعة الموحد
     *
     * نحتاج آخر قرار فقط لكل ناشر
     * لمعرفة هل الحساب:
     *
     * pending جديد
     *
     * أو
     *
     * pending بعد تنفيذ التعديلات.
     */
    const {
      data: reviewHistoryData,
      error: reviewHistoryError,
    } = await adminClient
      .from(
        "profile_review_history",
      )
      .select(
        `
          profile_id,
          decision,
          created_at
        `,
      )
      .eq(
        "account_type",
        "publisher",
      )
      .in(
        "profile_id",
        profileIds,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (reviewHistoryError) {
      throw new Error(
        `[PublisherRepository.getAll.reviewHistory] ${reviewHistoryError.message}`,
      );
    }

    const reviewHistory =
      (reviewHistoryData ??
        []) as ProfileReviewHistoryRow[];

    /*
     * لأن النتائج مرتبة من الأحدث
     * إلى الأقدم، أول سجل لكل
     * profile_id هو آخر مراجعة.
     */
    const latestReviewMap =
      new Map<
        number,
        ProfileReviewHistoryRow
      >();

    for (
      const review of reviewHistory
    ) {
      if (
        !latestReviewMap.has(
          review.profile_id,
        )
      ) {
        latestReviewMap.set(
          review.profile_id,
          review,
        );
      }
    }
    /*
     * 4) فرص الناشرين
     *
     * نجلب جميع الفرص في استعلام واحد
     * لتجنب تنفيذ استعلام منفصل لكل ناشر.
     */
    const publisherIds = publishers.map(
      (publisher) => publisher.id,
    );

    const {
      data: opportunityData,
      error: opportunityError,
    } = await adminClient
      .from("opportunities")
      .select(
        `
          publisher_id,
          status
        `,
      )
      .in(
        "publisher_id",
        publisherIds,
      );

    if (opportunityError) {
      throw new Error(
        `[PublisherRepository.getAll.opportunities] ${opportunityError.message}`,
      );
    }

    const opportunities =
      (opportunityData ??
        []) as PublisherOpportunityRow[];

    const opportunityCounts = new Map<
      number,
      {
        total: number;
        pending: number;
      }
    >();

    for (const opportunity of opportunities) {
      const current =
        opportunityCounts.get(
          opportunity.publisher_id,
        ) ?? {
          total: 0,
          pending: 0,
        };

      current.total += 1;

      if (
        opportunity.status ===
        "pending_review"
      ) {
        current.pending += 1;
      }

      opportunityCounts.set(
        opportunity.publisher_id,
        current,
      );
    }
    /*
 * 5) دمج النتائج
 */
return publishers.map(
  (
    publisher,
  ): AdminPublisher => {
    const profile =
      profileMap.get(
        publisher.profile_id,
      );

    const authAccount =
      profile?.user_id
        ? authAccountMap.get(
            profile.user_id,
          )
        : undefined;

    const latestReview =
      latestReviewMap.get(
        publisher.profile_id,
      );

    const counts =
      opportunityCounts.get(
        publisher.id,
      ) ?? {
        total: 0,
        pending: 0,
      };

    const approvalStatus =
      getApprovalStatus(
        profile,
      );

    return {
          id:
            publisher.id,

          profile_id:
            publisher.profile_id,

          publisher_type:
            publisher.publisher_type,

          company_name:
            publisher.company_name,

          contact_name:
            publisher.contact_name,

          city:
            publisher.city,

            company_size:
  publisher.company_size,

founded_year:
  publisher.founded_year,

description:
  publisher.description,

  account_email:
  authAccount?.email ?? null,

address:
  publisher.address,

tiktok_url:
  publisher.tiktok_url,

snapchat_url:
  publisher.snapchat_url,

linkedin_url:
  publisher.linkedin_url,

          website:
            publisher.website,

          instagram:
            publisher.instagram,

          /*
           * verified حالة تشغيلية.
           * approval_status هو مصدر
           * قرار المراجعة.
           */
          verified:
            Boolean(
              publisher.verified,
            ),

          created_at:
            publisher.created_at,

          approval_status:
            approvalStatus,

            account_phone:
            profile?.phone?.trim() ||
            authAccount?.phone?.trim() ||
            publisher.phone?.trim() ||
            null,

          display_name:
            profile
              ?.display_name ??
            null,

          onboarding_status:
            profile
              ?.onboarding_status ??
            null,

          onboarding_step:
            profile
              ?.onboarding_step ??
            null,

          account_updated_at:
            profile?.updated_at ??
            null,

          last_review_decision:
            latestReview
              ?.decision ??
            null,

          last_review_at:
            latestReview
              ?.created_at ??
            null,

          is_resubmitted_after_changes:
            isResubmittedAfterChanges(
              {
                approvalStatus,
                latestReview,
              },
            ),
            total_opportunities:
            counts.total,

          pending_opportunities:
            counts.pending,
        };
      },
    );
  }

  static async getById(
    id: number,
  ): Promise<
    AdminPublisher | null
  > {
    const adminClient =
      this.client();

    /*
     * 1) الناشر
     */
    const {
      data: publisherData,
      error: publisherError,
    } = await adminClient
      .from("publishers")
      .select(
  `
    id,
    profile_id,
    publisher_type,
    company_name,
    contact_name,
    city,
    company_size,
    founded_year,
    description,
    phone,
    email,
    website,
    address,
    instagram,
    tiktok_url,
    snapchat_url,
    linkedin_url,
    verified,
    created_at
  `,
)
      .eq(
        "id",
        id,
      )
      .maybeSingle();

    if (publisherError) {
      throw new Error(
        `[PublisherRepository.getById.publisher] ${publisherError.message}`,
      );
    }

    if (!publisherData) {
      return null;
    }

    const publisher =
      publisherData as PublisherRow;

    /*
     * 2) الحساب
     */
    const {
      data: profileData,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select(
        `
          id,
          user_id,
          display_name,
          phone,
          approval_status,
          onboarding_status,
          onboarding_step,
          updated_at
        `,
      )
      .eq(
        "id",
        publisher.profile_id,
      )
      .maybeSingle();

    if (profileError) {
      throw new Error(
        `[PublisherRepository.getById.profile] ${profileError.message}`,
      );
    }

    const profile =
      profileData
        ? (profileData as ProfileRow)
        : undefined;
        let accountEmail: string | null = null;
let accountPhone: string | null = null;

if (profile?.user_id) {
  const {
    data: authUserData,
    error: authUserError,
  } =
    await adminClient.auth.admin.getUserById(
      profile.user_id,
    );

  if (authUserError) {
    console.error(
      "[PublisherRepository.getById.authUser]",
      profile.user_id,
      authUserError,
    );
  } else {
    const authUser =
      authUserData.user;

    accountEmail =
      authUser?.email ?? null;

    accountPhone =
      getAuthAccountPhone(authUser);
  }
}
    /*
     * 3) آخر مراجعة
     */
    const {
      data: reviewData,
      error: reviewError,
    } = await adminClient
      .from(
        "profile_review_history",
      )
      .select(
        `
          profile_id,
          decision,
          created_at
        `,
      )
      .eq(
        "profile_id",
        publisher.profile_id,
      )
      .eq(
        "account_type",
        "publisher",
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (reviewError) {
      throw new Error(
        `[PublisherRepository.getById.reviewHistory] ${reviewError.message}`,
      );
    }

    const latestReview =
      reviewData
        ? (reviewData as ProfileReviewHistoryRow)
        : undefined;

    const approvalStatus =
      getApprovalStatus(
        profile,
      );
      const {
        data: opportunityData,
        error: opportunityError,
      } = await adminClient
        .from("opportunities")
        .select("status")
        .eq(
          "publisher_id",
          publisher.id,
        );
  
      if (opportunityError) {
        throw new Error(
          `[PublisherRepository.getById.opportunities] ${opportunityError.message}`,
        );
      }
  
      const publisherOpportunities =
        opportunityData ?? [];
  
      const totalOpportunities =
        publisherOpportunities.length;
  
      const pendingOpportunities =
        publisherOpportunities.filter(
          (opportunity) =>
            opportunity.status ===
            "pending_review",
        ).length;
    return {
      id:
        publisher.id,

      profile_id:
        publisher.profile_id,

      publisher_type:
        publisher.publisher_type,

      company_name:
        publisher.company_name,

      contact_name:
        publisher.contact_name,

      city:
        publisher.city,

        company_size:
  publisher.company_size,

founded_year:
  publisher.founded_year,

description:
  publisher.description,

  account_email:
  accountEmail,

address:
  publisher.address,

tiktok_url:
  publisher.tiktok_url,

snapchat_url:
  publisher.snapchat_url,

linkedin_url:
  publisher.linkedin_url,

      website:
        publisher.website,

      instagram:
        publisher.instagram,

      verified:
        Boolean(
          publisher.verified,
        ),

      created_at:
        publisher.created_at,

      approval_status:
        approvalStatus,

        account_phone:
  profile?.phone?.trim() ||
  accountPhone ||
  publisher.phone?.trim() ||
  null,

      display_name:
        profile?.display_name ??
        null,

      onboarding_status:
        profile
          ?.onboarding_status ??
        null,

      onboarding_step:
        profile
          ?.onboarding_step ??
        null,

      account_updated_at:
        profile?.updated_at ??
        null,

      last_review_decision:
        latestReview
          ?.decision ??
        null,

      last_review_at:
        latestReview
          ?.created_at ??
        null,

      is_resubmitted_after_changes:
        isResubmittedAfterChanges(
          {
            approvalStatus,
            latestReview,
          },
        ),
        total_opportunities:
        totalOpportunities,

      pending_opportunities:
        pendingOpportunities,
    };
  }

  /*
   * verified ليس مصدر حالة
   * المراجعة.
   *
   * نحتفظ به كحالة تشغيلية:
   * true فقط بعد الاعتماد.
   */
  static async updateVerification(
    id: number,
    verified: boolean,
  ) {
    const adminClient =
      this.client();

    const {
      error,
    } = await adminClient
      .from("publishers")
      .update({
        verified,
      })
      .eq(
        "id",
        id,
      );

    if (error) {
      throw new Error(
        `[PublisherRepository.updateVerification] ${error.message}`,
      );
    }
  }

  /*
   * المصدر الرئيسي لحالة
   * مراجعة الحساب.
   */
  static async updateApprovalStatus(
    profileId: number,
    status: PublisherApprovalStatus,
  ) {
    const adminClient =
      this.client();

    const {
      error,
    } = await adminClient
      .from("profiles")
      .update({
        approval_status:
          status,
      })
      .eq(
        "id",
        profileId,
      );

    if (error) {
      throw new Error(
        `[PublisherRepository.updateApprovalStatus] ${error.message}`,
      );
    }
  }
}