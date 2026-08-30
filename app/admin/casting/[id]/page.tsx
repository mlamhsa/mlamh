import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addCastingShortlistAction,
  ensureCastingClientAccessAction,
  linkCastingOpportunityAction,
  updateCastingProjectAction,
  updateCastingShortlistStatusAction,
} from "@/lib/actions/admin-casting";
import { createAdminClient } from "@/lib/supabase/admin";

const statuses = [
  "new",
  "qualified",
  "proposal",
  "awaiting_client",
  "active",
  "screening",
  "shortlist_ready",
  "client_review",
  "completed",
  "cancelled",
] as const;

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "جديد", en: "New" },
  qualified: { ar: "مؤهل", en: "Qualified" },
  proposal: { ar: "عرض سعر", en: "Proposal" },
  awaiting_client: { ar: "بانتظار العميل", en: "Awaiting Client" },
  active: { ar: "نشط", en: "Active" },
  screening: { ar: "فرز", en: "Screening" },
  shortlist_ready: { ar: "القائمة المختصرة جاهزة", en: "Shortlist Ready" },
  client_review: { ar: "مراجعة العميل", en: "Client Review" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

function label(status: string, isArabic: boolean) {
  const item = statusLabels[status];
  return item ? (isArabic ? item.ar : item.en) : status;
}

export const dynamic = "force-dynamic";

export default async function AdminCastingProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const adminClient = createAdminClient();

  const { data: project, error: projectError } = await adminClient
    .from("casting_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) console.error("[AdminCastingProjectPage project]", projectError);
  if (!project) notFound();

  const opportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;

  const [{ data: opportunity }, { data: applications }, { data: shortlist }] = await Promise.all([
    opportunityId
      ? adminClient
          .from("opportunities")
          .select("id,title,title_en,slug,status,published,opportunity_type,city_ar,city_en,managed_by_mlamh")
          .eq("id", opportunityId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    opportunityId
      ? adminClient
          .from("opportunity_applications")
          .select("id,talent_id,status,created_at")
          .eq("opportunity_id", opportunityId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    adminClient
      .from("casting_shortlist")
      .select("id,application_id,status,rank,internal_notes,client_notes,created_at")
      .eq("casting_project_id", projectId)
      .order("rank", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  const appRows = applications ?? [];
  const talentIds = Array.from(new Set(appRows.map((item) => Number(item.talent_id)).filter(Boolean)));
  const { data: talents } = talentIds.length
    ? await adminClient
        .from("talents")
        .select("id,name_ar,name_en,display_name_ar,display_name_en,slug,image_url,city_ar,city_en,gender,category_ar,category_en")
        .in("id", talentIds)
    : { data: [] as Array<Record<string, unknown>> };

  const talentMap = new Map((talents ?? []).map((talent) => [Number(talent.id), talent]));
  const shortlistMap = new Map((shortlist ?? []).map((item) => [Number(item.application_id), item]));
  const clientStatusHref = project.client_access_token
    ? `/${language}/casting/status/${project.client_access_token}`
    : null;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/admin/casting?lang=${language}`} className="text-xs text-gold hover:underline">
              {isArabic ? "← العودة إلى MLAMH Casting" : "← Back to MLAMH Casting"}
            </Link>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-white/35">CASTING PROJECT #{project.id}</p>
            <h1 className="mt-2 text-3xl font-light text-white sm:text-4xl">{project.project_title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-gold">{label(project.status, isArabic)}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-white/45">Managed by MLAMH</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {clientStatusHref ? (
              <Link
                href={clientStatusHref}
                target="_blank"
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:border-gold/25 hover:text-gold"
              >
                {isArabic ? "عرض صفحة العميل" : "Client status view"}
              </Link>
            ) : null}
            {opportunity?.slug ? (
              <Link href={`/${language}/opportunities/${opportunity.slug}`} target="_blank" className="rounded-xl border border-gold/25 px-4 py-2.5 text-sm text-gold hover:bg-gold/10">
                {isArabic ? "عرض الفرصة العامة" : "View public opportunity"}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">BRIEF</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [isArabic ? "العميل" : "Client", project.client_name],
                  [isArabic ? "الجهة" : "Company", project.company_name || "—"],
                  [isArabic ? "النوع" : "Talent type", project.talent_type],
                  [isArabic ? "العدد" : "Required", project.required_count],
                  [isArabic ? "المدينة" : "City", project.city || "—"],
                  [isArabic ? "تاريخ العمل" : "Work date", project.work_date || "—"],
                  [isArabic ? "الميزانية" : "Budget", project.budget || "—"],
                  [isArabic ? "الجوال" : "Phone", project.contact_phone || "—"],
                  [isArabic ? "البريد" : "Email", project.contact_email || "—"],
                ].map(([key, value]) => (
                  <div key={String(key)} className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
                    <p className="text-[11px] text-white/35">{key}</p>
                    <p className="mt-2 break-words text-sm text-white/75">{String(value)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-5">
                <p className="text-[11px] text-white/35">{isArabic ? "تفاصيل الـ Brief" : "Brief details"}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{project.brief}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">APPLICATIONS</p>
                  <h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "الفرز والقائمة المختصرة" : "Screening & Shortlist"}</h2>
                </div>
                <div className="text-sm text-white/40">
                  {appRows.length} {isArabic ? "طلب" : "applications"} · {shortlist?.length ?? 0} Shortlist
                </div>
              </div>

              {!opportunityId ? (
                <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-amber-200/80">
                  {isArabic ? "أنشئ أو اربط فرصة بالمشروع أولًا حتى تظهر طلبات المواهب." : "Create or link an opportunity first to load talent applications."}
                </p>
              ) : appRows.length === 0 ? (
                <p className="mt-6 text-sm text-white/35">{isArabic ? "لا توجد طلبات على الفرصة حتى الآن." : "No applications yet."}</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {appRows.map((application) => {
                    const talent = talentMap.get(Number(application.talent_id)) as any;
                    const short = shortlistMap.get(Number(application.id));
                    const talentName = isArabic
                      ? talent?.display_name_ar || talent?.name_ar || talent?.display_name_en || talent?.name_en
                      : talent?.display_name_en || talent?.name_en || talent?.display_name_ar || talent?.name_ar;
                    return (
                      <div key={application.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4">
                            {talent?.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={talent.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                            ) : (
                              <div className="h-14 w-14 rounded-xl border border-white/10 bg-white/[0.03]" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-white/85">{talentName || `Talent #${application.talent_id}`}</p>
                              <p className="mt-1 text-xs text-white/35">{isArabic ? talent?.city_ar : talent?.city_en || talent?.city_ar} · {application.status || "pending"}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {talent?.slug ? (
                              <Link href={`/${language}/talent/${talent.slug}`} target="_blank" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">
                                {isArabic ? "الملف" : "Profile"}
                              </Link>
                            ) : null}
                            {!short ? (
                              <form action={addCastingShortlistAction}>
                                <input type="hidden" name="project_id" value={projectId} />
                                <input type="hidden" name="application_id" value={application.id} />
                                <button className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold hover:bg-gold/10">
                                  {isArabic ? "إضافة للقائمة المختصرة" : "Add to shortlist"}
                                </button>
                              </form>
                            ) : (
                              <form action={updateCastingShortlistStatusAction} className="flex gap-2">
                                <input type="hidden" name="project_id" value={projectId} />
                                <input type="hidden" name="shortlist_id" value={short.id} />
                                <select name="status" defaultValue={short.status} className="rounded-lg border border-gold/20 bg-black px-3 py-2 text-xs text-gold">
                                  <option value="shortlisted">Shortlisted</option>
                                  <option value="presented">Presented</option>
                                  <option value="selected">Selected</option>
                                  <option value="declined">Declined</option>
                                  <option value="withdrawn">Withdrawn</option>
                                </select>
                                <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">{isArabic ? "حفظ" : "Save"}</button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <form action={updateCastingProjectAction} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <input type="hidden" name="project_id" value={projectId} />
              <p className="text-xs uppercase tracking-[0.25em] text-gold">OPERATIONS</p>
              <h2 className="mt-2 text-xl font-light text-white">{isArabic ? "إدارة المشروع" : "Project controls"}</h2>

              <label className="mt-5 block text-xs text-white/45">{isArabic ? "الحالة" : "Status"}</label>
              <select name="status" defaultValue={project.status} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white">
                {statuses.map((status) => <option key={status} value={status}>{label(status, isArabic)}</option>)}
              </select>

              <label className="mt-4 block text-xs text-white/45">{isArabic ? "الباقة" : "Package"}</label>
              <select name="package_code" defaultValue={project.package_code || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white">
                <option value="">—</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="custom">Custom</option>
              </select>

              <label className="mt-4 block text-xs text-white/45">{isArabic ? "السعر المعروض (ر.س)" : "Quoted amount (SAR)"}</label>
              <input name="quoted_amount" type="number" min="0" step="0.01" defaultValue={project.quoted_amount ?? ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white" />

              <label className="mt-4 block text-xs text-white/45">{isArabic ? "تحديث ظاهر للعميل" : "Client-facing status update"}</label>
              <textarea
                name="client_status_note"
                rows={4}
                maxLength={5000}
                defaultValue={project.client_status_note || ""}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white"
              />

              <label className="mt-4 block text-xs text-white/45">{isArabic ? "ملاحظات داخلية" : "Internal notes"}</label>
              <textarea name="internal_notes" rows={6} defaultValue={project.internal_notes || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white" />

              <button className="mt-5 w-full rounded-xl bg-gold px-4 py-3 text-sm font-medium text-black hover:brightness-110">
                {isArabic ? "حفظ التغييرات" : "Save changes"}
              </button>
            </form>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">CLIENT ACCESS</p>
              <h2 className="mt-2 text-xl font-light text-white">{isArabic ? "متابعة العميل" : "Client tracking"}</h2>
              {clientStatusHref ? (
                <>
                  <p className="mt-4 text-xs leading-6 text-white/35">
                    {isArabic
                      ? "الرابط سري ومخصص للعميل لمتابعة الحالة والأرقام بدون تسجيل دخول."
                      : "This private link lets the client follow status and project counts without signing in."}
                  </p>
                  <Link
                    href={clientStatusHref}
                    target="_blank"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gold/30 px-4 py-3 text-sm text-gold hover:bg-gold/10"
                  >
                    {isArabic ? "فتح صفحة المتابعة" : "Open client status"}
                  </Link>
                </>
              ) : (
                <form action={ensureCastingClientAccessAction} className="mt-4">
                  <input type="hidden" name="project_id" value={projectId} />
                  <p className="text-xs leading-6 text-white/35">
                    {isArabic
                      ? "هذا المشروع لا يملك رابط متابعة بعد. أنشئ رابطًا سريًا قبل إرساله للعميل."
                      : "This project does not have a tracking link yet. Generate a private link before sharing it with the client."}
                  </p>
                  <button className="mt-4 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-gold hover:bg-gold/10">
                    {isArabic ? "إنشاء رابط العميل" : "Generate client link"}
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">OPPORTUNITY LINK</p>
              <h2 className="mt-2 text-xl font-light text-white">{isArabic ? "فرصة المشروع" : "Project opportunity"}</h2>
              {opportunity ? (
                <div className="mt-4 rounded-xl border border-gold/15 bg-gold/[0.04] p-4">
                  <p className="text-xs text-gold">#{opportunity.id}</p>
                  <p className="mt-2 text-sm text-white/80">{isArabic ? opportunity.title : opportunity.title_en || opportunity.title}</p>
                  <p className="mt-1 text-xs text-white/35">{opportunity.status} · {opportunity.published ? "Published" : "Not published"}</p>
                </div>
              ) : (
                <Link
                  href={`/admin/casting/${projectId}/opportunity?lang=${language}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3 text-sm font-medium text-black hover:brightness-110"
                >
                  {isArabic ? "إنشاء فرصة من الـ Brief" : "Create opportunity from brief"}
                </Link>
              )}

              <form action={linkCastingOpportunityAction} className="mt-4">
                <input type="hidden" name="project_id" value={projectId} />
                <label className="block text-xs text-white/45">{isArabic ? "أو ربط رقم فرصة موجودة" : "Or link an existing opportunity ID"}</label>
                <input required name="opportunity_id" type="number" min="1" defaultValue={opportunityId ?? ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white" />
                <p className="mt-2 text-xs leading-5 text-white/30">
                  {isArabic ? "عند الربط ستُعلّم الفرصة تلقائيًا بأنها Managed by MLAMH." : "Linking automatically marks the opportunity as Managed by MLAMH."}
                </p>
                <button className="mt-4 w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-gold hover:bg-gold/10">
                  {isArabic ? "ربط وتفعيل الإدارة" : "Link & mark managed"}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
