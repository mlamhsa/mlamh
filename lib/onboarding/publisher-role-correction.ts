const TALENT_TERMS = [
  "actor",
  "acting",
  "model",
  "talent",
  "ممثل",
  "تمثيل",
  "مودل",
  "عارض",
  "عارضة",
  "موهبة",
  "مواهب",
];

export type PublisherRoleAssessmentInput = {
  publisherType: string | null | undefined;
  companyName: string | null | undefined;
  description: string | null | undefined;
  totalOpportunities: number;
  verificationStatus: string | null | undefined;
};

export type PublisherRoleAssessment = {
  likelyTalentMismatch: boolean;
  correctionEligible: boolean;
  reasons: string[];
};

export function assessPublisherRoleMismatch(
  input: PublisherRoleAssessmentInput,
): PublisherRoleAssessment {
  const description = (input.description ?? "").trim().toLowerCase();
  const companyName = (input.companyName ?? "").trim();
  const publisherType = (input.publisherType ?? "").trim().toLowerCase();
  const verificationStatus = (input.verificationStatus ?? "unverified").trim().toLowerCase();

  const talentLanguage = TALENT_TERMS.some((term) => description.includes(term));
  const individualWithoutCompany = publisherType === "individual" && !companyName;
  const likelyTalentMismatch = individualWithoutCompany && talentLanguage;

  const reasons: string[] = [];
  if (individualWithoutCompany) reasons.push("individual_without_company");
  if (talentLanguage) reasons.push("talent_language_detected");
  if (input.totalOpportunities > 0) reasons.push("has_publisher_opportunities");
  if (verificationStatus === "verified") reasons.push("verified_publisher");

  return {
    likelyTalentMismatch,
    correctionEligible:
      likelyTalentMismatch &&
      input.totalOpportunities === 0 &&
      verificationStatus !== "verified",
    reasons,
  };
}
