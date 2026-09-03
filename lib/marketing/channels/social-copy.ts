export function sanitizeSocialCopy(value: unknown) {
  if (typeof value !== "string") return undefined;

  const cleaned = value
    // AI / JSON payloads can reach the channel job single- or double-escaped.
    // Normalize both forms before any external social adapter sees the copy.
    .replace(/\\+(?:r\\+n|n|r)/g, "\n")
    .replace(/\\+([.!?,،؛:])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || undefined;
}
