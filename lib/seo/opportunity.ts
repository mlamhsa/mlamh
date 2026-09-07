import { COUNTRY_REGISTRY, isCountryCode, type CountryCode } from "@/lib/markets/countries";

export type OpportunitySeoRecord = {
  id: number | string;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  opportunity_type?: string | null;
  country_code?: string | null;
  currency?: string | null;
  city_ar?: string | null;
  city_en?: string | null;
  company_name?: string | null;
  publisher_name?: string | null;
  company?: string | null;
  compensation_type?: string | null;
  budget?: string | number | null;
  created_at?: string | null;
  status?: string | null;
  application_deadline?: string | null;
  deadline?: string | null;
  expires_at?: string | null;
};

export function getOpportunityCountryCode(value: unknown): CountryCode {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : "";
  return isCountryCode(normalized) ? normalized : "SA";
}

export function getOpportunityCurrency(record: OpportunitySeoRecord) {
  const explicit = typeof record.currency === "string" ? record.currency.trim().toUpperCase() : "";
  if (/^[A-Z]{3}$/.test(explicit)) return explicit;
  return COUNTRY_REGISTRY[getOpportunityCountryCode(record.country_code)].defaultCurrency;
}

export function getOpportunityDeadline(record: OpportunitySeoRecord) {
  return record.application_deadline?.trim()
    || record.deadline?.trim()
    || record.expires_at?.trim()
    || null;
}

function deadlineTimestamp(value: string | null) {
  if (!value) return null;
  const compact = value.slice(0, 10);
  const timestamp = Date.parse(`${compact}T23:59:59`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isOpportunityOpenForSeo(record: OpportunitySeoRecord, now = new Date()) {
  if (!["published", "open"].includes(record.status ?? "")) return false;
  const deadline = deadlineTimestamp(getOpportunityDeadline(record));
  return deadline === null || deadline >= now.getTime();
}

export function shouldRenderJobPosting(record: OpportunitySeoRecord, now = new Date()) {
  return record.compensation_type !== "unpaid" && isOpportunityOpenForSeo(record, now);
}

export function buildOpportunityJobPosting({
  record,
  canonicalUrl,
  locale,
}: {
  record: OpportunitySeoRecord;
  canonicalUrl: string;
  locale: "ar" | "en";
}) {
  const isArabic = locale === "ar";
  const countryCode = getOpportunityCountryCode(record.country_code);
  const city = isArabic
    ? record.city_ar?.trim() || record.city_en?.trim() || null
    : record.city_en?.trim() || record.city_ar?.trim() || null;
  const companyName = record.company_name?.trim()
    || record.publisher_name?.trim()
    || record.company?.trim()
    || null;
  const deadline = getOpportunityDeadline(record);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${canonicalUrl}#jobposting`,
    url: canonicalUrl,
    title: record.title?.trim() || (isArabic ? "فرصة عبر ملامح" : "MLAMH Opportunity"),
    description: record.description?.trim() || undefined,
    datePosted: record.created_at || undefined,
    validThrough: deadline ? `${deadline.slice(0, 10)}T23:59:59` : undefined,
    employmentType: "CONTRACTOR",
    hiringOrganization: companyName
      ? { "@type": "Organization", name: companyName }
      : undefined,
    jobLocation: city
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: city,
            addressCountry: countryCode,
          },
        }
      : undefined,
  };
}
