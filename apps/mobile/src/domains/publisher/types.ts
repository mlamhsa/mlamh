export type PublisherOpportunityMode = "quick" | "casting";
export type PublisherTalentType = "actor" | "model";
export type PublisherRequiredGender = "any" | "male" | "female";
export type PublisherCompensationType = "fixed" | "negotiable" | "unpaid";

export type PublisherOpportunityCreatePayload = {
  locale: "ar" | "en";
  postingMode: PublisherOpportunityMode;
  title: string;
  description: string;
  city: string;
  requiredGender: PublisherRequiredGender;
  minAge?: number | null;
  maxAge?: number | null;
  compensationType: PublisherCompensationType;
  budget?: string | null;
  talentType: PublisherTalentType;
  applicationDays: number;
  requiredCount?: number | null;
  workDate?: string | null;
  workTime?: string | null;
  workDuration?: string | null;
};

export type PublisherOpportunityCreateResponse = {
  ok: true;
  opportunityId: number;
  status: "pending_review";
  postingMode: PublisherOpportunityMode;
  message: string;
};

export type MobileProfileOption = { value: string; ar: string; en: string };
export type MobileProfileOptionsResponse = {
  cities: MobileProfileOption[];
  nationalities: MobileProfileOption[];
};
