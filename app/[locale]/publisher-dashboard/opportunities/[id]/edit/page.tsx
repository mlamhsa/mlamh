import Link from "next/link";

import OpportunityEditForm from "@/components/publisher/OpportunityEditForm";
import PublisherShell from "@/components/publisher/PublisherShell";
import { requirePublisher } from "@/lib/auth/require-publisher";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: {
    locale: string;
    id: string;
  };
};

export default async function EditOpportunityPage({ params }: PageProps) {
  const { locale, id } = params;
  const isRtl = locale === "ar";

  const { publisher } = await requirePublisher(locale);
  const adminClient = createAdminClient();

  const opportunityId = Number(id);

  if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
    return (
      <PublisherShell locale={locale} isRtl={isRtl}>
        <div className="rounded-[2rem] border border-red-400/20 bg-red-400/[0.04] p-8 text-red-200">
          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-red-300/70">
            {isRtl ? "رابط غير صالح" : "Invalid Link"}
          </p>

          <h1 className="mt-3 text-3xl font-light text-white">
            {isRtl ? "رابط الفرصة غير صحيح" : "Invalid opportunity link"}
          </h1>

          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="arabic-safe mt-6 inline-flex rounded-full border border-red-300/30 px-5 py-3 text-xs uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-300 hover:text-black"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>
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
          <p className="arabic-safe text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "غير موجود" : "Not Found"}
          </p>

          <h1 className="mt-3 text-4xl font-light text-white">
            {isRtl ? "الفرصة غير موجودة" : "Opportunity not found"}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">
            {isRtl
              ? "قد تكون الفرصة محذوفة أو لا تملك صلاحية تعديلها."
              : "The opportunity may have been removed or you may not have permission to edit it."}
          </p>

          <Link
            href={`/${locale}/publisher-dashboard/opportunities`}
            className="arabic-safe mt-6 inline-flex rounded-full border border-gold/40 px-5 py-3 text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
          >
            {isRtl ? "العودة إلى الفرص" : "Back to Opportunities"}
          </Link>
        </div>
      </PublisherShell>
    );
  }

  return (
    <PublisherShell locale={locale} isRtl={isRtl}>
      <div className="space-y-6">
        <header className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-gold/[0.05] p-6 sm:p-8">
          <Link
            href={`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`}
            className="text-sm text-gold underline underline-offset-4"
          >
            {isRtl ? "← العودة إلى تفاصيل الفرصة" : "← Back to Opportunity"}
          </Link>

          <p className="arabic-safe mt-7 text-xs uppercase tracking-[0.35em] text-gold">
            {isRtl ? "تعديل الفرصة" : "Edit Opportunity"}
          </p>

          <h1 className="mt-3 text-4xl font-light text-white md:text-5xl">
            {opportunity.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
            {isRtl
              ? "حدّث بيانات الفرصة ثم احفظ التغييرات. قد تحتاج التعديلات المهمة إلى مراجعة الإدارة قبل إعادة النشر."
              : "Update the opportunity details and save your changes. Major edits may require admin review before republishing."}
          </p>
        </header>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 sm:p-8">
          <OpportunityEditForm
            locale={locale}
            isRtl={isRtl}
            opportunity={opportunity}
          />
        </section>
      </div>
    </PublisherShell>
  );
}