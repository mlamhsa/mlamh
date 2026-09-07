export type ContactAutoVerificationCandidate = {
  contact_name?: string | null;
  professional_role?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  source_urls?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validEmail(value: unknown) {
  const email = text(value);
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function validPublicLinkedInProfile(value: unknown) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const isLinkedInHost = host === "linkedin.com" || host.endsWith(".linkedin.com");
    const isPersonalProfile = /^\/in\/[^/]+\/?$/i.test(url.pathname);
    return url.protocol === "https:" && isLinkedInHost && isPersonalProfile ? url.toString() : null;
  } catch {
    return null;
  }
}

function sourceUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const raw = text(item);
    if (!raw) return [];
    try {
      const url = new URL(raw);
      return url.protocol === "https:" ? [url.toString()] : [];
    } catch {
      return [];
    }
  });
}

function isGenericName(value: string | null) {
  if (!value) return true;
  return /\bteam\b|\binfo\b|\bcontact\b|\bsupport\b|\bhello\b|فريق|الدعم|التواصل/i.test(value);
}

export function evaluateContactAutoVerification(candidate: ContactAutoVerificationCandidate | null | undefined) {
  const name = text(candidate?.contact_name);
  const role = text(candidate?.professional_role);
  const email = validEmail(candidate?.email);
  const linkedinUrl = validPublicLinkedInProfile(candidate?.linkedin_url);
  const evidence = sourceUrls(candidate?.source_urls);
  const hasChannel = Boolean(email || linkedinUrl);
  const missingFields = [
    !name || isGenericName(name) ? "named_contact" : null,
    !role ? "professional_role" : null,
    !hasChannel ? "verified_channel" : null,
    evidence.length === 0 ? "source_evidence" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    name,
    role,
    email,
    linkedinUrl,
    sourceUrls: evidence,
    isAutoVerifiable: missingFields.length === 0,
    missingFields,
    approvalSource: missingFields.length === 0 ? "ceo_approved_auto_verification_policy" : null,
  };
}
