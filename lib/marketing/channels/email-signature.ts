export const MLAMH_EMAIL_SIGNATURE = [
  "MLAMH | ملامح",
  "Talent & Opportunities Platform",
  "منصة المواهب والفرص",
  "",
  "E: hello@mlamh.net",
  "W: mlamh.net",
].join("\n");

export function withMlamhEmailSignature(value: string) {
  const body = value.trim();
  if (!body) return MLAMH_EMAIL_SIGNATURE;

  const normalized = body.toLowerCase();
  if (normalized.includes("hello@mlamh.net") && normalized.includes("mlamh.net")) {
    return body;
  }

  return `${body}\n\n${MLAMH_EMAIL_SIGNATURE}`;
}
