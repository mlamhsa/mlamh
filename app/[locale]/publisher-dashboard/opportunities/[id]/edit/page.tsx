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

  // تحقق من أن المستخدم ناشر
  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  // جلب الفرصة الخاصة بالناشر فقط
  const { data: opportunity } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("id", Number(id))
    .eq("publisher_id", publisher.id)
    .maybeSingle();

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1>{isRtl ? "الفرصة غير موجودة" : "Opportunity not found"}</h1>
      </main>
    );
  }

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">
          {isRtl ? "تعديل الفرصة" : "Edit Opportunity"}
        </p>

        <h1 className="mt-3 text-4xl font-light text-white">
          {isRtl
            ? `تعديل الفرصة رقم ${opportunity.id}`
            : `Edit Opportunity #${opportunity.id}`}
        </h1>

        <p className="mt-4 text-sm text-white/45">
          {isRtl
            ? "يمكنك تعديل بيانات الفرصة وحفظ التغييرات."
            : "Edit the opportunity details and save changes."}
        </p>

        <div className="mt-6">
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