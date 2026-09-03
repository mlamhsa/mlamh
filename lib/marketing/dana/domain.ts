import { createHash } from "crypto";

import type { CountryCode } from "../../markets/countries.ts";
import {
  calculateTalentSupplyGap,
  type BriefTalent,
  type TalentBrief,
  type TalentSupplyEvaluation,
  type TalentSupplyGap,
} from "../../talent/supply.ts";
import {
  normalizeInternationalPhone,
  parseDanaLocation,
} from "./location.ts";

export const DANA_AGENT = {
  id: "dana",
  name: "Dana",
  role: "AI Partnerships & Client Success Manager",
  externalIdentity: "MLAMH Team | Partnerships & Casting",
  assignedChannels: ["support", "email", "instagram", "whatsapp", "website", "linkedin"],
} as const;

export type CommercialSourceChannel =
  | "support"
  | "email"
  | "instagram"
  | "whatsapp"
  | "website"
  | "linkedin";

export type CommercialInquiry = {
  sourceChannel: CommercialSourceChannel;
  sourceReference: string;
  occurredAt: string;
  senderName: string;
  senderEmail?: string | null;
  senderPhone?: string | null;
  organizationName?: string | null;
  subject?: string | null;
  message: string;
  category?: string | null;
};

export type CommercialClassification = {
  commercial: boolean;
  intent:
    | "casting_request"
    | "partnership"
    | "investment"
    | "opportunity"
    | "normal_support";
  confidence: number;
  signals: string[];
};

export type DanaBrief = {
  projectType: string | null;
  talentType: "actor" | "model" | "mixed" | null;
  talentCount: number | null;
  countryCode: CountryCode | null;
  city: string | null;
  requirements: Record<string, unknown>;
  compensation: string | null;
  status: "partial" | "complete";
};

export type ShortlistResult =
  | {
      status: "matched";
      matches: Array<{ talentId: number; talentName: string; score: number; reasons: string[] }>;
      supplyGap: TalentSupplyGap;
    }
  | {
      status: "insufficient_matches";
      matches: Array<{ talentId: number; talentName: string; score: number; reasons: string[] }>;
      supplyGap: TalentSupplyGap;
    };

const COMMERCIAL_TERMS = [
  "ممثل",
  "ممثلة",
  "مودل",
  "عارضة",
  "عارض",
  "كاست",
  "تصوير",
  "ريلز",
  "reels",
  "actor",
  "actress",
  "model",
  "casting",
  "talent",
  "موهبة",
  "ترشيح",
  "فرصة",
  "مشروع",
  "campaign",
  "shoot",
];

const PARTNERSHIP_TERMS = ["شراكة", "تعاون", "partnership", "collaboration", "sponsorship", "رعاية"];
const INVESTMENT_TERMS = ["استثمار", "مستثمر", "investment", "investor"];

