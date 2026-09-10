import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Plus, Send, UsersRound } from "lucide-react";

import {
  addCastingRoleAction,
  publishCastingRoleAsOpportunityAction,
  shortlistCastingApplicationAction,
} from "@/lib/actions/casting-workspace-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateTalentSupplyGap, getTalentSupplyForBrief, type BriefTalent } from "@/lib/talent/supply";

type PageProps = { params: Promise<{ locale: string; projectId: string }> };
type RoleRow = {
  id: number;
  title: string;
  talent_type: string;
  required_count: number;
  description: string | null;
  requirements: Record<string, unknown> | null;
  status: string;
  opportunity_id: number | null;
};
type ApplicationRow = {
  id: number;
  opportunity_id: number;
  talent_id: number;
  status: string | null;
  created_at: string | null;
};

type TalentCard = {
  id: number;
  slug: string | null;
  name_ar: string | null;
  name_en: string | null;
  image_url: string | null;
  city_ar: string | null;
  city_en: string | null;
};

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ageMatch(talent: BriefTalent, requirements: Record<string, unknown>) {
  const min = num(requirements.age_min);
  const max = num(requirements.age_max);
  if (min === null && max === null) return true;
  const age = num(talent.age);
  if (age === null) return false;
  if (min !== null && age < min) return false;
  if (max !== null && age > max) return false;
  return true;
}

