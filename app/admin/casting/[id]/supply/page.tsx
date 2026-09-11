/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";

import { inviteManagedCastingTalentAction } from "@/lib/actions/admin-managed-invitations";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { calculateTalentSupplyGap, getTalentSupplyForBrief } from "@/lib/talent/supply";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RoleRow = {
  id: number;
  title: string;
  title_en: string | null;
  talent_type: "actor" | "model";
  required_count: number;
  requirements: Record<string, unknown> | null;
  status: string;
  opportunity_id: number | null;
};

type InvitationRow = {
  id: number;
  casting_role_id: number;
  opportunity_id: number;
  talent_id: number;
  status: "sent" | "viewed" | "applied" | "declined" | "expired";
  sent_at: string | null;
};

function stringRequirement(requirements: Record<string, unknown> | null, key: string) {
  const value = requirements?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberRequirement(requirements: Record<string, unknown> | null, key: string) {
  const value = Number(requirements?.[key]);
  return Number.isFinite(value) ? value : null;
}

function talentAge(talent: Record<string, unknown>) {
  const direct = Number(talent.age);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const dob = typeof talent.date_of_birth === "string" ? talent.date_of_birth : typeof talent.birth_date === "string" ? talent.birth_date : null;
  if (!dob) return null;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const month = today.getUTCMonth() - date.getUTCMonth();
  if (month < 0 || (month === 0 && today.getUTCDate() < date.getUTCDate())) age -= 1;
  return age;
}

function invitationLabel(status: InvitationRow["status"], ar: boolean) {
  if (status === "viewed") return ar ? "تمت المشاهدة" : "Viewed";
  if (status === "applied") return ar ? "تم التقديم" : "Applied";
  if (status === "declined") return ar ? "اعتذر" : "Declined";
  if (status === "expired") return ar ? "انتهت الدعوة" : "Expired";
  return ar ? "تم إرسال الدعوة" : "Invitation sent";
}

export default async function ManagedCastingSupplyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requireAdminAccess();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) notFound();
  const language = query.lang === "en" ? "en" : "ar";
  const ar = language === "ar";
  const admin = createAdminClient();

  const [{ data: project }, { data: roles }, { data: invitations }] = await Promise.all([
    admin.from("casting_projects").select("id,project_title,service_mode,city,country_code,required_count,talent_type,status").eq("id", projectId).maybeSingle(),
    admin.from("casting_roles").select("id,title,title_en,talent_type,required_count,requirements,status,opportunity_id").eq("casting_project_id", projectId).neq("status", "cancelled").order("sort_order", { ascending: true }),
    admin.from("managed_casting_invitations").select("id,casting_role_id,opportunity_id,talent_id,status,sent_at").eq("casting_project_id", projectId),
  ]);
  if (!project || project.service_mode !== "managed") notFound();

  const invitationRows = (invitations ?? []) as InvitationRow[];
  const invitationMap = new Map(invitationRows.map((item) => [`${item.casting_role_id}:${item.talent_id}`, item]));
  const roleRows = (roles ?? []) as RoleRow[];
  const effectiveRoles: RoleRow[] = roleRows.length > 0 ? roleRows : [{
    id: 0,
    title: project.project_title,
    title_en: null,
    talent_type: project.talent_type === "model" ? "model" : "actor",
    required_count: Number(project.required_count) || 1,
    requirements: project.city ? { city: project.city } : {},
    status: project.status,
    opportunity_id: null,
  }];

  const supplies = await Promise.all(effectiveRoles.map(async (role) => {
    const requirements = role.requirements ?? {};
    const city = stringRequirement(requirements, "city") || project.city || null;
    const gender = stringRequirement(requirements, "gender");
    const minAge = numberRequirement(requirements, "min_age");
    const maxAge = numberRequirement(requirements, "max_age");
    const supply = await getTalentSupplyForBrief({
      talent_count: role.required_count,
      talent_type: role.talent_type,
      country_code: project.country_code === "AE" || project.country_code === "QA" ? project.country_code : "SA",
      city,
      required_gender: gender && gender !== "any" ? gender : null,
      requirements: { city },
    });

    const ageFiltered = supply.sendableTalents.filter((talent) => {
      if (minAge === null && maxAge === null) return true;
      const age = talentAge(talent as Record<string, unknown>);
      if (age === null) return false;
      if (minAge !== null && age < minAge) return false;
      if (maxAge !== null && age > maxAge) return false;
      return true;
    });
    const gap = calculateTalentSupplyGap({ talent_count: role.required_count }, { ...supply, sendableTalents: ageFiltered });
    return { role, city, gender, minAge, maxAge, supply, matches: ageFiltered, gap };
  }));

  return <div dir={ar ? "rtl" : "ltr"} className="px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><Link href={`/admin/casting/${projectId}?lang=${language}`} className="text-xs text-gold hover:underline">{ar ? "← العودة للمشروع" : "← Back to project"}</Link><p className="mt-4 text-xs uppercase tracking-[0.28em] text-gold">INTERNAL TALENT SUPPLY</p><h1 className="mt-2 text-3xl font-light text-white">{project.project_title}</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-white/40">{ar ? "مطابقة داخلية لفريق ملامح فقط. تشمل المواهب العامة والخاصة المؤهلة. الدعوة تفتح للموهبة الفرصة الفعلية ولا تنشئ طلبًا أو Shortlist إلا عندما تتقدم الموهبة بنفسها." : "Internal MLAMH-only matching for qualified public and private talent. Invitations open the real opportunity and never create an application or shortlist entry unless the talent applies."}</p></div><Link href={`/admin/casting/${projectId}/applications?lang=${language}`} className="rounded-xl border border-gold/25 px-4 py-2.5 text-sm text-gold">{ar ? "مركز الفرز" : "Screening"}</Link></div>

    <div className="mt-6 space-y-6">{supplies.map(({ role, city, gender, minAge, maxAge, supply, matches, gap }) => <section key={role.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-light text-white">{ar ? role.title : role.title_en || role.title}</h2><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">{role.talent_type}</span>{role.opportunity_id ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] px-2.5 py-1 text-[10px] text-emerald-200">{ar ? "جاهز للدعوات" : "Invites ready"}</span> : <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-2.5 py-1 text-[10px] text-amber-200">{ar ? "انشر فرصة الدور أولًا" : "Publish role first"}</span>}</div><p className="mt-2 text-xs text-white/35">{[city, gender && gender !== "any" ? gender : null, minAge !== null || maxAge !== null ? `${minAge ?? "—"}-${maxAge ?? "—"}` : null].filter(Boolean).join(" · ") || (ar ? "بدون قيود إضافية" : "No additional constraints")}</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3"><p className="text-[10px] text-white/30">{ar ? "مطلوب" : "Needed"}</p><p className="mt-1 text-xl text-white">{gap.needed}</p></div><div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] px-4 py-3"><p className="text-[10px] text-emerald-200/60">{ar ? "مطابق" : "Matches"}</p><p className="mt-1 text-xl text-white">{gap.available}</p></div><div className={`rounded-xl border px-4 py-3 ${gap.missing > 0 ? "border-amber-300/15 bg-amber-300/[0.04]" : "border-white/[0.07] bg-black/20"}`}><p className="text-[10px] text-white/30">Supply Gap</p><p className="mt-1 text-xl text-white">{gap.missing}</p></div></div></div>

      {matches.length === 0 ? <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm text-amber-100/70">{ar ? "لا توجد مواهب مطابقة بالكامل حاليًا. راجع أسباب الاستبعاد أو وسّع شروط الدور." : "No fully sendable talent currently matches. Review exclusion reasons or widen the role criteria."}</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{matches.slice(0, 24).map((talent) => {
        const talentId = Number(talent.id);
        const name = ar ? String(talent.display_name_ar || talent.name_ar || talent.display_name_en || talent.name_en || `Talent #${talent.id}`) : String(talent.display_name_en || talent.name_en || talent.display_name_ar || talent.name_ar || `Talent #${talent.id}`);
        const cityLabel = ar ? String(talent.city_ar || talent.city_en || "—") : String(talent.city_en || talent.city_ar || "—");
        const image = typeof talent.image_url === "string" ? talent.image_url : null;
        const slug = typeof talent.slug === "string" ? talent.slug : null;
        const published = talent.published === true;
        const invitation = invitationMap.get(`${role.id}:${talentId}`);
        return <article key={String(talent.id)} className="rounded-xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-center gap-3">{image ? <img src={image} alt="" className="h-14 w-14 rounded-xl object-cover"/> : <div className="h-14 w-14 rounded-xl border border-white/10"/>}<div className="min-w-0"><p className="truncate text-sm text-white/80">{name}</p><p className="mt-1 text-xs text-white/35">{cityLabel}</p><p className="mt-1 text-[10px] text-gold/60">{published ? (ar ? "ملف عام" : "Public profile") : (ar ? "ملف خاص — للمطابقة فقط" : "Private profile — matching only")}</p></div></div><div className="mt-3 flex flex-wrap items-center gap-2">{published && slug ? <Link href={`/${language}/talent/${slug}`} target="_blank" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-gold">{ar ? "عرض الملف" : "View profile"}</Link> : null}{invitation ? <span className={`inline-flex min-h-10 items-center rounded-lg border px-3 py-2 text-xs ${invitation.status === "applied" ? "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-200" : "border-gold/20 bg-gold/[0.05] text-gold"}`}>{invitationLabel(invitation.status, ar)}</span> : role.id > 0 && role.opportunity_id ? <form action={inviteManagedCastingTalentAction}><input type="hidden" name="project_id" value={projectId}/><input type="hidden" name="role_id" value={role.id}/><input type="hidden" name="talent_id" value={talentId}/><button type="submit" className="inline-flex min-h-10 items-center rounded-lg border border-gold/25 bg-gold/[0.07] px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold hover:text-black">{ar ? "دعوة للفرصة" : "Invite to opportunity"}</button></form> : <span className="inline-flex min-h-10 items-center rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-white/30">{ar ? "انشر فرصة الدور لإرسال دعوات" : "Publish the role to invite"}</span>}</div></article>;
      })}</div>}

      {supply.evaluations.length > matches.length ? <details className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4"><summary className="cursor-pointer text-xs text-white/50">{ar ? "ملخص أسباب عدم المطابقة" : "Non-match reason summary"}</summary><div className="mt-3 flex flex-wrap gap-2">{Array.from(new Set(supply.evaluations.flatMap((item) => item.reasons))).slice(0, 16).map((reason) => <span key={reason} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/35">{reason}</span>)}</div></details> : null}
    </section>)}</div>
  </div></div>;
}
