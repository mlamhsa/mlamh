import { unstable_cache } from "next/cache";

import type { CountryCode } from "@/lib/markets/countries";
import {
  getPublicOpportunities,
  type PublicOpportunitiesInput,
} from "@/lib/opportunities/public-read";

export type { PublicOpportunity, PublicOpportunitiesResponse } from "@/lib/opportunities/public-contract";

const getCachedPublicOpportunities = unstable_cache(
  async (countryCode: CountryCode, locale: "ar" | "en") => {
    return getPublicOpportunities({ countryCode, locale });
  },
  ["public-opportunities-v1"],
  {
    revalidate: 30,
    tags: ["public-opportunities"],
  },
);

export async function getOpportunities(
  input: PublicOpportunitiesInput = {
    countryCode: "SA" satisfies CountryCode,
    locale: "ar",
  },
) {
  return getCachedPublicOpportunities(input.countryCode, input.locale);
}
