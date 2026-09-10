export function createStableTalentSlug(name: string, userId: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[\`'’]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const stableSuffix = userId.replace(/-/g, "").slice(0, 8).toLowerCase();
  return `${base || "talent"}-${stableSuffix || "profile"}`;
}
