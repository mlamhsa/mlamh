import Link from "next/link";
import { revalidatePath } from "next/cache";
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

const shortlistStatusLabels: Record<string, { ar: string; en: string }> = {
  shortlisted: { ar: "مرشح", en: "Shortlisted" },
  presented: { ar: "معروض للعميل", en: "Presented" },
  selected: { ar: "تم الاختيار", en: "Selected" },
  declined: { ar: "غير مختار", en: "Not selected" },
  withdrawn: { ar: "منسحب", en: "Withdrawn" },
};

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

  const projectId = project.id;
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
      .select("id,application_id,status,rank,created_at")
      .eq("casting_project_id", project.id)
      .order("rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    opportunityId
      ? adminClient
          .from("opportunities")
          .select("slug,published,status")
          .eq("id", opportunityId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const shortlistRows = shortlist ?? [];
  const applicationIds = shortlistRows
    .map((item) => Number(item.application_id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const { data: shortlistApplications } = applicationIds.length
    ? await adminClient
        .from("opportunity_applications")
        .select("id,talent_id")
        .in("id", applicationIds)
    : { data: [] as Array<{ id: number; talent_id: number }> };

  const applicationMap = new Map(
    (shortlistApplications ?? []).map((item) => [Number(item.id), Number(item.talent_id)]),
  );

  const talentIds = Array.from(
    new Set(
      (shortlistApplications ?? [])
        .map((item) => Number(item.talent_id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  const { data: shortlistTalents } = talentIds.length
    ? await adminClient
        .from("talents")
        .select("id,slug,display_name_ar,display_name_en,name_ar,name_en,image_url,city_ar,city_en,category_ar,category_en")
        .in("id", talentIds)
    : { data: [] as Array<Record<string, unknown>> };

  const talentMap = new Map(
    (shortlistTalents ?? []).map((talent) => [Number(talent.id), talent]),
  );

  const shortlistCount = shortlistRows.filter((item) =>
    ["shortlisted", "presented", "selected"].includes(item.status),
  ).length;
  const selectedCount = shortlistRows.filter((item) => item.status === "selected").length;
  const currentIndex = project.status === "cancelled" ? -1 : stages.indexOf(project.status);
  const label = statusLabels[project.status] ?? {
    ar: project.status,
    en: project.status,
  };
  const canReviewShortlist = ["shortlist_ready", "client_review"].includes(project.status);

  async function updateClientSelectionAction(formData: FormData) {
    "use server";

    const submittedToken = String(formData.get("token") || "").trim();
    const shortlistId = Number(formData.get("shortlist_id"));
    const decision = String(formData.get("decision") || "");

    if (
      submittedToken !== cleanToken ||
      !Number.isInteger(shortlistId) ||
      shortlistId <= 0 ||
      !["selected", "declined"].includes(decision)
    ) {
      return;
    }

    const serverClient = createAdminClient();
    const { data: verifiedProject } = await serverClient
      .from("casting_projects")
      .select("id,status")
      .eq("id", projectId)
      .eq("client_access_token", submittedToken)
      .maybeSingle();

    if (!verifiedProject || !["shortlist_ready", "client_review"].includes(verifiedProject.status)) {
      return;
    }

    const { data: shortlistItem } = await serverClient
      .from("casting_shortlist")
      .select("id")
      .eq("id", shortlistId)
      .eq("casting_project_id", verifiedProject.id)
      .maybeSingle();

    if (!shortlistItem) return;

    const { error: updateError } = await serverClient
      .from("casting_shortlist")
      .update({
        status: decision,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shortlistId)
      .eq("casting_project_id", verifiedProject.id);

    if (updateError) {
      console.error("[CastingStatusPage client selection]", updateError);
      return;
    }

    if (verifiedProject.status === "shortlist_ready") {
      await serverClient
        .from("casting_projects")
        .update({ status: "client_review", updated_at: new Date().toISOString() })
        .eq("id", verifiedProject.id);
    }

    revalidatePath(`/${language}/casting/status/${submittedToken}`);
  }

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

        {shortlistRows.length > 0 ? (
          <section className="mt-6 rounded-[2rem] border border-gold/15 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.08),transparent_38%),rgba(255,255,255,0.025)] p-6 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gold">CLIENT REVIEW</p>
                <h2 className="mt-2 text-2xl font-light text-white">
                  {isArabic ? "القائمة المختصرة" : "Casting shortlist"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/40">
                  {canReviewShortlist
                    ? isArabic
                      ? "راجع المرشحين وحدد اختيارك النهائي. يمكنك تغيير القرار طالما أن المشروع في مرحلة مراجعة العميل."
                      : "Review the candidates and record your final decision. You can change a decision while the project remains in client review."
                    : isArabic
                      ? "هذه القائمة للعرض فقط في المرحلة الحالية من المشروع."
                      : "This shortlist is currently view-only at this project stage."}
                </p>
              </div>
              <div className="text-sm text-white/35">
                {shortlistRows.length} {isArabic ? "مرشح" : "candidates"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {shortlistRows.map((shortlistItem) => {
                const talentId = applicationMap.get(Number(shortlistItem.application_id));
                const talent = talentId ? (talentMap.get(talentId) as any) : null;
                const talentName = isArabic
                  ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en
                  : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
                const city = isArabic
                  ? talent?.city_ar || talent?.city_en
                  : talent?.city_en || talent?.city_ar;
                const category = isArabic
                  ? talent?.category_ar || talent?.category_en
                  : talent?.category_en || talent?.category_ar;
                const shortlistLabel = shortlistStatusLabels[shortlistItem.status] ?? {
                  ar: shortlistItem.status,
                  en: shortlistItem.status,
                };

                return (
                  <article
                    key={shortlistItem.id}
                    className={`rounded-2xl border p-4 transition ${
                      shortlistItem.status === "selected"
                        ? "border-emerald-300/25 bg-emerald-300/[0.06]"
                        : shortlistItem.status === "declined"
                          ? "border-white/[0.06] bg-black/20 opacity-70"
                          : "border-white/10 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {talent?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={talent.image_url}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-white/[0.03]" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-medium text-white/85">
                            {talentName || (isArabic ? "موهبة" : "Talent")}
                          </h3>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] ${
                            shortlistItem.status === "selected"
                              ? "border-emerald-300/25 text-emerald-200"
                              : "border-gold/20 text-gold"
                          }`}>
                            {isArabic ? shortlistLabel.ar : shortlistLabel.en}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-white/35">
                          {[category, city].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.07] pt-4">
                      {talent?.slug ? (
                        <Link
                          href={`/${language}/talent/${talent.slug}`}
                          target="_blank"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/55 transition hover:border-gold/25 hover:text-gold"
                        >
                          {isArabic ? "عرض الملف" : "View profile"}
                        </Link>
                      ) : null}

                      {canReviewShortlist && shortlistItem.status !== "withdrawn" ? (
                        <>
                          <form action={updateClientSelectionAction}>
                            <input type="hidden" name="token" value={cleanToken} />
                            <input type="hidden" name="shortlist_id" value={shortlistItem.id} />
                            <input type="hidden" name="decision" value="selected" />
                            <button
                              type="submit"
                              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] px-4 text-xs text-emerald-200 transition hover:bg-emerald-300/[0.1]"
                            >
                              {isArabic ? "اختيار" : "Select"}
                            </button>
                          </form>

                          <form action={updateClientSelectionAction}>
                            <input type="hidden" name="token" value={cleanToken} />
                            <input type="hidden" name="shortlist_id" value={shortlistItem.id} />
                            <input type="hidden" name="decision" value="declined" />
                            <button
                              type="submit"
                              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-xs text-white/45 transition hover:border-red-300/20 hover:text-red-200"
                            >
                              {isArabic ? "استبعاد" : "Pass"}
                            </button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

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
