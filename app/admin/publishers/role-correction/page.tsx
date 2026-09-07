import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAccess } from "@/lib/auth/require-admin";
import { assessPublisherRoleMismatch } from "@/lib/onboarding/publisher-role-correction";
import { PublisherService } from "@/lib/services/publishers/PublisherService";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ lang?: string; corrected?: string; error?: string }>;
};

async function correctPublisherRoleAction(formData: FormData) {
  "use server";

  const adminUser = await requireAdminAccess();
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const publisherId = Number(formData.get("publisher_id"));
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!Number.isInteger(publisherId) || publisherId <= 0 || confirmation !== "convert_to_talent") {
    redirect(`/admin/publishers/role-correction?lang=${locale}&error=invalid_confirmation`);
  }

  const db = createAdminClient();

  const { data: publisher, error: publisherError } = await db
    .from("publishers")
    .select("id,profile_id,publisher_type,company_name,description,verification_status")
    .eq("id", publisherId)
    .maybeSingle();

  if (publisherError || !publisher) {
    redirect(`/admin/publishers/role-correction?lang=${locale}&error=publisher_not_found`);
  }

  const [{ data: profile, error: profileError }, { count: opportunityCount, error: opportunitiesError }] = await Promise.all([
    db.from("profiles")
      .select("id,user_id,account_type")
      .eq("id", publisher.profile_id)
      .maybeSingle(),
    db.from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("publisher_id", publisher.id),
  ]);

  if (profileError || !profile || opportunitiesError) {
    redirect(`/admin/publishers/role-correction?lang=${locale}&error=preflight_failed`);
  }

  const assessment = assessPublisherRoleMismatch({
    publisherType: publisher.publisher_type,
    companyName: publisher.company_name,
    description: publisher.description,
    totalOpportunities: opportunityCount ?? 0,
    verificationStatus: publisher.verification_status,
  });

  if (profile.account_type !== "publisher" || !assessment.correctionEligible) {
    redirect(`/admin/publishers/role-correction?lang=${locale}&error=not_eligible`);
  }

  const { error: profileUpdateError } = await db
    .from("profiles")
    .update({
      account_type: "talent",
      onboarding_status: "profile_in_progress",
      onboarding_step: "talent_profile",
      approval_status: "not_submitted",
      profile_completed_at: null,
    })
    .eq("id", profile.id)
    .eq("account_type", "publisher");

  if (profileUpdateError) {
    redirect(`/admin/publishers/role-correction?lang=${locale}&error=profile_update_failed`);
  }

  const { error: publisherDeleteError } = await db
    .from("publishers")
    .delete()
    .eq("id", publisher.id)
    .eq("profile_id", profile.id);

  if (publisherDeleteError) {
    const { error: rollbackError } = await db
      .from("profiles")
      .update({ account_type: "publisher" })
      .eq("id", profile.id)
      .eq("account_type", "talent");

    if (rollbackError) {
      console.error("[role-correction] rollback failed", rollbackError);
    }

    redirect(`/admin/publishers/role-correction?lang=${locale}&error=publisher_cleanup_failed`);
  }

  const { error: eventError } = await db.from("events").insert({
    event_type: "admin_role_correction",
    target_type: "profile",
    target_id: String(profile.id),
    actor_id: adminUser.id,
    metadata: {
      from_account_type: "publisher",
      to_account_type: "talent",
      removed_publisher_id: publisher.id,
      reason: "likely_talent_registered_as_publisher",
    },
  });

  if (eventError) {
    console.error("[role-correction] audit event failed", eventError);
  }

  revalidatePath("/admin/publishers");
  revalidatePath("/admin/publishers/role-correction");
  revalidatePath(`/${locale}/talent-dashboard`);

  redirect(`/admin/publishers/role-correction?lang=${locale}&corrected=1`);
}

