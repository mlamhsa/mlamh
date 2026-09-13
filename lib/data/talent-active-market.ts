import { TALENT_SIGNUP_COUNTRIES } from "@/lib/data/talent-signup";

export const ACTIVE_TALENT_COUNTRY_CODES = ["SA"] as const;

export const ACTIVE_TALENT_SIGNUP_COUNTRIES = TALENT_SIGNUP_COUNTRIES.filter((country) =>
  ACTIVE_TALENT_COUNTRY_CODES.includes(country.code as (typeof ACTIVE_TALENT_COUNTRY_CODES)[number]),
);

export function isActiveTalentCountryCode(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return ACTIVE_TALENT_COUNTRY_CODES.includes(code as (typeof ACTIVE_TALENT_COUNTRY_CODES)[number]);
}

export function getActiveTalentCountry(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return ACTIVE_TALENT_SIGNUP_COUNTRIES.find((country) => country.code === code) ?? null;
}
