type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({ path }: RedirectSystemPathOptions) {
  const normalized = path.trim();

  if (/^mlamh:\/\/{0,3}$/.test(normalized)) {
    return "/";
  }

  return path;
}