export default async function PublisherRoleCorrectionPage({ searchParams }: PageProps) {
  await requireAdminAccess();
  const params = await searchParams;
  const language = params.lang === "en" ? "en" : "ar";
  const isArabic = language === "ar";

  const publishers = await PublisherService.getAll();
  const candidates = publishers
    .map((publisher) => ({
      publisher,
      assessment: assessPublisherRoleMismatch({
        publisherType: publisher.publisher_type,
        companyName: publisher.company_name,
        description: publisher.description,
        totalOpportunities: publisher.total_opportunities,
        verificationStatus: publisher.verification_status,
      }),
    }))
    .filter((item) => item.assessment.likelyTalentMismatch);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="mx-auto w-full max-w-5xl px-4 py-10 text-white sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">MLAMH · ROLE CORRECTION</p>
          <h1 className="mt-3 text-3xl font-light">{isArabic ? "تصحيح نوع الحساب" : "Account Role Correction"}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            {isArabic
              ? "هذه الشاشة ترصد فقط الحالات التي تبدو كموهبة سُجلت كناشر. لا يحدث أي تحويل تلقائي؛ كل حالة تحتاج تأكيدًا صريحًا من مدير النظام."
              : "This screen only flags accounts that look like talent registered as publishers. Nothing is converted automatically; every correction requires explicit admin confirmation."}
          </p>
        </div>
        <Link href={`/admin/publishers?lang=${language}`} className="rounded-full border border-white/10 px-5 py-3 text-xs text-white/60 hover:border-gold/40 hover:text-gold">
          {isArabic ? "العودة للناشرين" : "Back to Publishers"}
        </Link>
      </div>

      {params.corrected === "1" ? (
        <div className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-4 text-sm text-emerald-100/80">
          {isArabic ? "تم تصحيح الحساب إلى مسار الموهبة وتسجيل الحدث في سجل العمليات." : "The account was corrected to Talent and the operation was audited."}
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-100/80">
          {isArabic ? `تعذر تنفيذ التصحيح: ${params.error}` : `Correction could not be completed: ${params.error}`}
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-5 text-sm leading-7 text-white/55">
        {isArabic
          ? "قاعدة الأمان: لا يسمح بالتحويل إلا لحساب Individual غير موثق، بدون أي فرص منشورة، ووصفه يحتوي إشارات واضحة إلى أنه يبحث عن فرص كممثل/مودل/موهبة."
          : "Safety rule: correction is allowed only for an unverified Individual publisher with zero opportunities and clear talent-seeking language in the profile description."}
      </div>

      {candidates.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center text-sm text-white/45">
          {isArabic ? "لا توجد حالات مرجحة حاليًا." : "No likely role mismatches right now."}
        </div>
      ) : (
        <div className="grid gap-5">
          {candidates.map(({ publisher, assessment }) => (
            <section key={publisher.id} className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[11px] text-amber-100/70">
                      {isArabic ? "قد تكون موهبة" : "Possible Talent"}
                    </span>
                    <span className="text-xs text-white/30">Publisher #{publisher.id}</span>
                  </div>
                  <h2 className="mt-3 text-xl text-white">{publisher.display_name || publisher.contact_name || (isArabic ? "بدون اسم" : "Unnamed")}</h2>
                  <p className="mt-2 text-sm text-white/45">{publisher.account_email || "—"} · {publisher.city || "—"}</p>
                </div>
                <div className="text-xs text-white/35">
                  {isArabic ? `الفرص: ${publisher.total_opportunities}` : `Opportunities: ${publisher.total_opportunities}`}
                </div>
              </div>

              {publisher.description ? (
                <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-7 text-white/60">
                  {publisher.description}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {assessment.reasons.map((reason) => (
                  <span key={reason} className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/35">{reason}</span>
                ))}
              </div>

              {assessment.correctionEligible ? (
                <form action={correctPublisherRoleAction} className="mt-6 rounded-2xl border border-red-400/15 bg-red-400/[0.025] p-5">
                  <input type="hidden" name="publisher_id" value={publisher.id} />
                  <input type="hidden" name="locale" value={language} />
                  <label className="flex items-start gap-3 text-sm leading-6 text-white/60">
                    <input type="checkbox" name="confirmation" value="convert_to_talent" required className="mt-1 h-4 w-4 accent-[#D4A017]" />
                    <span>
                      {isArabic
                        ? "أؤكد أنني راجعت الحساب وأن المستخدم سجّل بالخطأ كناشر. سيتم تحويله إلى Talent وإزالة سجل Publisher الخاطئ؛ لا توجد لديه فرص منشورة."
                        : "I confirm that I reviewed this account and the user registered as a Publisher by mistake. The account will become Talent and the mistaken Publisher record will be removed; it has no opportunities."}
                    </span>
                  </label>
                  <button type="submit" className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.08] px-5 py-3 text-sm text-red-100/80 hover:bg-red-400/[0.14]">
                    {isArabic ? "تحويل الحساب إلى موهبة" : "Convert account to Talent"}
                  </button>
                </form>
              ) : (
                <p className="mt-5 text-xs text-white/35">
                  {isArabic ? "الحالة تحتاج مراجعة يدوية ولا تستوفي شروط التحويل الآمن." : "This case needs manual review and is not eligible for governed correction."}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