function normalizeText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{L}\p{N}@+]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeEmail(value?: string | null) {
  const email = (value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  return email.includes("@") ? email : "";
}

export function normalizePhone(value?: string | null) {
  return normalizeInternationalPhone(value);
}

export function classifyCommercialInquiry(input: CommercialInquiry): CommercialClassification {
  const text = normalizeText(`${input.category ?? ""} ${input.subject ?? ""} ${input.message}`);
  const signals = COMMERCIAL_TERMS.filter((term) => text.includes(normalizeText(term)));
  const partnership = input.category === "partnership" || PARTNERSHIP_TERMS.some((term) => text.includes(normalizeText(term)));
  const investment = input.category === "investment" || INVESTMENT_TERMS.some((term) => text.includes(normalizeText(term)));

  if (investment) return { commercial: true, intent: "investment", confidence: 0.98, signals: ["investment", ...signals] };
  if (partnership) return { commercial: true, intent: "partnership", confidence: 0.96, signals: ["partnership", ...signals] };
  if (signals.length >= 2) return { commercial: true, intent: "casting_request", confidence: Math.min(0.95, 0.72 + signals.length * 0.05), signals };
  if (signals.length === 1 && /(احتاج|نحتاج|ابحث|نبحث|مطلوب|looking|need|hire|ترشيح)/i.test(text)) {
    return { commercial: true, intent: "opportunity", confidence: 0.78, signals };
  }
  return { commercial: false, intent: "normal_support", confidence: 0.9, signals: [] };
}

function extractTalentType(text: string): DanaBrief["talentType"] {
  const normalized = normalizeText(text);
  const model = ["مودل", "عارضة", "عارض", "model"].some((term) => normalized.includes(normalizeText(term)));
  const actor = ["ممثل", "ممثلة", "actor", "actress"].some((term) => normalized.includes(normalizeText(term)));
  if (model && actor) return "mixed";
  if (model) return "model";
  if (actor) return "actor";
  return null;
}

export function buildDanaBrief(input: CommercialInquiry): DanaBrief {
  const text = `${input.subject ?? ""} ${input.message}`;
  const talentType = extractTalentType(text);
  const location = parseDanaLocation(text);
  const recurring = /(شهري|شهريا|monthly|recurring|متكرر)/i.test(text);
  const socialContent = /(ريلز|reels|social|سوشيال|فيديو|video)/i.test(text);
  const female = /(انثى|أنثى|نسائي|female|woman|women|عارضة|ممثلة)/i.test(text);
  const countMatch = normalizeText(text).match(/(?:عدد|need|مطلوب)\s*(\d{1,2})/i);
  const talentCount = countMatch ? Math.max(1, Number(countMatch[1])) : 1;
  const compensationMatch = text.match(/(?:المقابل|الأجر|compensation|budget)\s*[:\-]?\s*([^\n,.]{2,80})/i);
  const compensation = compensationMatch?.[1]?.trim() || null;
  const requirements = {
    recurring,
    social_content: socialContent,
    ...(female ? { gender: "female" } : {}),
    source_channel: input.sourceChannel,
    source_reference: input.sourceReference,
  };
  return {
    projectType: socialContent ? "social_content" : "casting",
    talentType,
    talentCount,
    countryCode: location.countryCode,
    city: location.city,
    requirements,
    compensation,
    status: talentType && location.city ? "complete" : "partial",
  };
}

function contextSignature(input: CommercialInquiry, classification: CommercialClassification) {
  const brief = buildDanaBrief(input);
  const context = [
    classification.intent,
    brief.talentType ?? "unknown-role",
    brief.countryCode ?? "unknown-country",
    brief.city ?? "unknown-city",
    brief.requirements.recurring ? "recurring" : "one-off",
    brief.requirements.social_content ? "social-content" : "general-project",
    brief.requirements.gender ?? "any-gender",
  ].join("|");
  return context;
}

export function buildCommercialDemandKey(input: CommercialInquiry, classification = classifyCommercialInquiry(input)) {
  const email = normalizeEmail(input.senderEmail);
  const phone = normalizePhone(input.senderPhone);
  const identity = email ? `email:${email}` : phone ? `phone:${phone}` : `source:${input.sourceChannel}:${input.sourceReference}`;
  const occurredAt = new Date(input.occurredAt);
  const window = Number.isFinite(occurredAt.getTime())
    ? `${occurredAt.getUTCFullYear()}-w${Math.floor((occurredAt.getTime() - Date.UTC(occurredAt.getUTCFullYear(), 0, 1)) / 604800000)}`
    : "unknown-window";
  return createHash("sha256").update(`${identity}|${contextSignature(input, classification)}|${window}`).digest("hex");
}

export function toTalentSupplyBrief(brief: DanaBrief): TalentBrief {
  return {
    talent_count: brief.talentCount,
    talent_type: brief.talentType,
    country_code: brief.countryCode,
    city: brief.city,
    requirements: brief.requirements,
  };
}

function getTalentName(talent: BriefTalent) {
  return [
    talent.display_name_en,
    talent.display_name_ar,
    talent.name_en,
    talent.name_ar,
  ].find((value) => typeof value === "string" && value.trim())?.trim() ?? null;
}

export function buildQualifiedTalentShortlist(
  brief: DanaBrief,
  supply: TalentSupplyEvaluation,
): ShortlistResult {
  const supplyBrief = toTalentSupplyBrief(brief);
  const supplyGap = calculateTalentSupplyGap(supplyBrief, supply);
  const matches = supply.evaluations
    .filter(({ sendable }) => sendable)
    .map(({ talent: candidate, briefEvaluation }) => {
      const talentId = Number(candidate.id);
      const talentName = getTalentName(candidate);
      if (!Number.isFinite(talentId) || !talentName || !briefEvaluation) return null;

      let score = 50;
      const reasons = ["qualified", "sendable_for_brief"];
      if (brief.talentType) reasons.push(`role:${brief.talentType}`);
      if (brief.countryCode) reasons.push(`market:${brief.countryCode}`);
      if (brief.city) {
        score += 30;
        reasons.push(`city:${brief.city}`);
      }
      if (
        candidate.availability_status &&
        !["unavailable", "not_available", "busy"].includes(
          candidate.availability_status,
        )
      ) {
        score += 10;
        reasons.push("available");
      }
      if (
        brief.requirements.social_content &&
        candidate.modeling_types?.some((type) =>
          /commercial|fashion|abaya|social/i.test(type),
        )
      ) {
        score += 10;
        reasons.push("relevant_modeling_type");
      }
      return {
        talentId,
        talentName,
        score,
        reasons: [...reasons, ...briefEvaluation.reasons],
      };
    })
    .filter((match): match is NonNullable<typeof match> => match !== null)
    .sort((a, b) => b.score - a.score || a.talentId - b.talentId)
    .slice(0, supplyGap.needed);

  return {
    status: supplyGap.missing > 0 ? "insufficient_matches" : "matched",
    matches,
    supplyGap,
  };
}

export function approvalLevelForExternalDraft(content: string): "approval_required" | "ceo_only" {
  const normalized = normalizeText(content);
  const ceoOnlyTerms = [
    "سعر", "تسعير", "خصم", "ميزانية", "اتفاقية", "عقد", "التزام", "شراكة", "رعاية",
    "price", "pricing", "discount", "budget", "contract", "agreement", "commitment", "partnership", "sponsorship",
  ];
  return ceoOnlyTerms.some((term) => normalized.includes(normalizeText(term))) ? "ceo_only" : "approval_required";
}

export function buildExternalDraft(input: CommercialInquiry, brief: DanaBrief, shortlist: ShortlistResult) {
  const matchLine = shortlist.status === "matched"
    ? `We have prepared a reviewable shortlist of ${shortlist.matches.length} eligible MLAMH talent profile(s).`
    : "We are still reviewing eligible MLAMH talent profiles and will not propose unsuitable candidates.";
  return {
    senderIdentity: DANA_AGENT.externalIdentity,
    channel: input.sourceChannel,
    sourceReference: input.sourceReference,
    content: `Thank you for sharing your casting requirement. ${matchLine} We will confirm the final brief and next step with you after internal review.`,
    briefStatus: brief.status,
    shortlistStatus: shortlist.status,
  };
}
