import Link from "next/link";

import {
  AdminActionButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
  AdminPageContainer,
  AdminPageHeader,
} from "@/components/admin/ui";
import {
  clearFeaturedOpportunityAction,
  setFeaturedOpportunityAction,
} from "@/lib/actions/admin-opportunity-actions";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Featured Opportunities — MLAMH Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

function formatFeaturedUntil(value: string | null, isArabic: boolean) {
  if (!value) return isArabic ? "بدون تاريخ انتهاء" : "No expiry date";

  return new Date(value).toLocaleDateString(
    isArabic ? "ar-SA-u-nu-latn" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
}

export default async function FeaturedOpportunitiesAdminPage({
  searchParams,
}: PageProps) {
  await requireAdminAccess();

  const params = searchParams ? await searchParams : {};
  const isArabic = params.lang !== "en";
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("opportunities")
    .select(
      "id,title,slug,company_name,status,published,featured,featured_until,created_at",
    )
    .eq("published", true)
    .in("status", ["published", "open"])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`[FeaturedOpportunitiesAdminPage] ${error.message}`);
  }

  const opportunities = data ?? [];
  const now = Date.now();
  const activeFeaturedCount = opportunities.filter(
    (opportunity) =>
      opportunity.featured === true &&
      (!opportunity.featured_until ||
        Date.parse(opportunity.featured_until) > now),
  ).length;

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title={isArabic ? "الفرص المميزة" : "Featured Opportunities"}
        description={
          isArabic
            ? "تحكم إداري مستقل لتمييز الفرص المنشورة. التمييز الإداري الحالي مدته 30 يومًا ولا يعتمد على الدفع."
            : "Independent admin controls for published featured opportunities. Admin featuring currently lasts 30 days and does not depend on payment."
        }
        actions={
          <Link
            href={`/admin/opportunities?lang=${isArabic ? "ar" : "en"}`}
            className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            {isArabic ? "جميع الفرص" : "All Opportunities"}
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <AdminCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
            {isArabic ? "الفرص المنشورة" : "Published Opportunities"}
          </p>
          <p className="mt-3 text-3xl font-light text-white">
            {opportunities.length}
          </p>
        </AdminCard>

        <AdminCard className="p-5">
          <p className="text-[9px] uppercase tracking-[0.25em] text-gray-muted">
            {isArabic ? "المميزة حاليًا" : "Active Featured"}
          </p>
          <p className="mt-3 text-3xl font-light text-gold">
            {activeFeaturedCount}
          </p>
        </AdminCard>
      </div>

      {opportunities.length === 0 ? (
        <AdminEmptyState
          message={
            isArabic
              ? "لا توجد فرص منشورة يمكن تمييزها حاليًا."
              : "There are no published opportunities available to feature."
          }
        />
      ) : (
        <section className="grid gap-4">
          {opportunities.map((opportunity) => {
            const isActiveFeatured =
              opportunity.featured === true &&
              (!opportunity.featured_until ||
                Date.parse(opportunity.featured_until) > now);

            return (
              <AdminCard key={opportunity.id} className="p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminBadge variant={isActiveFeatured ? "gold" : "muted"}>
                        {isActiveFeatured
                          ? isArabic
                            ? "مميزة"
                            : "Featured"
                          : isArabic
                            ? "عادية"
                            : "Standard"}
                      </AdminBadge>
                      <span className="text-xs text-white/35">
                        #{opportunity.id}
                      </span>
                    </div>

                    <h2 className="mt-3 truncate text-xl font-light text-white">
                      {opportunity.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-muted">
                      {opportunity.company_name || "MLAMH"}
                    </p>

                    {isActiveFeatured ? (
                      <p className="mt-3 text-xs text-gold/80">
                        {isArabic ? "حتى: " : "Until: "}
                        {formatFeaturedUntil(
                          opportunity.featured_until,
                          isArabic,
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/opportunities/${opportunity.id}?lang=${isArabic ? "ar" : "en"}`}
                      className="rounded-full border border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.25em] text-white/60 transition hover:border-gold/40 hover:text-gold"
                    >
                      {isArabic ? "التفاصيل" : "Details"}
                    </Link>

                    {isActiveFeatured ? (
                      <form action={clearFeaturedOpportunityAction}>
                        <input type="hidden" name="id" value={opportunity.id} />
                        <AdminActionButton type="submit" variant="warning">
                          {isArabic ? "إلغاء التمييز" : "Remove Featured"}
                        </AdminActionButton>
                      </form>
                    ) : (
                      <form action={setFeaturedOpportunityAction}>
                        <input type="hidden" name="id" value={opportunity.id} />
                        <AdminActionButton type="submit" variant="gold">
                          {isArabic ? "تمييز 30 يوم" : "Feature 30 Days"}
                        </AdminActionButton>
                      </form>
                    )}
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </section>
      )}
    </AdminPageContainer>
  );
}
