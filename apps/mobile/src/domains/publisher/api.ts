import { mobileApiRequest } from "@/src/api/client";
import type {
  MobileProfileOptionsResponse,
  PublisherOpportunityCreatePayload,
  PublisherOpportunityCreateResponse,
} from "@/src/domains/publisher/types";

export function getPublisherProfileOptions() {
  return mobileApiRequest<MobileProfileOptionsResponse>("/api/mobile/profile-options", {
    authenticated: false,
  });
}

export function createPublisherOpportunity(payload: PublisherOpportunityCreatePayload) {
  return mobileApiRequest<PublisherOpportunityCreateResponse>("/api/mobile/opportunities", {
    method: "POST",
    body: payload,
  });
}
