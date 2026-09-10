export const ACTIVE_TALENT_RESIDENCE_COUNTRY_CODES = ["SA"] as const;

export function isActiveTalentResidenceCountry(code: string | null | undefined) {
  return ACTIVE_TALENT_RESIDENCE_COUNTRY_CODES.includes(String(code ?? "").trim().toUpperCase() as "SA");
}
