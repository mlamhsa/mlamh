import PublisherShell from "@/components/publisher/PublisherShell";
import OpportunityEditForm from "@/components/publisher/OpportunityEditForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePublisher } from "@/lib/auth/require-publisher";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

export default async function EditOpportunityPage({ params }: PageProps) {
  const { locale, id } = await params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const opportunityId = Number(id);

  if (!Number.isFinite(opportunityId)) {
    return (
      <PublisherShell locale={locale} isRtl={isRtl}>
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.04] p-8 text-red-200">
          {isRtl ? "رابط الفرصة غير صحيح." : "Invalid opportunity link."}
        </div>
      </PublisherShell>
    );
  }

  const { data: opportunity, error } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (error) {
    console.error("Edit opportunity error:", error);
  }

  if (!opportunity) {
    return (
      <PublisherShell locale={locale} isRtl={isRtl}>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "غير موجود" : "Not Found"}
          </p>

          <h1 className="mt-3 text-4xl font-light text-white">
            {isRtl ? "الفرصة غير موجودة" : "Opportunity not found"}
          </h1>
        </div>
      </PublisherShell>
    );
  }

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl ? "تعديل الفرصة" : "Edit Opportunity"}
        </p>

        <h1 className="mt-3 text-4xl font-light text-white">
          {opportunity.title}
        </h1>

        <p className="mt-4 text-sm text-white/45">
          {isRtl
            ? "يمكنك تعديل بيانات الفرصة وحفظ التغييرات."
            : "Edit the opportunity details and save changes."}
        </p>

        <div className="mt-8">
          <OpportunityEditForm
            locale={locale}
            isRtl={isRtl}
            opportunity={opportunity}
          />
        </div>
      </div>
    </PublisherShell>
  );
}