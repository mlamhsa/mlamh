type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path }: RedirectSystemPathOptions) {
  const normalized = path.trim();

  // Expo Router may pass a full custom-scheme URL on a cold iOS launch.
  // A bare app URL (mlamh:, mlamh:/, mlamh://, mlamh:///), optionally with
  // query/hash, is the application root and must resolve to "/".
  if (
    normalized === "" ||
    /^\/{1,4}(?:[?#].*)?$/.test(normalized) ||
    /^mlamh:(?:\/{0,4})?(?:[?#].*)?$/i.test(normalized)
  ) {
    return "/";
  }

  // When Expo hands us a full mlamh:// URL, normalize it to an app-relative
  // path instead of letting the scheme itself become a route segment.
  if (/^mlamh:/i.test(normalized)) {
    try {
      const withoutScheme = normalized.replace(/^mlamh:\/{0,2}/i, "/");
      return withoutScheme.startsWith("/") ? withoutScheme : `/${withoutScheme}`;
    } catch {
      return "/";
    }
  }

  return path;
}
