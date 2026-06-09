import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ContactRequestButton from "@/components/talent/ContactRequestButton";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type PublisherContact = {
  id?: number;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
};

type Application = {
  id: number;
  talent_id: number;
  status: string;
  opportunity_id: number;
  opportunity_title: string;
  opportunity_slug?: string | null;
  opportunity_city_ar?: string | null;
  opportunity_city_en?: string | null;
  opportunity_type?: string | null;
  opportunity_budget?: string | number | null;
  created_at: string;
  publisher?: PublisherContact | null;
};

type Notification = {
  id: number;
  message: string;
  created_at: string;
};

export default async function TalentApplicationsPage({ params }: PageProps) {
  const { locale } = await params;
  const isRtl = locale === "ar";

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>{isRtl ? "يرجى تسجيل الدخول أولاً" : "Please login first"}</p>
      </main>
    );
  }

  const { data: talents } = await adminClient
  .from("talents")
  .select("id")
  .eq("user_id", user.id);

const talentIds =
  talents
    ?.map((talent: any) => talent.id)
    .filter((id: unknown) => typeof id === "number") ?? [];
    console.log("USER ID:", user.id);
console.log("TALENT IDS:", talentIds);

  if (talentIds.length === 0) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 p-10 text-center text-white/50">
          {isRtl
            ? "لم يتم العثور على ملف الموهبة المرتبط بحسابك."
            : "No talent profile was found for your account."}
        </div>
      </main>
    );
  }

  const { data: applications } = await adminClient
    .from("opportunity_applications")
    .select(`
      id,
      talent_id,
      status,
      opportunity_id,
      created_at,
      opportunities (
        id,
        title,
        slug,
        publisher_id,
        city_ar,
        city_en,
        opportunity_type,
        budget
      )
    `)
    .in("talent_id", talentIds)
    .order("created_at", { ascending: false });

  const publisherIds =
    applications
      ?.map((app: any) => {
        const opportunity = Array.isArray(app.opportunities)
          ? app.opportunities[0]
          : app.opportunities;

        return opportunity?.publisher_id;
      })
      .filter(Boolean) ?? [];

  const uniquePublisherIds = Array.from(new Set(publisherIds));

  const { data: publishers } =
    uniquePublisherIds.length > 0
      ? await adminClient
          .from("publishers")
          .select(`
            id,
            company_name,
            email,
            phone,
            website,
            instagram
          `)
          .in("id", uniquePublisherIds)
      : { data: [] };

  const publisherMap = new Map(
    publishers?.map((publisher: any) => [publisher.id, publisher]) ?? []
  );

  const allApplications: Application[] =
    applications?.map((app: any) => {
      const opportunity = Array.isArray(app.opportunities)
        ? app.opportunities[0]
        : app.opportunities;

      const publisher = opportunity?.publisher_id
        ? publisherMap.get(opportunity.publisher_id)
        : null;

      return {
        id: app.id,
        talent_id: app.talent_id,
        status: app.status,
        opportunity_id: app.opportunity_id,
        opportunity_title: opportunity?.title ?? "Untitled",
        opportunity_slug: opportunity?.slug ?? null,
        opportunity_city_ar: opportunity?.city_ar ?? null,
        opportunity_city_en: opportunity?.city_en ?? null,
        opportunity_type: opportunity?.opportunity_type ?? null,
        opportunity_budget: opportunity?.budget ?? null,
        created_at: app.created_at,
        publisher: app.status === "accepted" ? publisher ?? null : null,
      };
    }) ?? [];

  const { data: notifications } = await adminClient
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const allNotifications: Notification[] = notifications ?? [];

  const totalApplications = allApplications.length;
  const acceptedCount = allApplications.filter((app) => app.status === "accepted").length;
  const rejectedCount = allApplications.filter((app) => app.status === "rejected").length;
  const pendingCount = allApplications.filter((app) => app.status === "pending").length;

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            MLAMH Talent
          </p>

          <h1 className="mt-3 text-5xl font-light">
            {isRtl ? "طلبات الفرص" : "My Applications"}
          </h1>

          <p className="mt-3 text-sm text-white/45">
            {isRtl
              ? "تابع الفرص التي تقدمت عليها وحالة كل طلب."
              : "Track the opportunities you have applied for."}
          </p>

          <Link
            href={`/${locale}/talent-dashboard`}
            className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.22em] text-white/60 transition hover:border-gold hover:text-gold"
          >
            {isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label={isRtl ? "كل الطلبات" : "All Applications"} value={totalApplications} />
          <StatCard label={isRtl ? "قيد المراجعة" : "Pending"} value={pendingCount} />
          <StatCard label={isRtl ? "مقبول" : "Accepted"} value={acceptedCount} />
          <StatCard label={isRtl ? "مرفوض" : "Rejected"} value={rejectedCount} />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-light">
            {isRtl ? "الإشعارات" : "Notifications"}
          </h2>

          {allNotifications.length > 0 ? (
            <div className="space-y-2">
              {allNotifications.map((n) => (
                <div key={n.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-4 text-white/70">
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {new Date(n.created_at).toLocaleString(isRtl ? "ar-SA" : "en-US")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/40">
              {isRtl ? "لا توجد إشعارات." : "No notifications."}
            </p>
          )}
        </section>

        <section>
          {allApplications.length > 0 ? (
            <div className="space-y-5">
              {allApplications.map((app) => {
                const city = isRtl
                  ? app.opportunity_city_ar || app.opportunity_city_en || "-"
                  : app.opportunity_city_en || app.opportunity_city_ar || "-";

                return (
                  <article key={app.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                            {isRtl ? "تم التقديم" : "Applied"}
                          </p>

                          <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusClass(app.status)}`}>
                            {statusLabel(app.status, isRtl)}
                          </span>

                          <span className="text-xs uppercase tracking-[0.2em] text-gold">
                            Application #{app.id}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-white/45">
                          {new Date(app.created_at).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                        </p>
                      </div>

                      <div className={isRtl ? "text-right" : "text-left"}>
                        <h3 className="text-2xl font-light">{app.opportunity_title}</h3>

                        {app.publisher?.company_name ? (
                          <p className="mt-2 text-sm text-white/45">
                            {app.publisher.company_name}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 md:grid-cols-4">
                      <InfoItem label={isRtl ? "الحالة" : "Status"} value={statusLabel(app.status, isRtl)} />
                      <InfoItem label={isRtl ? "الميزانية" : "Budget"} value={app.opportunity_budget ?? "-"} />
                      <InfoItem label={isRtl ? "المدينة" : "City"} value={city} />
                      <InfoItem label={isRtl ? "النوع" : "Type"} value={app.opportunity_type ?? "-"} />
                    </div>

                    {app.status === "accepted" && app.publisher ? (
                      <div className="mt-5">
                        <ContactRequestButton
                          applicationId={app.id}
                          opportunityId={app.opportunity_id}
                          publisherId={app.publisher.id ?? 0}
                          talentId={app.talent_id}
                          locale={locale}
                        />

                        <PublisherContactBox publisher={app.publisher} isRtl={isRtl} />
                      </div>
                    ) : null}

                    <div className={`mt-6 flex ${isRtl ? "justify-start" : "justify-end"}`}>
                      <Link
                        href={`/${locale}/opportunities/${app.opportunity_slug ?? app.opportunity_id}`}
                        className="rounded-full border border-gold/50 px-6 py-3 text-xs uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-black"
                      >
                        {isRtl ? "عرض الفرصة" : "View Opportunity"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-white/50">
              {isRtl ? "لم تقدّم أي طلبات بعد." : "You have not applied for any opportunities yet."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PublisherContactBox({
  publisher,
  isRtl,
}: {
  publisher?: PublisherContact | null;
  isRtl: boolean;
}) {
  const email = publisher?.email;
  const phone = publisher?.phone;
  const website = publisher?.website;
  const instagram = publisher?.instagram;

  return (
    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
        {isRtl ? "بيانات التواصل مع الناشر" : "Publisher Contact"}
      </p>

      <h3 className="mt-3 text-xl font-light text-white">
        {publisher?.company_name || (isRtl ? "الناشر" : "Publisher")}
      </h3>

      <p className="mt-2 text-sm leading-7 text-white/55">
        {isRtl
          ? "تم قبولك لهذه الفرصة. يمكنك الآن إرسال طلب تواصل للناشر أو التواصل عبر البيانات المتاحة."
          : "You have been accepted for this opportunity. You can now request contact with the publisher or use the available details."}
      </p>

      <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
        {email ? (
          <a href={`mailto:${email}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/40 hover:text-white">
            {isRtl ? "البريد: " : "Email: "}
            {email}
          </a>
        ) : null}

        {phone ? (
          <a href={`tel:${phone}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/40 hover:text-white">
            {isRtl ? "الجوال: " : "Phone: "}
            {phone}
          </a>
        ) : null}

        {website ? (
          <a href={website} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/40 hover:text-white">
            Website
          </a>
        ) : null}

        {instagram ? (
          <a href={instagram} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 transition hover:border-emerald-300/40 hover:text-white">
            Instagram
          </a>
        ) : null}
      </div>

      {!email && !phone && !website && !instagram ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/45">
          {isRtl
            ? "تم قبولك، لكن الناشر لم يضف بيانات تواصل بعد."
            : "You have been accepted, but the publisher has not added contact details yet."}
        </p>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-3 text-4xl font-light text-white">{value}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</p>
      <p className="mt-2 text-white">{value || "-"}</p>
    </div>
  );
}

function statusLabel(status?: string | null, isRtl = false) {
  switch (status) {
    case "reviewing":
      return isRtl ? "قيد المراجعة" : "Reviewing";
    case "shortlisted":
      return isRtl ? "مختصر" : "Shortlisted";
    case "accepted":
      return isRtl ? "مقبول" : "Accepted";
    case "rejected":
      return isRtl ? "مرفوض" : "Rejected";
    case "pending":
    default:
      return isRtl ? "قيد المراجعة" : "Pending";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "reviewing":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    case "shortlisted":
      return "border-gold/30 bg-gold/10 text-gold";
    case "accepted":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "rejected":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    case "pending":
    default:
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
}