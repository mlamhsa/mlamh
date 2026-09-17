type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

function mapExternalPath(rawPath: string) {
  const normalized = rawPath.trim();
  if (!normalized || /^\/{1,4}(?:[?#].*)?$/.test(normalized)) return "/";

  let candidate = normalized;

  if (/^mlamh:/i.test(candidate)) {
    candidate = candidate.replace(/^mlamh:\/{0,2}/i, "/");
  } else if (/^exp(?:s)?:\/\//i.test(candidate)) {
    try {
      const url = new URL(candidate);
      const marker = "/--/";
      const markerIndex = url.pathname.indexOf(marker);
      candidate = markerIndex >= 0
        ? `/${url.pathname.slice(markerIndex + marker.length)}${url.search}${url.hash}`
        : "/";
    } catch {
      return "/";
    }
  } else if (/^https?:\/\//i.test(candidate)) {
    try {
      const url = new URL(candidate);
      if (!/(^|\.)mlamh\.net$/i.test(url.hostname)) return rawPath;
      candidate = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/";
    }
  }

  if (!candidate.startsWith("/")) candidate = `/${candidate}`;

  const hashIndex = candidate.indexOf("#");
  const withoutHash = hashIndex >= 0 ? candidate.slice(0, hashIndex) : candidate;
  const queryIndex = withoutHash.indexOf("?");
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";
  const localeFree = pathname.replace(/^\/(ar|en)(?=\/|$)/i, "") || "/";

  if (localeFree === "/") return "/";
  if (localeFree === "/talent") return "/talents";
  if (localeFree.startsWith("/talent/")) return localeFree;
  if (localeFree === "/talents") return "/talents";
  if (localeFree.startsWith("/opportunities")) return `${localeFree}${search}`;
  if (localeFree.startsWith("/scene")) return `${localeFree}${search}`;
  if (localeFree === "/login") return "/login";
  if (localeFree === "/join" || localeFree.startsWith("/join/")) return "/account-type";
  if (localeFree === "/publishers") return "/publishers";
  if (localeFree === "/casting") return "/casting";

  return `${localeFree}${search}`;
}

export function redirectSystemPath({ path }: RedirectSystemPathOptions) {
  const normalized = path.trim();

  if (
    normalized === "" ||
    /^\/{1,4}(?:[?#].*)?$/.test(normalized) ||
    /^mlamh:(?:\/{0,4})?(?:[?#].*)?$/i.test(normalized)
  ) {
    return "/";
  }

  return mapExternalPath(path);
}
