export const MLAMH_EMAIL_SIGNATURE = [
  "MLAMH | ملامح",
  "Talent & Opportunities Platform",
  "منصة المواهب والفرص",
  "",
  "E: hello@mlamh.net",
  "W: mlamh.net",
].join("\n");

function normalizeEmailBody(value: string) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function withMlamhEmailSignature(value: string) {
  const body = normalizeEmailBody(value);
  if (!body) return MLAMH_EMAIL_SIGNATURE;

  const normalized = body.toLowerCase();
  if (normalized.includes("hello@mlamh.net") && normalized.includes("mlamh.net")) {
    return body;
  }

  return `${body}\n\n${MLAMH_EMAIL_SIGNATURE}`;
}
