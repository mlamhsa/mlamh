import { ExternalLink, Mail, Waypoints } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

export async function InvestorContactRoutesPanel({ isArabic }: { isArabic: boolean }) {
  const db = createAdminClient();
  const { data } = await db.from("investor_leads")
    .select("id,organization_name,organization_type,country_code,website_url,contact_email,contact_route_url,contact_route_type,status,fit_score")
    .eq("status", "qualified")
    .order("fit_score", { ascending: false, nullsFirst: false })
    .limit(30);

  const leads = data ?? [];
  if (!leads.length) return null;

  return (
    <section className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold/70">OFFICIAL CONTACT ROUTES</p>
          <h2 className="mt-1 text-xl font-light text-white">{isArabic ? "المواقع وقنوات التواصل الرسمية" : "Official websites & contact routes"}</h2>
          <p className="mt-2 max-w-3xl text-xs leading-6 text-white/35">
            {isArabic
              ? "يعرض فقط القنوات العامة المدعومة بمصادر ويب فعلية. لا يتم تخمين أي بريد أو بيانات خاصة."
              : "Only public routes backed by real web evidence are shown. Email patterns and private contact details are never inferred."}
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] text-white/40">{leads.length}</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {leads.map((lead) => {
          const officialRoute = lead.contact_route_url && !String(lead.contact_route_url).startsWith("mailto:") ? lead.contact_route_url : null;
          return (
            <article key={lead.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-white/80">{lead.organization_name}</h3>
                  <p className="mt-1 text-[11px] text-white/30">{lead.organization_type}{lead.country_code ? ` · ${lead.country_code}` : ""}</p>
                </div>
                {typeof lead.fit_score === "number" ? <span className="text-[10px] font-medium text-gold">{lead.fit_score}%</span> : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {lead.website_url ? (
                  <a href={lead.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/[0.09] px-3 py-2 text-xs text-white/60 transition hover:border-gold/20 hover:text-gold">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {isArabic ? "الموقع الرسمي" : "Official website"}
                  </a>
                ) : null}
                {lead.contact_email ? (
                  <a href={`mailto:${lead.contact_email}`} className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-2 text-xs text-emerald-200">
                    <Mail className="h-3.5 w-3.5" />
                    <span dir="ltr">{lead.contact_email}</span>
                  </a>
                ) : null}
                {officialRoute ? (
                  <a href={officialRoute} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-300/[0.035] px-3 py-2 text-xs text-sky-200">
                    <Waypoints className="h-3.5 w-3.5" />
                    {lead.contact_route_type === "application_form"
                      ? (isArabic ? "نموذج التقديم" : "Pitch / apply form")
                      : lead.contact_route_type === "contact_form"
                        ? (isArabic ? "نموذج التواصل" : "Contact form")
                        : lead.contact_route_type === "linkedin"
                          ? "LinkedIn"
                          : (isArabic ? "قناة التواصل" : "Contact route")}
                  </a>
                ) : null}
              </div>

              <p className="mt-3 text-[11px] leading-5 text-white/30">
                {lead.contact_email
                  ? (isArabic ? "بريد عام موثق وجاهز لمسودة Gmail بعد مراجعتك." : "Verified public email; ready for approval-gated Gmail drafting.")
                  : officialRoute
                    ? (isArabic ? "لا يوجد بريد عام موثق حتى الآن؛ توجد قناة رسمية بديلة." : "No verified public email yet; an official alternate route is available.")
                    : (isArabic ? "الموقع موثق، وما زال الوكيل يبحث عن بريد أو مسار تقديم رسمي." : "Website verified; the agent is still looking for a public email or official pitch route.")}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
