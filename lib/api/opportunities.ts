import type { CountryCode } from "@/lib/markets/countries";
import {
  getPublicOpportunities,
  type PublicOpportunitiesInput,
} from "@/lib/opportunities/public-read";

export type { PublicOpportunity, PublicOpportunitiesResponse } from "@/lib/opportunities/public-contract";

export async function getOpportunities(
  input: PublicOpportunitiesInput = {
    countryCode: "SA" satisfies CountryCode,
    locale: "ar",
  },
) {
  return getPublicOpportunities(input);
}
