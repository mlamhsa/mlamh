import {
    AdminEmptyState,
    AdminGrid,
    AdminPageContainer,
    AdminPageHeader,
    AdminStatCard,
  } from "@/components/admin/ui";
  
  import {
    AuditCard,
    type AuditEvent,
  } from "@/components/admin/system/AuditCard";
  
  import { requireAdminAccess } from "@/lib/auth/require-admin";
  import { createAdminClient } from "@/lib/supabase/admin";
  
  export const metadata = {
    title: "Audit Log — MLAMH Admin",
    robots: {
      index: false,
      follow: false,
    },
  };
  
  export const dynamic =
    "force-dynamic";
  
  type PageProps = {
    searchParams: Promise<{
      lang?: string;
      q?: string;
      target?: string;
      event?: string;
    }>;
  };
  
  function buildHref({
    lang,
    q,
    target,
    event,
  }: {
    lang?: string;
    q?: string;
    target?: string;
    event?: string;
  }) {
    const params =
      new URLSearchParams();
  
    if (lang) {
      params.set(
        "lang",
        lang,
      );
    }
  
    if (q) {
      params.set(
        "q",
        q,
      );
    }
  
    if (target) {
      params.set(
        "target",
        target,
      );
    }
  
    if (event) {
      params.set(
        "event",
        event,
      );
    }
  
    const query =
      params.toString();
  
    return query
      ? `/admin/audit-log?${query}`
      : "/admin/audit-log";
  }
  
  export default async function AdminAuditLogPage({
    searchParams,
  }: PageProps) {
    await requireAdminAccess();
  
    const {
      lang = "ar",
      q,
      target,
      event,
    } = await searchParams;
  
    const language:
      | "ar"
      | "en" =
      lang === "en"
        ? "en"
        : "ar";
  
    const isArabic =
      language === "ar";
  
    const adminClient =
      createAdminClient();
  
    let query = adminClient
      .from("events")
      .select(`
        id,
        event_type,
        target_type,
        target_id,
        actor_id,
        metadata,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(500);
  
    if (target) {
      query = query.eq(
        "target_type",
        target,
      );
    }
  
    if (event) {
      query = query.eq(
        "event_type",
        event,
      );
    }
  
    const {
      data,
      error,
    } = await query;
  
    if (error) {
      throw new Error(
        `[AdminAuditLogPage] ${error.message}`,
      );
    }
  
    const events =
      (data ??
        []) as AuditEvent[];
  
    const cleanSearch =
      q?.trim().toLowerCase() ??
      "";
  
    const filteredEvents =
      events.filter(
        (item) => {
          if (!cleanSearch) {
            return true;
          }
  
          const metadataText =
            item.metadata
              ? JSON.stringify(
                  item.metadata,
                )
              : "";
  
          const haystack = [
            item.event_type,
            item.target_type,
            item.target_id,
            item.actor_id,
            metadataText,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
  
          return haystack.includes(
            cleanSearch,
          );
        },
      );
  
    const total =
      events.length;
  
    const adminTarget =
      events.filter(
        (item) =>
          item.target_type ===
          "admin",
      ).length;
  
    const talentTarget =
      events.filter(
        (item) =>
          item.target_type ===
          "talent",
      ).length;
  
    const publisherTarget =
      events.filter(
        (item) =>
          item.target_type ===
          "publisher",
      ).length;
  
    const opportunityTarget =
      events.filter(
        (item) =>
          item.target_type ===
          "opportunity",
      ).length;
  
    return (
      <AdminPageContainer>
        <AdminPageHeader
          title={
            isArabic
              ? "سجل العمليات"
              : "Audit Log"
          }
          description={
            isArabic
              ? "سجل زمني للأحداث والقرارات والعمليات المسجلة داخل المنصة."
              : "A chronological record of events, decisions, and operational activity across the platform."
          }
        />
  
        <AdminGrid className="mb-8 md:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard
            label={
              isArabic
                ? "إجمالي الأحداث"
                : "Total events"
            }
            value={total}
            active={!target}
            href={buildHref({
              lang,
              q,
            })}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الإدارة"
                : "Admin"
            }
            value={adminTarget}
            active={
              target ===
              "admin"
            }
            href={buildHref({
              lang,
              q,
              target:
                "admin",
            })}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "المواهب"
                : "Talents"
            }
            value={talentTarget}
            active={
              target ===
              "talent"
            }
            href={buildHref({
              lang,
              q,
              target:
                "talent",
            })}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الناشرون"
                : "Publishers"
            }
            value={publisherTarget}
            active={
              target ===
              "publisher"
            }
            href={buildHref({
              lang,
              q,
              target:
                "publisher",
            })}
          />
  
          <AdminStatCard
            label={
              isArabic
                ? "الفرص"
                : "Opportunities"
            }
            value={opportunityTarget}
            active={
              target ===
              "opportunity"
            }
            href={buildHref({
              lang,
              q,
              target:
                "opportunity",
            })}
          />
        </AdminGrid>
  
        <form
          method="GET"
          className="mb-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5"
        >
          <input
            type="hidden"
            name="lang"
            value={language}
          />
  
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_240px_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder={
                isArabic
                  ? "ابحث في نوع الحدث أو المستهدف أو البيانات..."
                  : "Search event type, target, actor, or metadata..."
              }
              className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/30"
            />
  
            <select
              name="target"
              defaultValue={
                target ?? ""
              }
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
            >
              <option value="">
                {isArabic
                  ? "كل المستهدفين"
                  : "All targets"}
              </option>
  
              <option value="admin">
                {isArabic
                  ? "الإدارة"
                  : "Admin"}
              </option>
  
              <option value="talent">
                {isArabic
                  ? "المواهب"
                  : "Talents"}
              </option>
  
              <option value="publisher">
                {isArabic
                  ? "الناشرون"
                  : "Publishers"}
              </option>
  
              <option value="opportunity">
                {isArabic
                  ? "الفرص"
                  : "Opportunities"}
              </option>
            </select>
  
            <select
              name="event"
              defaultValue={
                event ?? ""
              }
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-white outline-none"
            >
              <option value="">
                {isArabic
                  ? "كل أنواع الأحداث"
                  : "All event types"}
              </option>
  
              <option value="talent_approved">
                talent_approved
              </option>
  
              <option value="talent_changes_requested">
                talent_changes_requested
              </option>
  
              <option value="talent_rejected">
                talent_rejected
              </option>
  
              <option value="publisher_verified">
                publisher_verified
              </option>
  
              <option value="publisher_changes_requested">
                publisher_changes_requested
              </option>
  
              <option value="publisher_rejected">
                publisher_rejected
              </option>
  
              <option value="opportunity_pending_review">
                opportunity_pending_review
              </option>
  
              <option value="opportunity_published">
                opportunity_published
              </option>
  
              <option value="opportunity_rejected">
                opportunity_rejected
              </option>
  
              <option value="opportunity_needs_changes">
                opportunity_needs_changes
              </option>
  
              <option value="opportunity_invitation">
                opportunity_invitation
              </option>
  
              <option value="application_created">
                application_created
              </option>
  
              <option value="application_accepted">
                application_accepted
              </option>
  
              <option value="application_rejected">
                application_rejected
              </option>
            </select>
  
            <button
              type="submit"
              className="rounded-2xl border border-gold/35 bg-gold/[0.05] px-7 py-4 text-sm text-gold transition hover:bg-gold hover:text-black"
            >
              {isArabic
                ? "بحث"
                : "Search"}
            </button>
          </div>
        </form>
  
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/70">
              {isArabic
                ? "السجل"
                : "Timeline"}
            </p>
  
            <h2 className="mt-1 text-xl font-light text-white">
              {isArabic
                ? "آخر العمليات"
                : "Latest activity"}
            </h2>
          </div>
  
          <p className="text-xs text-white/35">
            {isArabic
              ? `${filteredEvents.length} نتيجة`
              : `${filteredEvents.length} results`}
          </p>
        </div>
  
        {filteredEvents.length ===
        0 ? (
          <AdminEmptyState
            message={
              isArabic
                ? "لا توجد عمليات مطابقة."
                : "No matching audit events."
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(
              (item) => (
                <AuditCard
                  key={
                    item.id
                  }
                  event={item}
                  language={
                    language
                  }
                />
              ),
            )}
          </div>
        )}
      </AdminPageContainer>
    );
  }