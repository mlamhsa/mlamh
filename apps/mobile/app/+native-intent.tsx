type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path }: RedirectSystemPathOptions) {
  const normalized = path.trim();

  if (
    normalized === "" ||
    /^\/{1,4}$/.test(normalized) ||
    /^mlamh:\/{1,4}$/.test(normalized)
  ) {
    return "/";
  }

  return path;
}
