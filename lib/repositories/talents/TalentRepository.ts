import { BaseRepository } from "@/lib/repositories/base/BaseRepository";
import type { Talent } from "@/lib/types/talent";

export type AdminTalentFilter =
  | "published"
  | "unpublished"
  | "active"
  | "suspended";

export type AdminTalent = Talent & {
  views: number;

  account_phone: string | null;
  approval_status: string | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
  profile_completed_at: string | null;
  account_created_at: string | null;
  account_updated_at: string | null;
};

type AdminTalentViewRow = Talent & {
  admin_views?:
    | number
    | string
    | null;

  account_phone?: string | null;

  approval_status?: string | null;
  onboarding_status?: string | null;
  onboarding_step?: string | null;

  profile_completed_at?: string | null;
  account_created_at?: string | null;
  account_updated_at?: string | null;
};

export type TopViewedTalent = {
  id: number;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
  views: number;
};

function normalizeViews(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsedValue =
    Number(value ?? 0);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : 0;
}

function normalizeSearchValue(
  value: string,
) {
  return value
    .replaceAll(",", " ")
    .replaceAll("%", "")
    .trim();
}

function normalizeAdminTalent(
  row: AdminTalentViewRow,
): AdminTalent {
  const {
    admin_views,
    ...talent
  } = row;

  return {
    ...talent,

    views:
      normalizeViews(
        admin_views,
      ),

    account_phone:
      row.account_phone ?? null,

    approval_status:
      row.approval_status ?? null,

    onboarding_status:
      row.onboarding_status ??
      null,

    onboarding_step:
      row.onboarding_step ??
      null,

    profile_completed_at:
      row.profile_completed_at ??
      null,

    account_created_at:
      row.account_created_at ??
      null,

    account_updated_at:
      row.account_updated_at ??
      null,
  } as AdminTalent;
}

export class TalentRepository extends BaseRepository {
  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
    approvalStatus,
  }: {
    page: number;
    pageSize: number;
    status?: AdminTalentFilter;
    search?: string;
    approvalStatus?: string;
  }) {
    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize -
      1;

    const adminClient =
      this.client();

    let query =
      adminClient
        .from(
          "admin_talent_profiles",
        )
        .select("*", {
          count: "exact",
        });

    /*
     * حالة نشر الملف.
     */
    if (status === "published") {
      query =
        query.eq(
          "published",
          true,
        );
    }

    if (status === "unpublished") {
      query =
        query.eq(
          "published",
          false,
        );
    }

    /*
     * حالة حساب / ملف الموهبة.
     */
    if (status === "active") {
      query =
        query.eq(
          "status",
          "active",
        );
    }

    if (status === "suspended") {
      query =
        query.eq(
          "status",
          "suspended",
        );
    }

    /*
     * حالة مراجعة الملف.
     *
     * مثال:
     * approvalStatus = "pending"
     */
    if (approvalStatus) {
      query =
        query.eq(
          "approval_status",
          approvalStatus,
        );
    }

    const cleanSearch =
      search
        ? normalizeSearchValue(
            search,
          )
        : "";

    if (cleanSearch) {
      query =
        query.or(
          [
            `name_en.ilike.%${cleanSearch}%`,
            `name_ar.ilike.%${cleanSearch}%`,
            `display_name_en.ilike.%${cleanSearch}%`,
            `display_name_ar.ilike.%${cleanSearch}%`,
            `category_en.ilike.%${cleanSearch}%`,
            `category_ar.ilike.%${cleanSearch}%`,
            `city_en.ilike.%${cleanSearch}%`,
            `city_ar.ilike.%${cleanSearch}%`,
            `account_phone.ilike.%${cleanSearch}%`,
          ].join(","),
        );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order(
        "id",
        {
          ascending: false,
        },
      )
      .range(
        from,
        to,
      );

    if (error) {
      throw new Error(
        `[TalentRepository.getAdminTalents] ${error.message}`,
      );
    }

    const rows =
      (data ??
        []) as AdminTalentViewRow[];

    const talents =
      rows.map(
        (row) =>
          normalizeAdminTalent(
            row,
          ),
      );

    const total =
      count ?? 0;

    return {
      talents,
      total,

      totalPages:
        Math.max(
          1,
          Math.ceil(
            total /
              pageSize,
          ),
        ),

      currentPage:
        page,

      pageSize,
    };
  }

  static async getAdminStats() {
    const [
      total,
      published,
      unpublished,
      active,
      suspended,
    ] = await Promise.all([
      this.countByFilter(),
      this.countByFilter(
        "published",
      ),
      this.countByFilter(
        "unpublished",
      ),
      this.countByFilter(
        "active",
      ),
      this.countByFilter(
        "suspended",
      ),
    ]);

    return {
      total,
      published,
      unpublished,
      active,
      suspended,
    };
  }

  private static async countByFilter(
    filter?: AdminTalentFilter,
  ) {
    const adminClient =
      this.client();

    let query =
      adminClient
        .from(
          "admin_talent_profiles",
        )
        .select("id", {
          count: "exact",
          head: true,
        });

    if (filter === "published") {
      query =
        query.eq(
          "published",
          true,
        );
    }

    if (filter === "unpublished") {
      query =
        query.eq(
          "published",
          false,
        );
    }

    if (filter === "active") {
      query =
        query.eq(
          "status",
          "active",
        );
    }

    if (filter === "suspended") {
      query =
        query.eq(
          "status",
          "suspended",
        );
    }

    const {
      count,
      error,
    } = await query;

    if (error) {
      throw new Error(
        `[TalentRepository.countByFilter] ${error.message}`,
      );
    }

    return count ?? 0;
  }

  static async getAdminTalentById(
    id: number,
  ): Promise<
    AdminTalent | null
  > {
    const adminClient =
      this.client();

    const {
      data,
      error,
    } = await adminClient
      .from(
        "admin_talent_profiles",
      )
      .select("*")
      .eq(
        "id",
        id,
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        `[TalentRepository.getAdminTalentById] ${error.message}`,
      );
    }

    if (!data) {
      return null;
    }

    return normalizeAdminTalent(
      data as AdminTalentViewRow,
    );
  }

  static async getTopViewed(
    limit = 5,
  ): Promise<
    TopViewedTalent[]
  > {
    const {
      data,
      error,
    } = await this.client()
      .from(
        "admin_talent_profiles",
      )
      .select(`
        id,
        slug,
        name_en,
        name_ar,
        image_url,
        admin_views
      `)
      .order(
        "admin_views",
        {
          ascending: false,
        },
      )
      .limit(limit);

    if (error) {
      throw new Error(
        `[TalentRepository.getTopViewed] ${error.message}`,
      );
    }

    return (
      data ?? []
    ).map(
      (talent) => ({
        id:
          talent.id,

        slug:
          talent.slug,

        name_en:
          talent.name_en,

        name_ar:
          talent.name_ar,

        image_url:
          talent.image_url,

        views:
          normalizeViews(
            talent.admin_views,
          ),
      }),
    );
  }
}