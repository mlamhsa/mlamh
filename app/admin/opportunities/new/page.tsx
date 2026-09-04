import Link from "next/link";

import AdminLocalizedOpportunityForm from "@/components/admin/opportunities/AdminLocalizedOpportunityForm";
import { requireAdminAccess } from "@/lib/auth/require-admin";
import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Create Managed Opportunity — MLAMH Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = { searchParams: Promise<{ brief_id?: string }> };

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export default async function AdminCreateOpportunityPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const { brief_id: briefIdRaw } = await searchParams;
  const briefId = Number(briefIdRaw);
  const validBriefId = Number.isInteger(briefId) && briefId > 0 ? briefId : null;
  const db = createAdminClient();

  let initialValues: Parameters<typeof AdminLocalizedOpportunityForm>[0]["initialValues"] = {};
  let briefReady = false;

  if (validBriefId) {
    const { data: brief } = await db
      .from("marketing_briefs")
      .select("id,project_type,talent_type,talent_count,city,location_notes,shoot_date,time_window,requirements,compensation,budget,contact_id,lead_id,status,opportunity_id")
      .eq("id", validBriefId)
      .maybeSingle();

    if (brief && brief.status === "complete" && !brief.opportunity_id) {
      briefReady = true;
      let organization = "";
      let contactId = typeof brief.contact_id === "number" ? brief.contact_id : null;

      if (typeof brief.lead_id === "number") {
        const { data: lead } = await db
          .from("marketing_leads")
          .select("organization,contact_id")
          .eq("id", brief.lead_id)
          .maybeSingle();
        organization = typeof lead?.organization === "string" ? lead.organization : "";
        if (!contactId && typeof lead?.contact_id === "number") contactId = lead.contact_id;
      }

      let contactName = "";
      let contactPhone = "";
      let contactEmail = "";
      if (contactId) {
        const { data: contact } = await db
          .from("marketing_contacts")
          .select("contact_name,phone,email,organization_name")
          .eq("id", contactId)
          .maybeSingle();
        contactName = typeof contact?.contact_name === "string" ? contact.contact_name : "";
        contactPhone = typeof contact?.phone === "string" ? contact.phone : "";
        contactEmail = typeof contact?.email === "string" ? contact.email : "";
        if (!organization && typeof contact?.organization_name === "string") organization = contact.organization_name;
      }

      const cityText = typeof brief.city === "string" ? brief.city.trim().toLowerCase() : "";
      const matchedCity = SAUDI_CITIES.find((city) =>
        [city.slug, city.ar, city.en].some((value) => value.toLowerCase() === cityText),
      );
      const requirements = asRecord(brief.requirements);
      const requirementText = typeof requirements.text === "string" ? requirements.text.trim() : "";
      const descriptionParts = [
        requirementText,
        brief.location_notes ? `ملاحظات الموقع: ${brief.location_notes}` : "",
        brief.time_window ? `الفترة الزمنية: ${brief.time_window}` : "",
        brief.compensation ? `المقابل: ${brief.compensation}` : "",
      ].filter(Boolean);
      const hasBudget = typeof brief.budget === "number" && brief.budget > 0;

      initialValues = {
        marketingBriefId: brief.id,
        sourceType: organization ? "client" : "mlamh",
        publicSourceMode: organization ? "client_name" : "mlamh",
        clientCompanyName: organization,
        contactName,
        contactPhone,
        contactEmail,
        title: brief.project_type ? `فرصة ${brief.project_type}` : "",
        description: descriptionParts.join("\n\n"),
        opportunityType: brief.talent_type === "actor" ? "actor" : "model",
        citySlug: matchedCity?.slug ?? "",
        requiredCount: typeof brief.talent_count === "number" ? brief.talent_count : null,
        compensationType: hasBudget ? "fixed" : "negotiable",
        budget: hasBudget ? brief.budget : null,
        workDate: typeof brief.shoot_date === "string" ? brief.shoot_date : "",
      };
    }
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c8a45d]">
              MLAMH Admin
            </p>

            <h1 className="mt-2 text-3xl font-semibold">
              إنشاء فرصة مُدارة
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              {briefReady
                ? "تم تحميل البريف المكتمل. راجع البيانات قبل الحفظ أو النشر؛ عند الإنشاء سيتم ربط الفرصة بالبريف والـLead تلقائيًا."
                : "اكتب عنوان ووصف الفرصة بالعربية فقط، وستقوم ملامح بإنشاء النسخة الإنجليزية تلقائيًا عند الحفظ أو النشر."}
            </p>
          </div>

          <Link
            href={briefReady ? "/admin/marketing/briefs?lang=ar" : "/admin/opportunities"}
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-white/20 hover:text-white"
          >
            {briefReady ? "العودة للبريفات" : "العودة للفرص"}
          </Link>
        </div>

        {validBriefId && !briefReady ? (
          <div className="mb-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-100">
            لا يمكن تحويل هذا البريف الآن: يجب أن يكون مكتملًا وألا يكون مرتبطًا بفرصة سابقة.
          </div>
        ) : null}

        <AdminLocalizedOpportunityForm initialValues={initialValues} />
      </div>
    </main>
  );
}
