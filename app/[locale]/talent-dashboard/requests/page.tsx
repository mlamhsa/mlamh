import Link from "next/link";

import { respondOpportunityInvitationAction } from "@/lib/actions/respond-opportunity-invitation";
import { requireTalent } from "@/lib/auth/require-talent";
import { createAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

type InvitationRow = {
  id: number;
  publisher_id: number;
  opportunity_id: number;
  status: string | null;
  created_at?: string | null;
};

type OpportunityRow = {
  id: number;
  slug: string | null;
  title: string | null;
  city_ar: string | null;
  city_en: string | null;
  posting_mode?: string | null;
};

type PublisherRow = {
  id: number;
  company_name?: string | null;
  contact_name?: string | null;
  publisher_type?: string | null;
  verified?: boolean | null;
};

export default async function TalentRequestsPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "ar";
  const isRtl = locale === "ar";
  const { talent } = await requireTalent(locale);
  const admin = createAdminClient();

  const { data: invitationData, error: invitationError } = await admin
    .from("opportunity_invitations")
    .select("id,publisher_id,opportunity_id,status,created_at")
    .eq("talent_id", talent.id)
    .order("created_at", { ascending: false });

  if (invitationError) {
    console.error("[TalentRequestsPage.invitations]", invitationError);
  }

  const invitations = (invitationData ?? []) as InvitationRow[];
  const opportunityIds = [...new Set(invitations.map((item) => item.opportunity_id))];
  const publisherIds = [...new Set(invitations.map((item) => item.publisher_id))];

  const [{ data: opportunityData }, { data: publisherData }] = await Promise.all([
    opportunityIds.length > 0
      ? admin
          .from("opportunities")
          .select("id,slug,title,city_ar,city_en,posting_mode")
          .in("id", opportunityIds)
      : Promise.resolve({ data: [] }),
    publisherIds.length > 0
      ? admin
          .from("publishers")
          .select("id,company_name,contact_name,publisher_type,verified")
          .in("id", publisherIds)
      : Promise.resolve({ data: [] }),
  ]);

  const opportunities = new Map(
    ((opportunityData ?? []) as OpportunityRow[]).map((item) => [item.id, item]),
  );
  const publishers = new Map(
    ((publisherData ?? []) as PublisherRow[]).map((item) => [item.id, item]),
  );

  const pendingCount = invitations.filter((item) => item.status === "sent").length;

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <header className="mb-6 rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,169,98,0.13),transparent_45%),rgba(255,255,255,0.025)] p-5 sm:p-7">
          <p className="text-xs text-gold">{isRtl ? "دعوات التواصل" : "Contact invitations"}</p>
          <h1 className="mt-2 text-3xl font-light sm:text-4xl">
            {isRtl ? "طلبات وصلت لك من الناشرين" : "Publisher invitations for you"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
            {isRtl
              ? "قبول الدعوة يعني أنك موافق على بدء التواصل داخل ملامح فقط. لن نعرض رقم جوالك أو واتساب للطرف الآخر."
              : "Accepting means you consent to contact inside MLAMH only. Your phone number or WhatsApp will not be exposed."}
          </p>
          {pendingCount > 0 ? (
            <span className="mt-4 inline-flex rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-3 py-1.5 text-xs text-amber-200">
              {isRtl ? `${pendingCount} دعوة بانتظار ردك` : `${pendingCount} invitation${pendingCount === 1 ? "" : "s"} waiting`}
            </span>
          ) : null}
        </header>

        {invitations.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <h2 className="text-xl font-light">{isRtl ? "لا توجد دعوات حاليًا" : "No invitations yet"}</h2>
            <p className="mt-3 text-sm leading-7 text-white/40">
              {isRtl
                ? "عندما يختارك ناشر للتواصل بخصوص طلب أو كاستينغ ستظهر الدعوة هنا."
                : "When a publisher invites you to connect about a request or casting opportunity, it will appear here."}
            </p>
            <Link href={`/${locale}/opportunities`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-gold/30 px-5 text-xs text-gold">
              {isRtl ? "استعرض الفرص" : "Browse opportunities"}
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => {
              const opportunity = opportunities.get(invitation.opportunity_id);
              const publisher = publishers.get(invitation.publisher_id);
              const publisherName = publisher?.company_name || publisher?.contact_name || (isRtl ? "ناشر في ملامح" : "MLAMH publisher");
              const city = isRtl
                ? opportunity?.city_ar || opportunity?.city_en || "—"
                : opportunity?.city_en || opportunity?.city_ar || "—";
              const isPending = invitation.status === "sent";
              const accepted = invitation.status === "accepted";

              return (
                <article key={invitation.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-gold/20 bg-gold/[0.06] px-2.5 py-1 text-[10px] text-gold">
                          {opportunity?.posting_mode === "quick"
                            ? isRtl ? "⚡ طلب الآن" : "⚡ Quick Request"
                            : isRtl ? "كاستينغ" : "Casting"}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] ${accepted ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200" : isPending ? "border-amber-300/20 bg-amber-300/[0.06] text-amber-200" : "border-white/10 bg-white/[0.03] text-white/45"}`}>
                          {accepted
                            ? isRtl ? "تم قبول التواصل" : "Contact accepted"
                            : isPending
                              ? isRtl ? "بانتظار ردك" : "Awaiting response"
                              : isRtl ? "تم الاعتذار" : "Declined"}
                        </span>
                      </div>

                      <h2 className="mt-4 text-xl font-medium leading-8 text-white">
                        {opportunity?.title || (isRtl ? "فرصة من ناشر" : "Publisher opportunity")}
                      </h2>
                      <p className="mt-2 text-sm text-gold/75">{publisherName}</p>
                      <p className="mt-1 text-xs text-white/40">{city}</p>

                      {opportunity ? (
                        <Link
                          href={`/${locale}/opportunities/${encodeURIComponent(opportunity.slug || String(opportunity.id))}`}
                          className="mt-4 inline-flex text-xs text-white/55 underline decoration-white/15 underline-offset-4 transition hover:text-gold"
                        >
                          {isRtl ? "عرض تفاصيل الفرصة" : "View opportunity details"}
                        </Link>
                      ) : null}
                    </div>

                    {isPending ? (
                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[250px]">
                        <form action={async (formData) => { "use server"; await respondOpportunityInvitationAction(null, formData); }}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="invitation_id" value={invitation.id} />
                          <input type="hidden" name="response" value="accepted" />
                          <button type="submit" className="min-h-11 w-full rounded-xl bg-gold px-4 text-xs font-semibold text-black transition hover:opacity-90">
                            {isRtl ? "قبول التواصل" : "Accept contact"}
                          </button>
                        </form>
                        <form action={async (formData) => { "use server"; await respondOpportunityInvitationAction(null, formData); }}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="invitation_id" value={invitation.id} />
                          <input type="hidden" name="response" value="declined" />
                          <button type="submit" className="min-h-11 w-full rounded-xl border border-white/10 px-4 text-xs text-white/55 transition hover:border-white/20 hover:text-white">
                            {isRtl ? "اعتذار" : "Decline"}
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
