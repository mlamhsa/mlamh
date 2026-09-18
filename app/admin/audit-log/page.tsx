import Link from "next/link";

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
  
  import { requirePermission } from "@/lib/rbac/guards";
import { PERMISSIONS } from "@/lib/rbac/permissions";
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
      actor?: string;
      page?: string;
    }>;
  };
  
  function buildHref({
    lang,
    q,
    target,
    event,
    actor,
    page,
  }: {
    lang?: string;
    q?: string;
    target?: string;
    event?: string;
    actor?: string;
    page?: number;
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

    if (actor) {
      params.set(
        "actor",
        actor,
      );
    }

    if (
      page &&
      page > 1
    ) {
      params.set(
        "page",
        String(page),
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
    await requirePermission(
      PERMISSIONS.ADMINS_VIEW,
    );
  
    const {
      lang = "ar",
      q,
      target,
      event,
      actor,
      page,
    } = await searchParams;
  
    const language:
      | "ar"
      | "en" =
      lang === "en"
        ? "en"
        : "ar";
  
    const isArabic =
      language === "ar";

    const cleanSearch =
      q?.trim().toLowerCase() ??
      "";

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    const exactIdSearch =
      uuidPattern.test(
        cleanSearch,
      );

    const cleanActor =
      actor?.trim() ?? "";

    const actorFilter =
      uuidPattern.test(
        cleanActor,
      )
        ? cleanActor
        : null;

    const requestedPage =
      Number.parseInt(
        page ?? "1",
        10,
      );

    const currentPage =
      Number.isFinite(
        requestedPage,
      ) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const pageSize = 100;

    const databaseSearchMode =
      !cleanSearch ||
      exactIdSearch;

    const adminClient =
      createAdminClient();
  
    let query = adminClient
      .from("events")
      .select(
        `
          id,
          event_type,
          target_type,
          target_id,
          actor_id,
          metadata,
          created_at
        `,
        {
          count: databaseSearchMode
            ? "exact"
            : undefined,
        },
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );
  
    if (actorFilter) {
      query = query.eq(
        "actor_id",
        actorFilter,
      );
    }

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

    if (
      exactIdSearch &&
      cleanSearch
    ) {
      query = query.or(
        `actor_id.eq.${cleanSearch},target_id.eq.${cleanSearch}`,
      );
    }

    if (databaseSearchMode) {
      const from =
        (currentPage - 1) *
        pageSize;

      query = query.range(
        from,
        from + pageSize - 1,
      );
    } else {
      query = query.limit(500);
    }
  
    const {
      data,
      error,
      count,
    } = await query;
  
    if (error) {
      throw new Error(
        `[AdminAuditLogPage] ${error.message}`,
      );
    }
  
    const events =
      (data ??
        []) as AuditEvent[];
  
    const filteredEvents =
      events.filter(
        (item) => {
          if (
            !cleanSearch ||
            exactIdSearch
          ) {
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
  
    const createCountQuery = (
      targetType?: string,
    ) => {
      let countQuery = adminClient
        .from("events")
        .select("id", {
          count: "exact",
          head: true,
        });

      if (actorFilter) {
        countQuery =
          countQuery.eq(
            "actor_id",
            actorFilter,
          );
      }

      if (event) {
        countQuery =
          countQuery.eq(
            "event_type",
            event,
          );
      }

      if (targetType) {
        countQuery =
          countQuery.eq(
            "target_type",
            targetType,
          );
      }

      if (
        exactIdSearch &&
        cleanSearch
      ) {
        countQuery =
          countQuery.or(
            `actor_id.eq.${cleanSearch},target_id.eq.${cleanSearch}`,
          );
      }

      return countQuery;
    };

    let total =
      filteredEvents.length;
    let adminTarget =
      filteredEvents.filter(
        (item) =>
          item.target_type ===
          "admin",
      ).length;
    let talentTarget =
      filteredEvents.filter(
        (item) =>
          item.target_type ===
          "talent",
      ).length;
    let publisherTarget =
      filteredEvents.filter(
        (item) =>
          item.target_type ===
          "publisher",
      ).length;
    let opportunityTarget =
      filteredEvents.filter(
        (item) =>
          item.target_type ===
          "opportunity",
      ).length;

    if (databaseSearchMode) {
      const [
        totalCountResult,
        adminCountResult,
        talentCountResult,
        publisherCountResult,
        opportunityCountResult,
      ] = await Promise.all([
        createCountQuery(),
        createCountQuery(
          "admin",
        ),
        createCountQuery(
          "talent",
        ),
        createCountQuery(
          "publisher",
        ),
        createCountQuery(
          "opportunity",
        ),
      ]);

      const countErrors = [
        totalCountResult.error,
        adminCountResult.error,
        talentCountResult.error,
        publisherCountResult.error,
        opportunityCountResult.error,
      ].filter(Boolean);

      if (countErrors.length > 0) {
        console.error(
          "[AdminAuditLogPage counts]",
          countErrors,
        );
      } else {
        total =
          totalCountResult.count ??
          count ??
          filteredEvents.length;
        adminTarget =
          adminCountResult.count ??
          0;
        talentTarget =
          talentCountResult.count ??
          0;
        publisherTarget =
          publisherCountResult.count ??
          0;
        opportunityTarget =
          opportunityCountResult.count ??
          0;
      }
    }

    const matchingCount =
      databaseSearchMode
        ? count ??
          filteredEvents.length
        : filteredEvents.length;

    const totalPages =
      databaseSearchMode
        ? Math.max(
            1,
            Math.ceil(
              matchingCount /
                pageSize,
            ),
          )
        : 1;

    const actorIdentity =
      actorFilter
        ? await adminClient
            .from("admin_users")
            .select("email")
            .eq("id", actorFilter)
            .maybeSingle()
        : null;

    if (
      actorIdentity?.error
    ) {
      console.error(
        "[AdminAuditLogPage actor identity]",
        actorIdentity.error,
      );
    }

    const actorEmail =
      actorIdentity?.data?.email ??
      null;
  
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
              ? actorFilter
                ? "عرض مخصص لكل العمليات التي نفذها هذا المشرف عبر المنصة. يمكن تضييق النتائج بالمستهدف أو نوع الحدث."
                : cleanSearch &&
                    !exactIdSearch
                  ? "بحث نصي داخل أحدث 500 حدث مسجل. استخدم معرّف UUID للوصول المباشر إلى السجل الكامل لمشرف أو مستهدف."
                  : "سجل زمني كامل للأحداث والقرارات والعمليات المسجلة داخل المنصة مع تقسيم النتائج إلى صفحات."
              : actorFilter
                ? "A dedicated view of every recorded platform action performed by this admin. Narrow the results by target or event type."
                : cleanSearch &&
                    !exactIdSearch
                  ? "Free-text search across the latest 500 recorded events. Use a UUID for direct full-history lookup by actor or target."
                  : "A complete chronological audit trail with server-side pagination for recorded platform events."
          }
        />

        {actorFilter ? (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/15 bg-gold/[0.045] px-4 py-3 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-gold/80">
                {isArabic
                  ? "فلتر نشاط مشرف محدد"
                  : "Specific admin activity filter"}
              </p>
              {actorEmail ? (
                <p
                  dir="ltr"
                  className="mt-1 text-xs text-white/55"
                >
                  {actorEmail}
                </p>
              ) : null}

              <p
                dir="ltr"
                className="mt-1 font-mono text-[10px] text-white/35"
              >
                {actorFilter}
              </p>
            </div>

            <Link
              href={buildHref({
                lang,
                q,
                target,
                event,
              })}
              className="shrink-0 rounded-xl border border-white/[0.09] px-3 py-2 text-[11px] text-white/50 transition hover:border-gold/20 hover:text-gold"
            >
              {isArabic
                ? "عرض سجل جميع المشرفين"
                : "Show all admin activity"}
            </Link>
          </div>
        ) : null}
  
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
              actor: actorFilter ?? undefined,
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
              actor: actorFilter ?? undefined,
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
              actor: actorFilter ?? undefined,
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
              actor: actorFilter ?? undefined,
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
              actor: actorFilter ?? undefined,
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

          {actorFilter ? (
            <input
              type="hidden"
              name="actor"
              value={actorFilter}
            />
          ) : null}
  
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

              <option value="auth_user">
                {isArabic
                  ? "حسابات المصادقة"
                  : "Auth users"}
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

              <option value="application">
                {isArabic
                  ? "طلبات التقديم"
                  : "Applications"}
              </option>

              <option value="claim_request">
                {isArabic
                  ? "طلبات المطالبة"
                  : "Claim requests"}
              </option>

              <option value="support">
                {isArabic
                  ? "الدعم"
                  : "Support"}
              </option>

              <option value="message">
                {isArabic
                  ? "الرسائل"
                  : "Messages"}
              </option>

              <option value="conversation">
                {isArabic
                  ? "المحادثات"
                  : "Conversations"}
              </option>

              <option value="casting_project">
                {isArabic
                  ? "مشاريع الكاستينغ"
                  : "Casting projects"}
              </option>

              <option value="payment">
                {isArabic
                  ? "المدفوعات"
                  : "Payments"}
              </option>

              <option value="entitlement">
                {isArabic
                  ? "الاستحقاقات"
                  : "Entitlements"}
              </option>

              <option value="notification">
                {isArabic
                  ? "الإشعارات"
                  : "Notifications"}
              </option>

              <option value="scene_article">
                {isArabic
                  ? "محتوى مشهد"
                  : "Scene content"}
              </option>

              <option value="casting_file">
                {isArabic
                  ? "ملفات الكاستينغ"
                  : "Casting files"}
              </option>

              <option value="managed_casting_invitation">
                {isArabic
                  ? "دعوات الكاستينغ المُدار"
                  : "Managed casting invitations"}
              </option>

              <option value="casting_role">
                {isArabic
                  ? "أدوار الكاستينغ"
                  : "Casting roles"}
              </option>

              <option value="casting_shortlist">
                {isArabic
                  ? "القوائم المختصرة"
                  : "Casting shortlists"}
              </option>

              <option value="booking">
                {isArabic
                  ? "حجوزات المواهب"
                  : "Talent bookings"}
              </option>

              <option value="casting_replacement">
                {isArabic
                  ? "استبدالات المواهب"
                  : "Casting replacements"}
              </option>

              <option value="investor">
                {isArabic
                  ? "المستثمرون"
                  : "Investors"}
              </option>

              <option value="investor_outreach">
                {isArabic
                  ? "تواصل المستثمرين"
                  : "Investor outreach"}
              </option>

              <option value="integration">
                {isArabic
                  ? "التكاملات"
                  : "Integrations"}
              </option>

              <option value="verification_proof">
                {isArabic
                  ? "مستندات التحقق"
                  : "Verification proofs"}
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
  
              <option value="admin_invited">
                admin_invited
              </option>

              <option value="admin_invite_resent">
                admin_invite_resent
              </option>

              <option value="admin_invite_cancelled">
                admin_invite_cancelled
              </option>

              <option value="admin_access_action_blocked">
                admin_access_action_blocked
              </option>

              <option value="admin_access_action_failed">
                admin_access_action_failed
              </option>

              <option value="admin_access_action_noop">
                admin_access_action_noop
              </option>

              <option value="admin_action_success">
                admin_action_success
              </option>

              <option value="admin_action_blocked">
                admin_action_blocked
              </option>

              <option value="admin_action_failed">
                admin_action_failed
              </option>

              <option value="admin_action_noop">
                admin_action_noop
              </option>

              <option value="admin_role_changed">
                admin_role_changed
              </option>

              <option value="admin_access_revoked">
                admin_access_revoked
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
            {databaseSearchMode
              ? isArabic
                ? `${matchingCount} نتيجة · الصفحة ${currentPage} من ${totalPages}`
                : `${matchingCount} results · page ${currentPage} of ${totalPages}`
              : isArabic
                ? `${filteredEvents.length} نتيجة ضمن أحدث 500 حدث`
                : `${filteredEvents.length} results within the latest 500 events`}
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

        {databaseSearchMode &&
        totalPages > 1 ? (
          <nav
            aria-label={
              isArabic
                ? "صفحات سجل العمليات"
                : "Audit log pages"
            }
            className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"
          >
            {currentPage > 1 ? (
              <Link
                href={buildHref({
                  lang,
                  q,
                  target,
                  event,
                  actor:
                    actorFilter ??
                    undefined,
                  page:
                    currentPage -
                    1,
                })}
                className="rounded-xl border border-white/[0.09] px-4 py-2 text-xs text-white/55 transition hover:border-gold/20 hover:text-gold"
              >
                {isArabic
                  ? "السابق"
                  : "Previous"}
              </Link>
            ) : (
              <span />
            )}

            <span className="text-[11px] text-white/35">
              {isArabic
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>

            {currentPage <
            totalPages ? (
              <Link
                href={buildHref({
                  lang,
                  q,
                  target,
                  event,
                  actor:
                    actorFilter ??
                    undefined,
                  page:
                    currentPage +
                    1,
                })}
                className="rounded-xl border border-gold/20 bg-gold/[0.05] px-4 py-2 text-xs text-gold transition hover:bg-gold hover:text-black"
              >
                {isArabic
                  ? "التالي"
                  : "Next"}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </AdminPageContainer>
    );
  }