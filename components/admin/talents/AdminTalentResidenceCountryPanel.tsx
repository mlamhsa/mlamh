import { Globe2 } from "lucide-react";

import { TalentService } from "@/lib/services/talents/TalentService";

type Props = {
  talentId: number;
  language?: "ar" | "en";
};

const COUNTRY_LABELS: Record<string, { ar: string; en: string }> = {
  SA: { ar: "السعودية", en: "Saudi Arabia" },
  AE: { ar: "الإمارات العربية المتحدة", en: "United Arab Emirates" },
  QA: { ar: "قطر", en: "Qatar" },
};

export async function AdminTalentResidenceCountryPanel({
  talentId,
  language = "ar",
}: Props) {
  const talent = await TalentService.getAdminTalentById(talentId);
  if (!talent) return null;

  const code = String(talent.base_country_code ?? "").trim().toUpperCase();
  const value = COUNTRY_LABELS[code]?.[language] ?? code || (language === "ar" ? "غير محدد" : "Not set");
  const isMissing = !code;

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className="px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className={`rounded-2xl border p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 ${
          isMissing
            ? "border-amber-400/20 bg-amber-400/[0.05]"
            : "border-white/[0.08] bg-white/[0.02]"
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-gold">
              <Globe2 size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                {language === "ar" ? "بيانات الموقع" : "Location data"}
              </p>
              <p className="mt-1 text-sm text-white/65">
                {language === "ar" ? "بلد الإقامة" : "Country of residence"}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-0 sm:text-end">
            <p className={`text-sm font-semibold ${isMissing ? "text-amber-200" : "text-white"}`}>{value}</p>
            {code ? <p className="mt-1 text-xs text-white/35">{code}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