export default async function WorkspaceProjectPage({ params }: PageProps) {
  const { locale, projectId: rawProjectId } = await params;
  const isArabic = locale === "ar";
  const projectId = Number(rawProjectId);
  if (!Number.isInteger(projectId) || projectId <= 0) redirect(`/${locale}/publisher-dashboard/workspace`);

  const auth = await createServerSupabaseClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id, account_type, approval_status, status").eq("user_id", user.id).maybeSingle();
  if (!profile || profile.account_type !== "publisher") redirect(`/${locale}/login`);
  const { data: publisher } = await admin.from("publishers").select("id, status").eq("profile_id", profile.id).maybeSingle();
  if (!publisher || profile.approval_status !== "approved") redirect(`/${locale}/publisher-dashboard`);

  const { data: project, error: projectError } = await admin
    .from("casting_projects")
    .select("id, project_title, brief, talent_type, city, required_count, work_date, budget, currency, status, service_mode, opportunity_id")
    .eq("id", projectId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();
  if (projectError || !project) redirect(`/${locale}/publisher-dashboard/workspace`);

  const [{ data: rolesData, error: rolesError }, { data: shortlistData, error: shortlistError }] = await Promise.all([
    admin.from("casting_roles").select("id, title, talent_type, required_count, description, requirements, status, opportunity_id").eq("casting_project_id", project.id).order("sort_order"),
    admin.from("casting_shortlist").select("id, casting_role_id, application_id, status, rank").eq("casting_project_id", project.id).order("rank", { ascending: true, nullsFirst: false }),
  ]);
  if (rolesError) throw new Error(`[Workspace roles] ${rolesError.message}`);
  if (shortlistError) throw new Error(`[Workspace shortlist] ${shortlistError.message}`);

  const roles = (rolesData ?? []) as RoleRow[];
  const opportunityIds = roles.map((role) => role.opportunity_id).filter((id): id is number => typeof id === "number");
  const { data: applicationsData, error: applicationsError } = opportunityIds.length
    ? await admin.from("opportunity_applications").select("id, opportunity_id, talent_id, status, created_at").in("opportunity_id", opportunityIds).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (applicationsError) throw new Error(`[Workspace applications] ${applicationsError.message}`);

  const applications = (applicationsData ?? []) as ApplicationRow[];
  const talentIds = Array.from(new Set(applications.map((application) => application.talent_id)));
  const { data: applicantTalentsData } = talentIds.length
    ? await admin.from("talents").select("id, slug, name_ar, name_en, image_url, city_ar, city_en").in("id", talentIds)
    : { data: [] };
  const applicantTalentMap = new Map<number, TalentCard>((applicantTalentsData ?? []).map((talent) => [Number(talent.id), talent as TalentCard]));
  const shortlistedApplicationIds = new Set((shortlistData ?? []).map((item) => Number(item.application_id)));

  const roleSupply = await Promise.all(roles.map(async (role) => {
    const req = role.requirements ?? {};
    const supply = await getTalentSupplyForBrief({
      needed: role.required_count,
      talent_type: role.talent_type,
      country_code: "SA",
      city: typeof req.city === "string" ? req.city : project.city,
      city_required: true,
      gender: typeof req.gender === "string" ? req.gender : null,
      requirements: {},
    });
    const ageFiltered = supply.sendableTalents.filter((talent) => ageMatch(talent, req));
    const adjusted = { ...supply, sendableTalents: ageFiltered };
    return { role, supply: adjusted, gap: calculateTalentSupplyGap({ needed: role.required_count }, adjusted) };
  }));

  const totalNeeded = roles.reduce((sum, role) => sum + Number(role.required_count || 0), 0);
  const shortlistCount = (shortlistData ?? []).length;
  const totalAvailable = roleSupply.reduce((sum, item) => sum + item.supply.sendableTalents.length, 0);

  return (
    <div dir={isArabic ? "rtl" : "ltr"} className="space-y-6 pb-24 lg:pb-10">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
        <Link href={`/${locale}/publisher-dashboard/workspace`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-gold">
          <ArrowLeft size={16} className={isArabic ? "rotate-180" : ""} />
          {isArabic ? "كل المشاريع" : "All projects"}
        </Link>
        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">CASTING WORKSPACE</p>
            <h1 className="mt-3 text-3xl font-light sm:text-5xl">{project.project_title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">{project.brief}</p>
          </div>
          <span className="w-fit rounded-full border border-gold/25 bg-gold/[0.07] px-4 py-2 text-xs text-gold">{project.status}</span>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={isArabic ? "الأدوار" : "Roles"} value={roles.length} />
          <Stat label={isArabic ? "المطلوب" : "Needed"} value={totalNeeded} />
          <Stat label={isArabic ? "المتاح المطابق" : "Matching supply"} value={totalAvailable} emphasis />
          <Stat label={isArabic ? "القائمة المختصرة" : "Shortlist"} value={shortlistCount} />
        </div>
      </header>

      <section className="space-y-4">
        {roleSupply.map(({ role, supply, gap }) => {
          const shortlistedForRole = (shortlistData ?? []).filter((item) => item.casting_role_id === role.id).length;
          const roleApplications = role.opportunity_id ? applications.filter((application) => application.opportunity_id === role.opportunity_id) : [];
          return (
            <article key={role.id} className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-medium sm:text-2xl">{role.title}</h2>
                    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] text-white/45">{role.talent_type === "actor" ? (isArabic ? "ممثل" : "Actor") : (isArabic ? "مودل" : "Model")}</span>
                  </div>
                  {role.description ? <p className="mt-2 text-sm leading-7 text-white/45">{role.description}</p> : null}
                </div>
                <div className={`rounded-2xl border px-4 py-3 text-center ${gap.missing === 0 ? "border-emerald-300/20 bg-emerald-300/[0.06]" : "border-amber-300/20 bg-amber-300/[0.06]"}`}>
                  <p className="text-[10px] text-white/40">{isArabic ? "فجوة التوريد" : "Supply gap"}</p>
                  <p className="mt-1 text-2xl font-light">{gap.missing}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Mini label={isArabic ? "المطلوب" : "Needed"} value={role.required_count} />
                <Mini label={isArabic ? "مطابق" : "Matching"} value={supply.sendableTalents.length} />
                <Mini label={isArabic ? "مختصر" : "Shortlisted"} value={shortlistedForRole} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                {role.opportunity_id ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-xs font-medium text-emerald-200">{isArabic ? "الدور مرتبط بفرصة" : "Role linked to opportunity"}</p><p className="mt-1 text-[11px] text-white/35">{isArabic ? `${roleApplications.length} طلب مرتبط بهذا الدور` : `${roleApplications.length} applications for this role`}</p></div>
                    <Link href={`/${locale}/publisher-dashboard/opportunities/${role.opportunity_id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-xs text-white/60 hover:border-gold/35 hover:text-gold"><ExternalLink size={14} />{isArabic ? "فتح الفرصة" : "Open opportunity"}</Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="text-xs font-medium text-white/70">{isArabic ? "تريد استقبال طلبات لهذا الدور؟" : "Want applications for this role?"}</p><p className="mt-1 text-[11px] text-white/35">{isArabic ? "أرسله كفرصة للمراجعة. لن يُنشر قبل اعتماد الإدارة." : "Submit it as an opportunity for review. It will not publish before admin approval."}</p></div>
                    <form action={publishCastingRoleAsOpportunityAction}>
                      <input type="hidden" name="locale" value={locale} /><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="roleId" value={role.id} />
                      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gold px-5 text-xs font-medium text-black"><Send size={14} />{isArabic ? "إرسال كفرصة" : "Submit as opportunity"}</button>
                    </form>
                  </div>
                )}
              </div>

              {roleApplications.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-medium text-white/70">{isArabic ? "طلبات الدور" : "Role applications"}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleApplications.slice(0, 8).map((application) => {
                      const talent = applicantTalentMap.get(application.talent_id);
                      const name = isArabic ? talent?.name_ar || talent?.name_en || `#${application.talent_id}` : talent?.name_en || talent?.name_ar || `#${application.talent_id}`;
                      const isShortlisted = shortlistedApplicationIds.has(application.id) || application.status === "shortlisted";
                      return (
                        <div key={application.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold/20 bg-gold/[0.07]">{talent?.image_url ? <Image src={talent.image_url} alt={name} fill sizes="40px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-gold">{name.slice(0,1)}</div>}</div>
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="text-[10px] text-white/35">{application.status ?? "pending"}</p></div>
                            {talent?.slug ? <Link href={`/${locale}/talent/${talent.slug}`} className="text-[10px] text-gold">{isArabic ? "الملف" : "Profile"}</Link> : null}
                          </div>
                          {isShortlisted ? <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.06] px-3 py-2 text-center text-[10px] text-gold">{isArabic ? "ضمن القائمة المختصرة" : "Shortlisted"}</div> : ["pending", "reviewing"].includes(String(application.status)) ? (
                            <form action={shortlistCastingApplicationAction} className="mt-3">
                              <input type="hidden" name="locale" value={locale} /><input type="hidden" name="projectId" value={project.id} /><input type="hidden" name="roleId" value={role.id} /><input type="hidden" name="applicationId" value={application.id} />
                              <button className="min-h-10 w-full rounded-xl border border-gold/25 bg-gold/[0.05] text-xs text-gold">{isArabic ? "إضافة للقائمة المختصرة" : "Add to shortlist"}</button>
                            </form>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {supply.sendableTalents.length > 0 ? (
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium text-white/70">{isArabic ? "مواهب مطابقة مبدئيًا" : "Initial matching talent"}</p><p className="text-[10px] text-white/30">{isArabic ? "لا يتم التقديم تلقائيًا" : "No automatic applications"}</p></div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {supply.sendableTalents.slice(0, 6).map((talent) => {
                      const id = Number(talent.id);
                      const name = isArabic ? String(talent.name_ar || talent.name_en || `#${id}`) : String(talent.name_en || talent.name_ar || `#${id}`);
                      const image = typeof talent.image_url === "string" ? talent.image_url : null;
                      const slug = typeof talent.slug === "string" ? talent.slug : null;
                      return (
                        <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold/20 bg-gold/[0.07]">{image ? <Image src={image} alt={name} fill sizes="44px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-gold">{name.slice(0,1)}</div>}</div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="truncate text-[10px] text-white/35">{String((isArabic ? talent.city_ar : talent.city_en) || talent.city_slug || "")}</p></div>
                          {slug && talent.published === true ? <Link href={`/${locale}/talent/${slug}`} className="text-[10px] text-gold">{isArabic ? "الملف" : "Profile"}</Link> : <CheckCircle2 size={15} className="text-gold/60" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <div className="mt-6 rounded-2xl border border-dashed border-amber-300/20 bg-amber-300/[0.04] p-4 text-sm text-white/45">{isArabic ? "لا توجد مواهب مطابقة لكل الشروط حاليًا. هذا مؤشر Supply Gap حقيقي وليس خطأ في النظام." : "No talent currently matches every hard requirement. This is a real supply-gap signal, not a system error."}</div>}
            </article>
          );
        })}
      </section>

      <details className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-gold"><Plus size={16} />{isArabic ? "إضافة دور آخر" : "Add another role"}</summary>
        <form action={addCastingRoleAction} className="mt-6 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={locale} /><input type="hidden" name="projectId" value={project.id} />
          <Field label={isArabic ? "اسم الدور" : "Role name"}><input className="field" name="roleName" required /></Field>
          <Field label={isArabic ? "نوع الموهبة" : "Talent type"}><select className="field" name="talentType" defaultValue="model"><option value="model">{isArabic ? "مودل" : "Model"}</option><option value="actor">{isArabic ? "ممثل" : "Actor"}</option></select></Field>
          <Field label={isArabic ? "المدينة" : "City"}><input className="field" name="city" /></Field>
          <Field label={isArabic ? "العدد" : "Needed"}><input className="field" name="requiredCount" type="number" min="1" defaultValue="1" required /></Field>
          <Field label={isArabic ? "الجنس" : "Gender"}><select className="field" name="gender" defaultValue=""><option value="">{isArabic ? "غير محدد" : "Any"}</option><option value="male">{isArabic ? "ذكر" : "Male"}</option><option value="female">{isArabic ? "أنثى" : "Female"}</option></select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label={isArabic ? "العمر من" : "Age min"}><input className="field" name="ageMin" type="number" /></Field><Field label={isArabic ? "العمر إلى" : "Age max"}><input className="field" name="ageMax" type="number" /></Field></div>
          <button className="min-h-12 rounded-full bg-gold px-6 text-sm font-medium text-black sm:col-span-2">{isArabic ? "إضافة الدور" : "Add role"}</button>
        </form>
      </details>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-white/40"><span className="inline-flex items-center gap-2 text-gold"><UsersRound size={14} />{isArabic ? "قاعدة مهمة" : "Important rule"}</span><p className="mt-2">{isArabic ? "نتائج المطابقة هي Supply فقط. القائمة المختصرة لا تُنشأ إلا من طلب فعلي على فرصة مرتبطة، لذلك لن يظهر أي شخص كمتقدم أو مختار دون إجراء حقيقي." : "Matching results are supply only. The official shortlist is created only from a real application to a linked opportunity, so nobody appears as an applicant or selection without a real action."}</p></div>
      <style>{`.field{width:100%;min-height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);padding:12px 14px;color:white;outline:none}.field:focus{border-color:rgba(205,170,90,.55)}.field option{background:#111;color:white}`}</style>
    </div>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) { return <div className={`rounded-2xl border p-4 ${emphasis ? "border-gold/25 bg-gold/[0.06]" : "border-white/10 bg-black/20"}`}><p className="text-[10px] text-white/35">{label}</p><p className={emphasis ? "mt-1 text-2xl font-light text-gold" : "mt-1 text-2xl font-light"}>{value}</p></div>; }
function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center"><p className="text-[10px] text-white/35">{label}</p><p className="mt-1 text-lg font-light">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs text-white/45">{label}</span>{children}</label>; }
