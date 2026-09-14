import { SAUDI_CITIES } from "@/lib/data/saudi-cities";
import { TALENT_SIGNUP_COUNTRIES, type TalentSignupCountry } from "@/lib/data/talent-signup";

export const ACTIVE_TALENT_COUNTRY_CODES = ["SA"] as const;

const saudiBase = TALENT_SIGNUP_COUNTRIES.find((country) => country.code === "SA");

const SAUDI_ACTIVE_COUNTRY: TalentSignupCountry = {
  code: "SA",
  dialCode: saudiBase?.dialCode ?? "+966",
  ar: saudiBase?.ar ?? "السعودية",
  en: saudiBase?.en ?? "Saudi Arabia",
  phoneExample: saudiBase?.phoneExample ?? "5XXXXXXXX",
  cities: SAUDI_CITIES.map((city) => ({
    value: city.slug,
    ar: city.ar,
    en: city.en,
  })),
};

export const ACTIVE_TALENT_SIGNUP_COUNTRIES: TalentSignupCountry[] = [SAUDI_ACTIVE_COUNTRY];

export function isActiveTalentCountryCode(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return ACTIVE_TALENT_COUNTRY_CODES.includes(code as (typeof ACTIVE_TALENT_COUNTRY_CODES)[number]);
}

export function getActiveTalentCountry(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return ACTIVE_TALENT_SIGNUP_COUNTRIES.find((country) => country.code === code) ?? null;
}
