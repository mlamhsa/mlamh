import { AdminCard, AdminGrid, AdminPageContainer, AdminPageHeader, AdminStatCard } from "@/components/admin/ui";
import { getAdminLanguage } from "@/lib/admin/i18n";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ lang?: string }> };

export default async function TalentGrowthPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { lang } = await searchParams;
  const isArabic = getAdminLanguage(lang) === "ar";
  const db = createAdminClient();
  const [registrations, complete, submitted, approved, applications] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent"),
    db.from("talents").select("id", { count: "exact", head: true }).gte("profile_completion", 100),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").in("approval_status", ["pending", "approved", "changes_requested", "rejected"]),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "talent").eq("approval_status", "approved"),
    db.from("opportunity_applications").select("id", { count: "exact", head: true }),
  ]);
  const values = { registrations: registrations.count ?? 0, complete: complete.count ?? 0, submitted: submitted.count ?? 0, approved: approved.count ?? 0, applications: applications.count ?? 0 };
  const activation = values.registrations > 0 ? Math.round((values.approved / values.registrations) * 100) : 0;
  const funnel = [
    [isArabic ? "تسجيل" : "Registration", values.registrations],
    [isArabic ? "ملف مكتمل" : "Profile Complete", values.complete],
    [isArabic ? "تم الإرسال" : "Submitted", values.submitted],
    [isArabic ? "معتمد" : "Approved", values.approved],
    [isArabic ? "طلبات تقديم" : "Applications", values.applications],
  ] as const;
  return <AdminPageContainer>
    <AdminPageHeader title={isArabic ? "نمو المواهب" : "Talent Growth"} description={isArabic ? "Funnel حقيقي من التسجيل إلى الاعتماد والتقديم. Attribution حسب القناة سيظهر عند بدء تسجيل Marketing Events." : "Real funnel from registration to approval and applications. Channel attribution appears once Marketing Events collection starts."} />
    <AdminGrid className="mb-6 md:grid-cols-3 xl:grid-cols-5"><AdminStatCard label={isArabic ? "التسجيلات" : "Registrations"} value={values.registrations} /><AdminStatCard label={isArabic ? "المكتملة" : "Complete"} value={values.complete} /><AdminStatCard label={isArabic ? "المرسلة" : "Submitted"} value={values.submitted} /><AdminStatCard label={isArabic ? "المعتمدة" : "Approved"} value={values.approved} /><AdminStatCard label={isArabic ? "Activation" : "Activation"} value={`${activation}%`} /></AdminGrid>
    <AdminCard className="p-5"><h2 className="text-lg text-white">{isArabic ? "مسار التحويل" : "Conversion funnel"}</h2><div className="mt-5 space-y-3">{funnel.map(([label, value], index) => { const previous = index === 0 ? value : funnel[index - 1][1]; const rate = previous > 0 ? Math.round((value / previous) * 100) : 0; return <div key={label} className="grid grid-cols-[1fr_auto_auto] gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-sm"><span className="text-white/65">{label}</span><span className="tabular-nums text-white">{value}</span><span className="w-14 text-end text-gold/70">{index === 0 ? "—" : `${rate}%`}</span></div>; })}</div></AdminCard>
  </AdminPageContainer>;
}
