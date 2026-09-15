import { mobileApiRequest } from "@/src/api/client";

export type PublisherOpportunityStatus =
  | "draft"
  | "pending_review"
  | "needs_changes"
  | "rejected"
  | "published"
  | "open"
  | "closed"
  | "archived"
  | string;

export type PublisherOpportunityItem = {
  id: number;
  title: string;
  slug: string | null;
  postingMode: "quick" | "casting";
  cityAr: string | null;
  cityEn: string | null;
  talentType: string | null;
  status: PublisherOpportunityStatus;
  published: boolean;
  applicantCount: number;
  createdAt: string | null;
  applicationDeadline: string | null;
};

export type PublisherOpportunitiesResponse = {
  ok: true;
  counts: {
    total: number;
    pendingReview: number;
    needsChanges: number;
    published: number;
    rejected: number;
    closed: number;
    archived: number;
    applicants: number;
  };
  items: PublisherOpportunityItem[];
};

export function getPublisherOpportunities() {
  return mobileApiRequest<PublisherOpportunitiesResponse>("/api/mobile/publisher/opportunities");
}
