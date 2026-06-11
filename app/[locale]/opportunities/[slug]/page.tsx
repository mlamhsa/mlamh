// /app/[locale]/opportunities/[slug]/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPublishedOpportunities } from "@/lib/supabase/opportunities";
import OpportunityShareButton from "@/components/opportunities/OpportunityShareButton";

type OpportunityPageProps = {
  params: Promise<{ locale?: string; slug: string }>;
};

async function applyToOpportunity(formData: FormData) {
  "use server";

  const locale = String(formData.get("locale") ?? "ar");
  const opportunityId = Number(formData.get("opportunityId"));

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect(`/${locale}/talent-login`);
  }

  const { data: talent } = await adminClient
    .from("talents")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!talent) {
    redirect(`/${locale}/talent/register`);
  }

  const { data: existingApplication } = await adminClient
    .from("opportunity_applications")
    .select("id")
    .eq("opportunity_id", opportunityId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (!existingApplication) {
    await adminClient.from("opportunity_applications").insert({
      opportunity_id: opportunityId,
      talent_id: talent.id,
      status: "pending",
    });
  }

  redirect(`/${locale}/talent-dashboard/requests`);
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityPageProps) {
  const { locale = "ar", slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const isRtl = locale === "ar";

  const opportunities = await getPublishedOpportunities();

  const opportunity =
    opportunities.find(
      (item: any) => item.slug === slug || String(item.id) === slug
    ) || null;

  if (!opportunity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#c8a45d]">
            MLAMH
          </p>
          <h1 className="mt-5 text-4xl font-light">
            {isRtl ? "لم يتم العثور على الفرصة" : "Opportunity Not Found"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/45">
            {isRtl
              ? "الفرصة التي تحاول الوصول إليها غير موجودة أو لم تعد متاحة."
              : "The opportunity you are looking for does not exist or is no longer available."}
          </p>
          <Link
            href={`/${locale}/opportunities`}
            className="mt-8 inline-flex rounded-full border border-[#c8a45d] px-7 py-4 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
          >
            {isRtl ? "العودة للفرص" : "Back to Opportunities"}
          </Link>

          <OpportunityShareButton title={opportunity.title || "فرصة من ملامح"} />
        </div>
      </main>
    );
  }

  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: talent } = user
    ? await adminClient
        .from("talents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: existingApplication } = talent
    ? await adminClient
        .from("opportunity_applications")
        .select("id, status")
        .eq("opportunity_id", opportunity.id)
        .eq("talent_id", talent.id)
        .maybeSingle()
    : { data: null };

  const canApply = !!user && !!talent && !existingApplication;
  const city = isRtl
    ? opportunity.city_ar || opportunity.city_en || "-"
    : opportunity.city_en || opportunity.city_ar || "-";

  const isOpen = opportunity.status === "open";

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/opportunities`}
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:border-[#c8a45d]/60 hover:text-[#c8a45d]"
          >
            {isRtl ? "العودة للفرص" : "Back to Opportunities"}
          </Link>

          <OpportunityShareButton title={opportunity.title || "فرصة من ملامح"} />
          
          {talent && (
            <Link
              href={`/${locale}/talent-dashboard`}
              className="rounded-full border border-[#c8a45d]/40 px-5 py-3 text-sm text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
            >
              {isRtl ? "لوحة الموهبة" : "Talent Dashboard"}
            </Link>
          )}
        </div>

        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 md:p-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#c8a45d]/40 bg-[#c8a45d]/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#c8a45d]">
                {opportunity.opportunity_type || "-"}
              </span>

              <span
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] ${
                  isOpen
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-red-400/30 bg-red-400/10 text-red-300"
                }`}
              >
                {isOpen
                  ? isRtl
                    ? "مفتوحة"
                    : "Open"
                  : isRtl
                    ? "مغلقة"
                    : "Closed"}
              </span>
            </div>

            <h1 className="max-w-4xl text-4xl font-light leading-tight md:text-6xl">
              {opportunity.title || "-"}
            </h1>

            <p className="mt-6 max-w-3xl text-sm leading-8 text-white/50 md:text-base">
              {opportunity.description || "-"}
            </p>
          </div>

          <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-[#c8a45d]">
                  {isRtl ? "تفاصيل الفرصة" : "Opportunity Details"}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoCard
                    label={isRtl ? "المدينة" : "City"}
                    value={city}
                  />
                  <InfoCard
                    label={isRtl ? "الميزانية" : "Budget"}
                    value={
                      opportunity.budget
                        ? `${opportunity.budget} ${isRtl ? "ريال" : "SAR"}`
                        : isRtl
                          ? "حسب الاتفاق"
                          : "By agreement"
                    }
                  />
                  <InfoCard
                    label={isRtl ? "العمر المطلوب" : "Required Age"}
                    value={
                      opportunity.min_age || opportunity.max_age
                        ? `${opportunity.min_age ?? "-"} - ${
                            opportunity.max_age ?? "-"
                          }`
                        : "-"
                    }
                  />
                  <InfoCard
                    label={isRtl ? "الجنس المطلوب" : "Required Gender"}
                    value={opportunity.required_gender || "-"}
                  />
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-[#c8a45d]">
                  {isRtl ? "وصف الفرصة" : "Description"}
                </p>

                <p className="mt-5 text-sm leading-8 text-white/55">
                  {opportunity.description || "-"}
                </p>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-[#c8a45d]/20 bg-[#c8a45d]/[0.04] p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-[#c8a45d]">
                  {isRtl ? "التقديم" : "Application"}
                </p>

                <h2 className="mt-4 text-2xl font-light">
                  {isRtl ? "جاهز للتقديم؟" : "Ready to apply?"}
                </h2>

                <p className="mt-3 text-sm leading-7 text-white/45">
                  {isRtl
                    ? "يمكن للموهبة المسجلة فقط التقديم على هذه الفرصة."
                    : "Only registered talent accounts can apply to this opportunity."}
                </p>

                <div className="mt-7">
                  {!isOpen ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                      {isRtl
                        ? "هذه الفرصة مغلقة حالياً."
                        : "This opportunity is currently closed."}
                    </div>
                  ) : existingApplication ? (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                      {isRtl
                        ? "لقد قدمت على هذه الفرصة مسبقاً."
                        : "You have already applied to this opportunity."}
                    </div>
                  ) : canApply ? (
                    <form action={applyToOpportunity}>
                      <input type="hidden" name="locale" value={locale} />
                      <input
                        type="hidden"
                        name="opportunityId"
                        value={opportunity.id}
                      />

                      <button
                        type="submit"
                        className="w-full rounded-full bg-[#c8a45d] px-8 py-4 text-sm font-medium text-black transition hover:bg-[#e0bd73]"
                      >
                        {isRtl ? "التقديم على الفرصة" : "Apply for Opportunity"}
                      </button>
                    </form>
                  ) : (
                    <Link
                      href={`/${locale}/talent-login`}
                      className="block w-full rounded-full border border-[#c8a45d] px-8 py-4 text-center text-sm font-medium text-[#c8a45d] transition hover:bg-[#c8a45d] hover:text-black"
                    >
                      {isRtl
                        ? "سجّل الدخول كموهبة للتقديم"
                        : "Login as Talent to Apply"}
                    </Link>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-black/30 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.32em] text-[#c8a45d]">
                  {isRtl ? "جهة العرض" : "Publisher"}
                </p>

                <div className="mt-5 space-y-4 text-sm">
                  <InfoLine
                    label={isRtl ? "الشركة" : "Company"}
                    value={opportunity.company_name || "-"}
                  />
                  <InfoLine
                    label={isRtl ? "مسؤول التواصل" : "Contact"}
                    value={opportunity.contact_name || "-"}
                  />
                  <InfoLine
                    label={isRtl ? "الهاتف" : "Phone"}
                    value={opportunity.contact_phone || "-"}
                  />
                  <InfoLine
                    label={isRtl ? "البريد" : "Email"}
                    value={opportunity.contact_email || "-"}
                  />
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-lg font-light text-white">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-white/35">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}