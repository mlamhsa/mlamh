export type MobileAccountKind = "talent" | "publisher";

const SHARED_EXACT = new Set(["/casting", "/notifications", "/support"]);
const TALENT_EXACT = new Set(["/opportunities", "/applications", "/messages", "/profile", "/talents"]);
const PUBLISHER_EXACT = new Set(["/publisher", "/publisher/profile", "/publisher/verification", "/publisher/messages", "/talents"]);

function normalizePath(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 1024 || !trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) return null;
  if (trimmed.includes("://") || trimmed.includes("\0")) return null;
  const path = trimmed.split("?")[0]?.split("#")[0] ?? "";
  return path || null;
}

function matchesDynamic(path: string, prefix: string, numericOnly = false) {
  if (!path.startsWith(`${prefix}/`)) return false;
  const tail = path.slice(prefix.length + 1);
  if (!tail || tail.includes("/")) return false;
  return numericOnly ? /^\d+$/.test(tail) : /^[A-Za-z0-9._~-]+$/.test(tail);
}

export function getSafePostLoginPath(value: unknown, accountType: MobileAccountKind): string | null {
  const path = normalizePath(value);
  if (!path) return null;
  if (SHARED_EXACT.has(path)) return path;

  if (accountType === "publisher") {
    if (PUBLISHER_EXACT.has(path)) return path;
    if (path === "/publisher/setup") return path;
    if (matchesDynamic(path, "/publisher/opportunities", true)) return path;
    if (matchesDynamic(path, "/talents")) return path;
    if (matchesDynamic(path, "/conversations", true)) return path;
    return null;
  }

  if (TALENT_EXACT.has(path)) return path;
  if (matchesDynamic(path, "/opportunities")) return path;
  if (matchesDynamic(path, "/applications", true)) return path;
  if (matchesDynamic(path, "/conversations", true)) return path;
  if (matchesDynamic(path, "/talents")) return path;
  return null;
}
