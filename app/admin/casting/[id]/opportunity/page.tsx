import Link from "next/link";
import { notFound } from "next/navigation";

import { createCastingOpportunityFromBriefAction } from "@/lib/actions/admin-casting";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function findCitySlug(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "";

  const city = SAUDI_CITIES.find(
    (item) =>
      item.ar.trim().toLowerCase() === normalized ||
      item.en.trim().toLowerCase() === normalized ||
      item.slug.trim().toLowerCase() === normalized,
  );

  return city?.slug ?? "";
}

export default async function CreateCastingOpportunityPage({
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
  const { data: project, error } = await adminClient
    .from("casting_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) console.error("[CreateCastingOpportunityPage]", error);
  if (!project) notFound();

  if (project.opportunity_id) {
    return (
      <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gold/20 bg-gold/[0.05] p-8">
          <h1 className="text-2xl font-light text-white">
            {isArabic ? "المشروع مرتبط بفرصة بالفعل" : "Project already has an opportunity"}
          </h1>
          <Link
            href={`/admin/casting/${projectId}?lang=${language}`}
            className="mt-5 inline-flex rounded-xl border border-gold/30 px-5 py-3 text-sm text-gold"
          >
            {isArabic ? "العودة للمشروع" : "Back to project"}
          </Link>
        </div>
      </div>
    );
  }

  const citySlug = findCitySlug(project.city);
  const defaultType = project.talent_type === "model" ? "model" : "actor";
  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold/40";

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/admin/casting/${projectId}?lang=${language}`}
          className="text-xs text-gold hover:underline"
        >
          {isArabic ? "← العودة إلى مشروع Casting" : "← Back to casting project"}
        </Link>

        <div className="mt-5 border-b border-white/10 pb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">BRIEF → OPPORTUNITY</p>
          <h1 className="mt-3 text-3xl font-light text-white sm:text-4xl">
            {isArabic ? "إنشاء فرصة من الـ Brief" : "Create opportunity from brief"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/45">
            {isArabic
              ? "راجع البيانات قبل الإنشاء. ستنشأ الفرصة كمسودة، تتم ترجمتها تلقائيًا، وترتبط بمشروع Casting مع علامة Managed by MLAMH."
              : "Review the details before creating. The opportunity will be created as a draft, translated automatically, linked to this casting project, and marked Managed by MLAMH."}
          </p>
        </div>

        {project.talent_type === "mixed" ? (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5 text-sm leading-7 text-amber-100/75">
            {isArabic
              ? "الـ Brief يطلب ممثلين ومودلز. في V1 أنشئ الفرصة الأولى لأحد النوعين، ثم يمكن إضافة دور/فرصة إضافية عند تفعيل Multi-role Casting."
              : "This brief requests actors and models. In V1, create the first opportunity for one talent type; multi-role casting will support additional roles later."}
          </div>
        ) : null}

        <form action={createCastingOpportunityFromBriefAction} className="mt-6 grid gap-6">
          <input type="hidden" name="project_id" value={projectId} />

          <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs text-white/45">
                {isArabic ? "عنوان الفرصة" : "Opportunity title"}
                <input
                  required
                  name="title"
                  maxLength={180}
                  defaultValue={project.project_title}
                  className={inputClass}
                />
              </label>

              <label className="sm:col-span-2 text-xs text-white/45">
                {isArabic ? "الوصف" : "Description"}
                <textarea
                  required
                  name="description"
                  rows={9}
                  maxLength={8000}
                  defaultValue={project.brief}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "نوع الموهبة" : "Talent type"}
                <select name="opportunity_type" defaultValue={defaultType} className={inputClass}>
                  <option value="actor">{isArabic ? "ممثل / ممثلة" : "Actor"}</option>
                  <option value="model">{isArabic ? "مودل" : "Model"}</option>
                </select>
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "الجهة الظاهرة للعامة" : "Public company name"}
                <input
                  name="public_company_name"
                  maxLength={160}
                  defaultValue={project.company_name || (isArabic ? "من عملاء ملامح" : "MLAMH Client")}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "المدينة" : "City"}
                <select name="city_slug" defaultValue={citySlug} className={inputClass}>
                  <option value="">{isArabic ? "غير محدد" : "Not specified"}</option>
                  {SAUDI_CITIES.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {isArabic ? city.ar : city.en}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "الجنس المطلوب" : "Required gender"}
                <select name="required_gender" defaultValue="any" className={inputClass}>
                  <option value="any">{isArabic ? "الجميع" : "Any"}</option>
                  <option value="male">{isArabic ? "ذكر" : "Male"}</option>
                  <option value="female">{isArabic ? "أنثى" : "Female"}</option>
                </select>
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "الحد الأدنى للعمر" : "Minimum age"}
                <input name="min_age" type="number" min="1" max="100" className={inputClass} />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "الحد الأعلى للعمر" : "Maximum age"}
                <input name="max_age" type="number" min="1" max="100" className={inputClass} />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "العدد المطلوب" : "Required count"}
                <input
                  name="required_count"
                  type="number"
                  min="1"
                  max="1000"
                  defaultValue={project.required_count || 1}
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "تاريخ العمل" : "Work date"}
                <input name="work_date" type="date" defaultValue={project.work_date || ""} className={inputClass} />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "نوع المقابل" : "Compensation"}
                <select name="compensation_type" defaultValue="negotiable" className={inputClass}>
                  <option value="negotiable">{isArabic ? "حسب الاتفاق" : "Negotiable"}</option>
                  <option value="fixed">{isArabic ? "مبلغ ثابت" : "Fixed"}</option>
                  <option value="unpaid">{isArabic ? "غير مدفوع" : "Unpaid"}</option>
                </select>
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "المبلغ إذا كان ثابتًا" : "Budget if fixed"}
                <input name="budget" maxLength={100} defaultValue="" className={inputClass} />
              </label>

              <label className="text-xs text-white/45">
                {isArabic ? "مدة استقبال الطلبات بالأيام" : "Application window (days)"}
                <input name="application_days" type="number" min="1" max="90" defaultValue="14" className={inputClass} />
              </label>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/casting/${projectId}?lang=${language}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-6 text-sm text-white/55"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </Link>
            <button className="min-h-12 rounded-xl bg-gold px-7 text-sm font-medium text-black hover:brightness-110">
              {isArabic ? "إنشاء المسودة وربطها بالمشروع" : "Create draft & link project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
