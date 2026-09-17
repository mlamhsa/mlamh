import { InvestorContactRoutesPanel } from "./InvestorContactRoutesPanel";
import { InvestorLinkedInOutreach } from "./InvestorLinkedInOutreach";

type Lead = {
  id: number;
  organization_name: string;
  contact_name: string | null;
  contact_role: string | null;
  status: string;
};

type Props = {
  leads: Lead[];
  isArabic: boolean;
};

export function InvestorLinkedInPanel({ leads, isArabic }: Props) {
  const contacts = leads.filter((lead) => lead.contact_name && lead.status !== "archived");

  return (
    <>
      <InvestorContactRoutesPanel isArabic={isArabic} />

      {contacts.length ? (
        <section className="mb-8" dir={isArabic ? "rtl" : "ltr"}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-sky-300/65">LINKEDIN OUTREACH</p>
              <h2 className="mt-1 text-xl font-light text-white">
                {isArabic ? "التواصل مع أصحاب القرار عبر LinkedIn" : "LinkedIn outreach to decision-makers"}
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/35">
                {isArabic
                  ? "جهّز رسالة مخصصة، راجعها وعدّلها، ثم انسخها وافتح حساب الشخص على LinkedIn للإرسال يدويًا. لا يوجد إرسال تلقائي."
                  : "Prepare a personalized message, review or edit it, then copy it and open the person's LinkedIn profile to send manually. No auto-send."}
              </p>
            </div>
            <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.04] px-3 py-1 text-[11px] text-sky-200/70">
              {contacts.length}
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {contacts.map((lead) => (
              <article key={lead.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5">
                <div>
                  <h3 className="text-sm font-medium text-white/80">{lead.organization_name}</h3>
                  <p className="mt-1 text-sm text-white/65">{lead.contact_name}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">{lead.contact_role || ""}</p>
                </div>
                <InvestorLinkedInOutreach investorId={lead.id} contactName={lead.contact_name} isArabic={isArabic} />
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
