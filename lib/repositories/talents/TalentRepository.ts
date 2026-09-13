import { BaseRepository } from "@/lib/repositories/base/BaseRepository";
import { getTalentProfileDataQualityIssues } from "@/lib/talent/profile-data-quality";
import { getTalentProfileReadiness } from "@/lib/talent/profile-review-readiness";
import type { Talent } from "@/lib/types/talent";

export type AdminTalentFilter =
  | "published"
  | "unpublished"
  | "active"
  | "suspended";

export type AdminTalentVisibilityFilter = "public" | "private";

export type AdminTalentOperationalFilter =
  | "incomplete"
  | "ready_not_submitted"
  | "changes_requested"
  | "data_quality";

export type AdminTalent = Talent & {
  views: number;

  account_phone: string | null;
  approval_status: string | null;
  data_accuracy_contact_consent: boolean | null;
  onboarding_status: string | null;
  onboarding_step: string | null;
  profile_completed_at: string | null;
  account_created_at: string | null;
  account_updated_at: string | null;
};

type AdminTalentViewRow = Talent & {
  admin_views?: number | string | null;

  account_phone?: string | null;
  data_accuracy_contact_consent?: boolean | null;

  approval_status?: string | null;
  onboarding_status?: string | null;
  onboarding_step?: string | null;

  profile_completed_at?: string | null;
  account_created_at?: string | null;
  account_updated_at?: string | null;
};

type TalentProfileReadinessRow = {
  user_id: string;
  phone: string | null;
  approval_status: string | null;
  data_accuracy_contact_consent: boolean | null;
};

export type TopViewedTalent = {
  id: number;
  slug: string | null;
  name_en: string | null;
  name_ar: string | null;
  image_url: string | null;
  views: number;
};

