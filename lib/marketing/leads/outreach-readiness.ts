export type OutreachReadinessContact = {
  contact_name?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  metadata?: unknown;
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getContactRole(metadata: unknown) {
  const value = record(metadata);
  return text(value.professional_role) ?? text(value.job_title) ?? text(value.role) ?? text(value.title);
}

export function getOutreachReadiness(contact: OutreachReadinessContact | null | undefined) {
  const name = text(contact?.contact_name);
  const role = getContactRole(contact?.metadata);
  const email = text(contact?.email);
  const linkedinUrl = text(contact?.linkedin_url);
  const hasChannel = Boolean(email || linkedinUrl);
  const missingFields = [
    !name ? "contact_name" : null,
    !role ? "contact_role" : null,
    !hasChannel ? "contact_channel" : null,
  ].filter((value): value is string => Boolean(value));

  return {
    name,
    role,
    email,
    linkedinUrl,
    hasChannel,
    isReady: Boolean(name && role && hasChannel),
    missingFields,
  };
}
