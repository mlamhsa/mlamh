export type MobileHomeHero = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type MobileHomeValueProp = {
  id: number;
  iconKey:
    | "shield"
    | "globe"
    | "zap"
    | "building"
    | "clipboard"
    | "badge"
    | "sparkles";
  title: string;
  description: string;
};

export type MobileHomeResponse =
  | {
      ok: true;
      hero: MobileHomeHero;
      valueProps: MobileHomeValueProp[];
    }
  | {
      ok: false;
      code: string;
    };