function normalizeViews(value: number | string | null | undefined) {
  const parsedValue = Number(value ?? 0);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeSearchValue(value: string) {
  return value.replaceAll(",", " ").replaceAll("%", "").trim();
}

function normalizeAdminTalent(row: AdminTalentViewRow): AdminTalent {
  const { admin_views, ...talent } = row;

  return {
    ...talent,

    views: normalizeViews(admin_views),

    account_phone: row.account_phone ?? null,
    data_accuracy_contact_consent:
      row.data_accuracy_contact_consent ?? null,

    approval_status: row.approval_status ?? null,

    onboarding_status: row.onboarding_status ?? null,

    onboarding_step: row.onboarding_step ?? null,

    profile_completed_at: row.profile_completed_at ?? null,

    account_created_at: row.account_created_at ?? null,

    account_updated_at: row.account_updated_at ?? null,
  } as AdminTalent;
}

function isReadyNotSubmitted(talent: AdminTalent) {
  return getTalentProfileReadiness({
    ...talent,
    phone: talent.account_phone ?? talent.whatsapp ?? null,
    data_accuracy_contact_consent:
      talent.data_accuracy_contact_consent === true,
  }).isReady;
}

function hasDataQualityIssues(talent: AdminTalent) {
  return getTalentProfileDataQualityIssues(talent).length > 0;
}

export class TalentRepository extends BaseRepository {
  private static async hydrateProfileReadiness(
    talents: AdminTalent[],
  ): Promise<AdminTalent[]> {
    const userIds = [
      ...new Set(
        talents
          .map((talent) => talent.user_id)
          .filter(
            (userId): userId is string =>
              typeof userId === "string" && userId.length > 0,
          ),
      ),
    ];

    if (userIds.length === 0) {
      return talents;
    }

    const { data, error } = await this.client()
      .from("profiles")
      .select(
        "user_id,phone,approval_status,data_accuracy_contact_consent",
      )
      .eq("account_type", "talent")
      .in("user_id", userIds);

    if (error) {
      throw new Error(
        `[TalentRepository.hydrateProfileReadiness] ${error.message}`,
      );
    }

    const profileByUserId = new Map(
      ((data ?? []) as TalentProfileReadinessRow[]).map((profile) => [
        profile.user_id,
        profile,
      ]),
    );

    return talents.map((talent) => {
      if (!talent.user_id) {
        return talent;
      }

      const profile = profileByUserId.get(talent.user_id);
      if (!profile) {
        return talent;
      }

      return {
        ...talent,
        account_phone: profile.phone ?? talent.account_phone,
        approval_status: profile.approval_status ?? talent.approval_status,
        data_accuracy_contact_consent:
          profile.data_accuracy_contact_consent === true,
      };
    });
  }

  static async getAdminTalents({
    page,
    pageSize,
    status,
    search,
    approvalStatus,
    operationalFilter,
    visibility,
  }: {
    page: number;
    pageSize: number;
    status?: AdminTalentFilter;
    search?: string;
    approvalStatus?: string;
    operationalFilter?: AdminTalentOperationalFilter;
    visibility?: AdminTalentVisibilityFilter;
  }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const adminClient = this.client();

    let query = adminClient
      .from("admin_talent_profiles")
      .select("*", { count: "exact" });

    if (status === "published") {
      query = query.eq("published", true);
    }

    if (status === "unpublished") {
      query = query.eq("published", false);
    }

    if (status === "active") {
      query = query.eq("status", "active");
    }

    if (status === "suspended") {
      query = query.eq("status", "suspended");
    }

    if (visibility) {
      query = query.eq("profile_visibility", visibility);
    }

    if (operationalFilter === "changes_requested") {
      query = query.eq("approval_status", "changes_requested");
    } else if (
      operationalFilter === "incomplete" ||
      operationalFilter === "ready_not_submitted"
    ) {
      query = query
        .or("approval_status.is.null,approval_status.eq.not_submitted")
        .not("account_created_at", "is", null);
    } else if (!operationalFilter && approvalStatus) {
      query = query.eq("approval_status", approvalStatus);
    }

    const cleanSearch = search ? normalizeSearchValue(search) : "";

    if (cleanSearch) {
      query = query.or(
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

    if (
      operationalFilter === "incomplete" ||
      operationalFilter === "ready_not_submitted" ||
      operationalFilter === "data_quality"
    ) {
      const { data, error } = await query.order("id", { ascending: false });

      if (error) {
        throw new Error(
          `[TalentRepository.getAdminTalents.operational] ${error.message}`,
        );
      }

      const candidates = await this.hydrateProfileReadiness(
        ((data ?? []) as AdminTalentViewRow[]).map((row) =>
          normalizeAdminTalent(row),
        ),
      );

      const matchingTalents = candidates.filter((talent) => {
        if (operationalFilter === "data_quality") {
          return hasDataQualityIssues(talent);
        }

        const ready = isReadyNotSubmitted(talent);
        return operationalFilter === "ready_not_submitted" ? ready : !ready;
      });

      const total = matchingTalents.length;
      const talents = matchingTalents.slice(from, to + 1);

      return {
        talents,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      };
    }

    const { data, error, count } = await query
      .order("id", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`[TalentRepository.getAdminTalents] ${error.message}`);
    }

    const rows = (data ?? []) as AdminTalentViewRow[];
    const talents = await this.hydrateProfileReadiness(
      rows.map((row) => normalizeAdminTalent(row)),
    );
    const total = count ?? 0;

    return {
      talents,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      currentPage: page,
      pageSize,
    };
  }

  static async getAdminOperationalStats() {
    const adminClient = this.client();

    const [notSubmittedResult, changesRequestedResult, dataQualityResult] =
      await Promise.all([
        adminClient
          .from("admin_talent_profiles")
          .select("*")
          .or("approval_status.is.null,approval_status.eq.not_submitted")
          .not("account_created_at", "is", null),
        adminClient
          .from("admin_talent_profiles")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "changes_requested"),
        adminClient.from("admin_talent_profiles").select("*"),
      ]);

    if (notSubmittedResult.error) {
      throw new Error(
        `[TalentRepository.getAdminOperationalStats.notSubmitted] ${notSubmittedResult.error.message}`,
      );
    }

    if (changesRequestedResult.error) {
      throw new Error(
        `[TalentRepository.getAdminOperationalStats.changesRequested] ${changesRequestedResult.error.message}`,
      );
    }

    if (dataQualityResult.error) {
      throw new Error(
        `[TalentRepository.getAdminOperationalStats.dataQuality] ${dataQualityResult.error.message}`,
      );
    }

    const notSubmittedTalents = await this.hydrateProfileReadiness(
      ((notSubmittedResult.data ?? []) as AdminTalentViewRow[]).map((row) =>
        normalizeAdminTalent(row),
      ),
    );

    let incomplete = 0;
    let readyNotSubmitted = 0;

    for (const talent of notSubmittedTalents) {
      if (isReadyNotSubmitted(talent)) {
        readyNotSubmitted += 1;
      } else {
        incomplete += 1;
      }
    }

    let dataQuality = 0;
    for (const row of (dataQualityResult.data ?? []) as AdminTalentViewRow[]) {
      if (hasDataQualityIssues(normalizeAdminTalent(row))) {
        dataQuality += 1;
      }
    }

    return {
      incomplete,
      readyNotSubmitted,
      changesRequested: changesRequestedResult.count ?? 0,
      dataQuality,
    };
  }

  static async getAdminStats() {
    const [total, published, unpublished, active, suspended, publicProfiles, privateProfiles] =
      await Promise.all([
        this.countByFilter(),
        this.countByFilter("published"),
        this.countByFilter("unpublished"),
        this.countByFilter("active"),
        this.countByFilter("suspended"),
        this.countByVisibility("public"),
        this.countByVisibility("private"),
      ]);

    return {
      total,
      published,
      unpublished,
      active,
      suspended,
      publicProfiles,
      privateProfiles,
    };
  }

  private static async countByFilter(filter?: AdminTalentFilter) {
    const adminClient = this.client();

    let query = adminClient
      .from("admin_talent_profiles")
      .select("id", { count: "exact", head: true });

    if (filter === "published") {
      query = query.eq("published", true);
    }

    if (filter === "unpublished") {
      query = query.eq("published", false);
    }

    if (filter === "active") {
      query = query.eq("status", "active");
    }

    if (filter === "suspended") {
      query = query.eq("status", "suspended");
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`[TalentRepository.countByFilter] ${error.message}`);
    }

    return count ?? 0;
  }

  private static async countByVisibility(visibility: AdminTalentVisibilityFilter) {
    const { count, error } = await this.client()
      .from("admin_talent_profiles")
      .select("id", { count: "exact", head: true })
      .eq("profile_visibility", visibility);

    if (error) {
      throw new Error(`[TalentRepository.countByVisibility] ${error.message}`);
    }

    return count ?? 0;
  }

  static async getAdminTalentById(id: number): Promise<AdminTalent | null> {
    const adminClient = this.client();

    const { data, error } = await adminClient
      .from("admin_talent_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`[TalentRepository.getAdminTalentById] ${error.message}`);
    }

    if (!data) {
      return null;
    }

    const [talent] = await this.hydrateProfileReadiness([
      normalizeAdminTalent(data as AdminTalentViewRow),
    ]);

    return talent ?? null;
  }

  static async getTopViewed(limit = 5): Promise<TopViewedTalent[]> {
    const { data, error } = await this.client()
      .from("admin_talent_profiles")
      .select(`
        id,
        slug,
        name_en,
        name_ar,
        image_url,
        admin_views
      `)
      .order("admin_views", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`[TalentRepository.getTopViewed] ${error.message}`);
    }

    return (data ?? []).map((talent) => ({
      id: talent.id,
      slug: talent.slug,
      name_en: talent.name_en,
      name_ar: talent.name_ar,
      image_url: talent.image_url,
      views: normalizeViews(talent.admin_views),
    }));
  }
}
