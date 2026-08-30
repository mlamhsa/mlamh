import Link from "next/link";
import { notFound } from "next/navigation";

import {
  createCastingRoleAction,
  createCastingRoleOpportunityAction,
  ensureCastingClientAccessAction,
  linkCastingOpportunityAction,
  updateCastingProjectAction,
  updateCastingRoleAction,
} from "@/lib/actions/admin-casting";
import { createAdminClient } from "@/lib/supabase/admin";

const statuses = ["new", "qualified", "proposal", "awaiting_client", "active", "screening", "shortlist_ready", "client_review", "completed", "cancelled"] as const;
const roleStatuses = ["draft", "active", "screening", "shortlist_ready", "client_review", "completed", "cancelled"] as const;

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

function roleRequirement(role: any, key: string) {
  const requirements = role?.requirements;
  return requirements && typeof requirements === "object" ? requirements[key] : null;
}

export const dynamic = "force-dynamic";

export default async function AdminCastingProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ id }, { lang }] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();

  const language = lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";
  const adminClient = createAdminClient();

  const { data: project, error: projectError } = await adminClient.from("casting_projects").select("*").eq("id", projectId).maybeSingle();
  if (projectError) console.error("[AdminCastingProjectPage project]", projectError);
  if (!project) notFound();

  const [{ data: roles }, { data: shortlist }, { data: payments }] = await Promise.all([
    adminClient.from("casting_roles").select("*").eq("casting_project_id", projectId).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    adminClient.from("casting_shortlist").select("id,application_id,casting_role_id,status,rank").eq("casting_project_id", projectId),
    adminClient.from("casting_payments").select("id,status,amount,currency,paid_at").eq("casting_project_id", projectId).order("created_at", { ascending: false }),
  ]);

  const roleRows = roles ?? [];
  const legacyOpportunityId = project.opportunity_id ? Number(project.opportunity_id) : null;
  const roleOpportunityIds = roleRows.map((role) => Number(role.opportunity_id)).filter((value) => Number.isInteger(value) && value > 0);
  const allOpportunityIds = Array.from(new Set([...(legacyOpportunityId ? [legacyOpportunityId] : []), ...roleOpportunityIds]));

  const [{ data: opportunities }, { data: applications }] = await Promise.all([
    allOpportunityIds.length
      ? adminClient.from("opportunities").select("id,title,title_en,slug,status,published,opportunity_type,city_ar,city_en,managed_by_mlamh").in("id", allOpportunityIds)
      : Promise.resolve({ data: [] }),
    allOpportunityIds.length
      ? adminClient.from("opportunity_applications").select("id,opportunity_id,talent_id,status,created_at").in("opportunity_id", allOpportunityIds)
      : Promise.resolve({ data: [] }),
  ]);

  const opportunityMap = new Map((opportunities ?? []).map((item) => [Number(item.id), item]));
  const applicationRows = applications ?? [];
  const paid = (payments ?? []).filter((item) => item.status === "paid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const refunded = (payments ?? []).filter((item) => item.status === "refunded").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const collected = Math.max(0, paid - refunded);
  const clientStatusHref = project.client_access_token ? `/${language}/casting/status/${project.client_access_token}` : null;

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href={`/admin/casting?lang=${language}`} className="text-xs text-gold hover:underline">{isArabic ? "← العودة إلى MLAMH Casting" : "← Back to MLAMH Casting"}</Link>
            <p className="mt-4 text-xs uppercase tracking-[0.28em] text-white/35">CASTING PROJECT #{project.id}</p>
            <h1 className="mt-2 text-3xl font-light text-white sm:text-4xl">{project.project_title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-gold">{label(project.status, isArabic)}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-white/45">Managed by MLAMH</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-white/45">{roleRows.length} {isArabic ? "أدوار" : "roles"}</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-white/45">{applicationRows.length} {isArabic ? "طلبات" : "applications"}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className="rounded-xl border border-gold/25 px-4 py-2.5 text-sm text-gold hover:bg-gold/10">{isArabic ? "إدارة كل الطلبات" : "Manage all applications"}</Link>
            <Link href={`/admin/casting/${projectId}/sales?lang=${language}`} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:border-gold/25 hover:text-gold">{isArabic ? "المبيعات والتحصيل" : "Sales & collections"}</Link>
            {clientStatusHref ? <Link href={clientStatusHref} target="_blank" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:border-gold/25 hover:text-gold">{isArabic ? "صفحة العميل" : "Client view"}</Link> : null}
          </div>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [isArabic ? "الأدوار" : "Roles", roleRows.length],
            [isArabic ? "الطلبات" : "Applications", applicationRows.length],
            [isArabic ? "القائمة المختصرة" : "Shortlist", shortlist?.length ?? 0],
            [isArabic ? "المحصل" : "Collected", `${new Intl.NumberFormat("en-US").format(collected)} SAR`],
          ].map(([title, value]) => <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className="text-xs text-white/35">{title}</p><p className="mt-3 text-2xl font-light text-white">{value}</p></div>)}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">BRIEF</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[[isArabic ? "العميل" : "Client", project.client_name],[isArabic ? "الجهة" : "Company", project.company_name || "—"],[isArabic ? "النوع" : "Talent type", project.talent_type],[isArabic ? "العدد" : "Required", project.required_count],[isArabic ? "المدينة" : "City", project.city || "—"],[isArabic ? "تاريخ العمل" : "Work date", project.work_date || "—"],[isArabic ? "الميزانية" : "Budget", project.budget || "—"],[isArabic ? "الجوال" : "Phone", project.contact_phone || "—"],[isArabic ? "البريد" : "Email", project.contact_email || "—"]].map(([key,value]) => <div key={String(key)} className="rounded-xl border border-white/[0.07] bg-black/25 p-4"><p className="text-[11px] text-white/35">{key}</p><p className="mt-2 break-words text-sm text-white/75">{String(value)}</p></div>)}
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/25 p-5"><p className="text-[11px] text-white/35">{isArabic ? "تفاصيل الـ Brief" : "Brief details"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/70">{project.brief}</p></div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-gold">CASTING ROLES</p><h2 className="mt-2 text-2xl font-light text-white">{isArabic ? "أدوار المشروع" : "Project roles"}</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-white/35">{isArabic ? "كل دور مستقل بمتطلباته وفرصته وطلباته وقائمته المختصرة." : "Each role has its own requirements, opportunity, applications, and shortlist."}</p></div><Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className="rounded-xl border border-gold/25 px-4 py-2 text-xs text-gold">{isArabic ? "فتح مركز الفرز" : "Open screening"}</Link></div>

              {roleRows.length > 0 ? <div className="mt-6 space-y-4">{roleRows.map((role) => {
                const reqGender = String(roleRequirement(role, "gender") || "any");
                const reqCity = String(roleRequirement(role, "city") || project.city || "—");
                const minAge = roleRequirement(role, "min_age");
                const maxAge = roleRequirement(role, "max_age");
                const roleApplications = applicationRows.filter((app) => Number(app.opportunity_id) === Number(role.opportunity_id)).length;
                const roleShortlist = (shortlist ?? []).filter((item) => Number(item.casting_role_id) === Number(role.id)).length;
                const roleOpportunity = role.opportunity_id ? opportunityMap.get(Number(role.opportunity_id)) : null;
                const roleTitle = isArabic ? role.title : role.title_en || role.title;
                return <div key={role.id} className="rounded-2xl border border-white/[0.08] bg-black/20 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-medium text-white/85">{roleTitle}</h3><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{role.talent_type}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{role.status}</span></div><p className="mt-2 text-xs text-white/35">{reqGender} · {reqCity} · {minAge || "—"}-{maxAge || "—"} · {role.required_count} {isArabic ? "مطلوب" : "required"}</p><p className="mt-2 text-xs text-white/35">{roleApplications} {isArabic ? "طلبات" : "applications"} · {roleShortlist} shortlist</p>{role.description ? <p className="mt-3 text-xs leading-6 text-white/50">{isArabic ? role.description : role.description_en || role.description}</p> : null}</div>
                    <div className="flex flex-wrap gap-2">{roleOpportunity ? <><Link href={`/admin/opportunities/${roleOpportunity.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">Opportunity #{roleOpportunity.id}</Link>{roleOpportunity.slug && roleOpportunity.published ? <Link href={`/${language}/opportunities/${roleOpportunity.slug}`} target="_blank" className="rounded-lg border border-gold/20 px-3 py-2 text-xs text-gold">{isArabic ? "عرض" : "View"}</Link> : null}</> : <form action={createCastingRoleOpportunityAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="role_id" value={role.id}/><button className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-black">{isArabic ? "إنشاء فرصة لهذا الدور" : "Create role opportunity"}</button></form>}</div>
                  </div>
                  <form action={updateCastingRoleAction} className="mt-4 grid gap-2 border-t border-white/[0.07] pt-4 sm:grid-cols-[1fr_120px_auto]"><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="role_id" value={role.id}/><select name="status" defaultValue={role.status} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white/70">{roleStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><input name="required_count" type="number" min="1" max="1000" defaultValue={role.required_count} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white"/><button className="rounded-lg border border-gold/25 px-3 py-2 text-xs text-gold">{isArabic ? "حفظ" : "Save"}</button></form>
                </div>;
              })}</div> : <p className="mt-6 rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm text-white/35">{isArabic ? "لا توجد أدوار بعد." : "No roles yet."}</p>}

              <form action={createCastingRoleAction} className="mt-6 rounded-2xl border border-gold/15 bg-gold/[0.03] p-5"><input type="hidden" name="project_id" value={projectId}/><p className="text-sm font-medium text-white/80">{isArabic ? "إضافة Role جديد" : "Add a new role"}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input required name="title" placeholder={isArabic ? "اسم الدور — مثال: الأب" : "Role title — e.g. Father"} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><select name="talent_type" defaultValue="actor" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"><option value="actor">Actor</option><option value="model">Model</option></select><select name="gender" defaultValue="any" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"><option value="any">Any gender</option><option value="male">Male</option><option value="female">Female</option></select><input name="required_count" type="number" min="1" max="1000" defaultValue="1" className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><input name="min_age" type="number" min="1" max="120" placeholder={isArabic ? "العمر من" : "Min age"} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><input name="max_age" type="number" min="1" max="120" placeholder={isArabic ? "العمر إلى" : "Max age"} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><input name="city" defaultValue={project.city || ""} placeholder={isArabic ? "المدينة" : "City"} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><input name="sort_order" type="number" min="0" defaultValue={roleRows.length + 1} className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/></div><textarea name="description" rows={3} placeholder={isArabic ? "وصف ومتطلبات الدور" : "Role description and requirements"} className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><button className="mt-3 rounded-xl bg-gold px-5 py-3 text-sm font-medium text-black">{isArabic ? "إضافة الدور" : "Add role"}</button></form>
            </div>
          </section>

          <aside className="space-y-6">
            <form action={updateCastingProjectAction} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><input type="hidden" name="project_id" value={projectId}/><p className="text-xs uppercase tracking-[0.25em] text-gold">OPERATIONS</p><h2 className="mt-2 text-xl font-light text-white">{isArabic ? "إدارة المشروع" : "Project controls"}</h2><label className="mt-5 block text-xs text-white/45">{isArabic ? "الحالة" : "Status"}</label><select name="status" defaultValue={project.status} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white">{statuses.map((status) => <option key={status} value={status}>{label(status,isArabic)}</option>)}</select><label className="mt-4 block text-xs text-white/45">{isArabic ? "الباقة" : "Package"}</label><select name="package_code" defaultValue={project.package_code || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"><option value="">—</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="custom">Custom</option></select><label className="mt-4 block text-xs text-white/45">{isArabic ? "السعر المعروض (ر.س)" : "Quoted amount (SAR)"}</label><input name="quoted_amount" type="number" min="0" step="0.01" defaultValue={project.quoted_amount ?? ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><label className="mt-4 block text-xs text-white/45">{isArabic ? "تحديث ظاهر للعميل" : "Client-facing status update"}</label><textarea name="client_status_note" rows={4} maxLength={5000} defaultValue={project.client_status_note || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white"/><label className="mt-4 block text-xs text-white/45">{isArabic ? "ملاحظات داخلية" : "Internal notes"}</label><textarea name="internal_notes" rows={6} defaultValue={project.internal_notes || ""} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white"/><button className="mt-5 w-full rounded-xl bg-gold px-4 py-3 text-sm font-medium text-black">{isArabic ? "حفظ التغييرات" : "Save changes"}</button></form>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><p className="text-xs uppercase tracking-[0.25em] text-gold">CLIENT ACCESS</p><h2 className="mt-2 text-xl font-light text-white">{isArabic ? "متابعة العميل" : "Client tracking"}</h2>{clientStatusHref ? <Link href={clientStatusHref} target="_blank" className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-gold/30 px-4 py-3 text-sm text-gold">{isArabic ? "فتح صفحة المتابعة" : "Open client status"}</Link> : <form action={ensureCastingClientAccessAction} className="mt-4"><input type="hidden" name="project_id" value={projectId}/><button className="w-full rounded-xl border border-gold/30 px-4 py-3 text-sm text-gold">{isArabic ? "إنشاء رابط العميل" : "Generate client link"}</button></form>}</div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"><p className="text-xs uppercase tracking-[0.25em] text-gold">LEGACY OPPORTUNITY</p><h2 className="mt-2 text-xl font-light text-white">{isArabic ? "توافق المشاريع القديمة" : "Legacy compatibility"}</h2><p className="mt-3 text-xs leading-6 text-white/35">{isArabic ? "هذا الربط يبقى للمشاريع القديمة فقط. المشاريع الجديدة تستخدم Opportunity مستقلة لكل Role." : "This project-level link is retained for legacy projects. New projects use one opportunity per role."}</p>{legacyOpportunityId ? <div className="mt-4 rounded-xl border border-white/10 p-4 text-sm text-white/60">Opportunity #{legacyOpportunityId}</div> : null}<form action={linkCastingOpportunityAction} className="mt-4"><input type="hidden" name="project_id" value={projectId}/><input required name="opportunity_id" type="number" min="1" defaultValue={legacyOpportunityId ?? ""} className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white"/><button className="mt-3 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55">{isArabic ? "ربط فرصة قديمة" : "Link legacy opportunity"}</button></form></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
