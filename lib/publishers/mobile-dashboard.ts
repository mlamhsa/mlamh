import { isRestrictedAccountStatus } from "@/lib/accounts/account-rules";
import { createAdminClient } from "@/lib/supabase/admin";

export type MobilePublisherOpportunity = {
  id: number;
  title: string;
  status: string | null;
  published: boolean;
  countryCode: string | null;
  createdAt: string | null;
  applications: number;
  accepted: number;
};

export async function getMobilePublisherDashboard({ userId, locale }: { userId: string; locale: "ar" | "en" }) {
  const supabase = createAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,account_type,approval_status,status,display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!profile || profile.account_type !== "publisher") return { ok: false as const, code: "NOT_PUBLISHER" as const };
  if (isRestrictedAccountStatus(profile.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const { data: publisher, error: publisherError } = await supabase
    .from("publishers")
    .select("id,company_name,contact_name,city,verified,verification_status,status,country_code,profile_image_url")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (publisherError) return { ok: false as const, code: "PUBLISHER_LOOKUP_FAILED" as const };
  if (!publisher) return { ok: false as const, code: "PUBLISHER_NOT_FOUND" as const };
  if (isRestrictedAccountStatus(publisher.status)) return { ok: false as const, code: "ACCOUNT_RESTRICTED" as const };

  const { data: opportunities, error: opportunitiesError } = await supabase
    .from("opportunities")
    .select("id,title,title_en,status,published,country_code,created_at")
    .eq("publisher_id", publisher.id)
    .order("created_at", { ascending: false });

  if (opportunitiesError) return { ok: false as const, code: "OPPORTUNITIES_LOOKUP_FAILED" as const };

  const opportunityIds = (opportunities ?? []).map((item) => Number(item.id));
  const counts = new Map<number, { applications: number; accepted: number }>();
  if (opportunityIds.length) {
    const { data: applications, error: applicationsError } = await supabase
      .from("opportunity_applications")
      .select("opportunity_id,status")
      .in("opportunity_id", opportunityIds);
    if (applicationsError) return { ok: false as const, code: "APPLICATIONS_LOOKUP_FAILED" as const };
    for (const application of applications ?? []) {
      const id = Number(application.opportunity_id);
      const current = counts.get(id) ?? { applications: 0, accepted: 0 };
      current.applications += 1;
      if (application.status === "accepted") current.accepted += 1;
      counts.set(id, current);
    }
  }

  const items: MobilePublisherOpportunity[] = (opportunities ?? []).slice(0, 20).map((item) => ({
    id: Number(item.id),
    title: locale === "en" ? item.title_en || item.title : item.title,
    status: item.status ?? null,
    published: Boolean(item.published),
    countryCode: item.country_code ?? null,
    createdAt: item.created_at ?? null,
    applications: counts.get(Number(item.id))?.applications ?? 0,
    accepted: counts.get(Number(item.id))?.accepted ?? 0,
  }));

  return {
    ok: true as const,
    publisher: {
      id: Number(publisher.id),
      name: publisher.company_name || publisher.contact_name || profile.display_name || "MLAMH Publisher",
      city: publisher.city ?? null,
      countryCode: publisher.country_code ?? null,
      verified: Boolean(publisher.verified),
      verificationStatus: publisher.verification_status ?? null,
      approvalStatus: profile.approval_status ?? null,
      status: publisher.status ?? profile.status ?? null,
      imageUrl: publisher.profile_image_url ?? null,
    },
    metrics: {
      opportunities: items.length,
      published: items.filter((item) => item.published).length,
      applications: items.reduce((sum, item) => sum + item.applications, 0),
      accepted: items.reduce((sum, item) => sum + item.accepted, 0),
    },
    opportunities: items,
  };
}
