import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: { index: false, follow: false },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "تم استلام الطلب", en: "Brief received" },
  qualified: { ar: "تمت مراجعة الاحتياج", en: "Brief qualified" },
  proposal: { ar: "إعداد العرض", en: "Proposal in progress" },
  awaiting_client: { ar: "بانتظار موافقة العميل", en: "Awaiting client approval" },
  active: { ar: "المشروع نشط", en: "Casting active" },
  screening: { ar: "جاري فرز المتقدمين", en: "Screening applications" },
  shortlist_ready: { ar: "القائمة المختصرة جاهزة", en: "Shortlist ready" },
  client_review: { ar: "جاهز لمراجعة العميل", en: "Ready for client review" },
  completed: { ar: "اكتمل المشروع", en: "Casting completed" },
  cancelled: { ar: "تم إغلاق المشروع", en: "Project closed" },
};

const stages = [
  "new",
  "qualified",
  "proposal",
  "awaiting_client",
  "active",
  "screening",
  "shortlist_ready",
  "client_review",
  "completed",
];

export default async function CastingStatusPage({
  params,
}: {
  params: Promise<{ locale?: string; token: string }>;
}) {
  const { locale = "ar", token } = await params;
  const language = locale === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const cleanToken = token.trim();

  if (!cleanToken || cleanToken.length > 100) notFound();

  const adminClient = createAdminClient();
  const { data: project, error } = await adminClient
    .from("casting_projects")
    .select(
      "id,project_title,company_name,status,package_code,quoted_amount,currency,work_date,city,required_count,talent_type,client_status_note,opportunity_id,created_at,updated_at",
    )
    .eq("client_access_token", cleanToken)
    .maybeSingle();

  if (error) {
    console.error("[CastingStatusPage project]", error);
  }

  if (!project) notFound();

  const opportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;
  const [{ count: applicationCount }, { data: shortlist }, { data: opportunity }] = await Promise.all([
    opportunityId
      ? adminClient
          .from("opportunity_applications")
          .select("id", { count: "exact", head: true })
          .eq("opportunity_id", opportunityId)
      : Promise.resolve({ count: 0 }),
    adminClient
      .from("casting_shortlist")
      .select("status")
      .eq("casting_project_id", project.id),
    opportunityId
      ? adminClient
          .from("opportunities")
          .select("slug,published,status")
          .eq("id", opportunityId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const shortlistRows = shortlist ?? [];
  const shortlistCount = shortlistRows.filter((item) =>
    ["shortlisted", "presented", "selected"].includes(item.status),
  ).length;
  const selectedCount = shortlistRows.filter((item) => item.status === "selected").length;
  const currentIndex = project.status === "cancelled" ? -1 : stages.indexOf(project.status);
  const label = statusLabels[project.status] ?? {
    ar: project.status,
    en: project.status,
  };

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 pb-24 pt-24 text-white sm:px-6 lg:pt-32"
    >
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.14),transparent_42%),rgba(255,255,255,0.025)] p-6 sm:p-9">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">MLAMH CASTING</p>
          <h1 className="mt-4 text-3xl font-light sm:text-5xl">{project.project_title}</h1>
          <p className="mt-3 text-sm text-white/45">
            {project.company_name || (isArabic ? "مشروع Casting مُدار بواسطة ملامح" : "Managed casting project by MLAMH")}
          </p>
          <div className="mt-6 inline-flex rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-sm text-gold">
            {isArabic ? label.ar : label.en}
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            [isArabic ? "الطلبات" : "Applications", applicationCount ?? 0],
            [isArabic ? "القائمة المختصرة" : "Shortlist", shortlistCount],
            [isArabic ? "تم الاختيار" : "Selected", selectedCount],
          ].map(([title, value]) => (
            <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <p className="text-xs text-white/35">{title}</p>
              <p className="mt-3 text-3xl font-light text-white">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
          <h2 className="text-xl font-light text-white">
            {isArabic ? "تقدم المشروع" : "Project progress"}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stages.map((stage, index) => {
              const stageLabel = statusLabels[stage];
              const completed = currentIndex >= index;
              return (
                <div
                  key={stage}
                  className={`rounded-xl border p-4 text-xs leading-6 ${
                    completed
                      ? "border-gold/25 bg-gold/[0.06] text-gold"
                      : "border-white/[0.07] bg-black/20 text-white/30"
                  }`}
                >
                  {isArabic ? stageLabel.ar : stageLabel.en}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-light text-white">
              {isArabic ? "آخر تحديث من فريق ملامح" : "Latest update from MLAMH"}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-white/55">
              {project.client_status_note ||
                (isArabic
                  ? "سيظهر هنا آخر تحديث مخصص للعميل من فريق MLAMH Casting."
                  : "The latest client-facing update from MLAMH Casting will appear here.")}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <h2 className="text-xl font-light text-white">
              {isArabic ? "تفاصيل المشروع" : "Project details"}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                <dt className="text-white/35">{isArabic ? "المواهب" : "Talent"}</dt>
                <dd className="text-white/70">{project.talent_type} × {project.required_count}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                <dt className="text-white/35">{isArabic ? "المدينة" : "City"}</dt>
                <dd className="text-white/70">{project.city || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                <dt className="text-white/35">{isArabic ? "تاريخ العمل" : "Work date"}</dt>
                <dd className="text-white/70">{project.work_date || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/[0.06] pb-3">
                <dt className="text-white/35">{isArabic ? "الباقة" : "Package"}</dt>
                <dd className="capitalize text-white/70">{project.package_code || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/35">{isArabic ? "العرض" : "Quote"}</dt>
                <dd className="text-white/70">
                  {project.quoted_amount != null ? `${project.quoted_amount} ${project.currency}` : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {opportunity?.slug && opportunity.published ? (
          <Link
            href={`/${language}/opportunities/${opportunity.slug}`}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border border-gold/30 px-6 text-sm text-gold transition hover:bg-gold/10"
          >
            {isArabic ? "عرض فرصة المشروع" : "View project opportunity"}
          </Link>
        ) : null}

        <p className="mt-8 text-xs leading-6 text-white/25">
          {isArabic
            ? "هذا رابط متابعة خاص بالمشروع. لا تشاركه خارج فريقك. البيانات المعروضة هنا مخصصة لمتابعة حالة الخدمة ولا تمثل عقدًا أو ضمانًا لاختيار مواهب."
            : "This is a private project tracking link. Do not share it outside your team. The information shown here is for service-status tracking and is not a contract or guarantee of talent selection."}
        </p>
      </div>
    </main>
  );
}
