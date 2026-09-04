import Link from "next/link";
import { notFound } from "next/navigation";

import AdminLocalizedOpportunityEditForm from "@/components/admin/opportunities/AdminLocalizedOpportunityEditForm";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Edit Opportunity — MLAMH Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ lang?: string }> };

export default async function EditManagedOpportunityPage({ params, searchParams }: PageProps) {
  await requireAdminAccess();
  const [{ id }, resolvedSearch] = await Promise.all([params, searchParams ?? Promise.resolve({})]);
  const opportunityId = Number(id);
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) notFound();

  const db = createAdminClient();
  const { data: opportunity, error } = await db.from("opportunities").select("id,title,description,opportunity_type,city_slug,required_gender,min_age,max_age,required_count,compensation_type,budget,application_days,work_date,work_time,work_duration,company_name,contact_name,contact_phone,contact_email,status,published,role_requirements").eq("id", opportunityId).maybeSingle();
  if (error || !opportunity) notFound();

  const roleRequirements = opportunity.role_requirements && typeof opportunity.role_requirements === "object" && !Array.isArray(opportunity.role_requirements)
    ? opportunity.role_requirements as Record<string, unknown>
    : {};
  const managed = roleRequirements.managed_by === "mlamh";
  if (!managed || opportunity.published || !["draft", "needs_changes"].includes(opportunity.status)) notFound();

  const sourceType = roleRequirements.source_type === "client" ? "client" : "mlamh";
  const rawPublicMode = typeof roleRequirements.public_source_mode === "string" ? roleRequirements.public_source_mode : "mlamh";
  const publicSourceMode = rawPublicMode === "client_name" || rawPublicMode === "mlamh_clients" ? rawPublicMode : "mlamh";
  const clientCompanyName = typeof roleRequirements.client_company_name === "string" ? roleRequirements.client_company_name : sourceType === "client" ? opportunity.company_name : null;
  const lang = resolvedSearch.lang === "en" ? "en" : "ar";

  return (
    <main dir="rtl" className="min-h-screen bg-background px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">MLAMH ADMIN · OPPORTUNITY #{opportunity.id}</p>
            <h1 className="mt-2 text-4xl font-light">تعديل الفرصة</h1>
          </div>
          <Link href={`/admin/opportunities/${opportunity.id}?lang=${lang}`} className="rounded-full border border-white/10 px-5 py-3 text-xs text-white/60 hover:border-gold/40 hover:text-gold">العودة إلى التفاصيل</Link>
        </div>

        <AdminLocalizedOpportunityEditForm initialValues={{
          opportunityId: opportunity.id,
          sourceType,
          publicSourceMode,
          clientCompanyName,
          contactName: opportunity.contact_name,
          contactPhone: opportunity.contact_phone,
          contactEmail: opportunity.contact_email,
          title: opportunity.title ?? "",
          description: opportunity.description ?? "",
          opportunityType: opportunity.opportunity_type === "actor" ? "actor" : "model",
          citySlug: opportunity.city_slug,
          requiredGender: opportunity.required_gender === "male" ? "male" : opportunity.required_gender === "female" ? "female" : "any",
          minAge: opportunity.min_age,
          maxAge: opportunity.max_age,
          requiredCount: opportunity.required_count,
          compensationType: opportunity.compensation_type === "negotiable" || opportunity.compensation_type === "unpaid" ? opportunity.compensation_type : "fixed",
          budget: opportunity.budget,
          applicationDays: opportunity.application_days,
          workDate: opportunity.work_date,
          workTime: opportunity.work_time,
          workDuration: opportunity.work_duration,
        }} />
      </div>
    </main>
  );
}
