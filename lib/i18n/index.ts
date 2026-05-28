import ar from "./ar";
import en from "./en";
import { defaultLocale, type Locale } from "./config";

export type Dictionary = {
  metadata: {
    title: string;
    description: string;
  };

  nav: Record<string, string>;

  hero: Record<string, string>;

  talents: Record<string, string>;

  talentProfile: Record<string, string>;

  agencies: Record<string, string>;

  stats: {
    sectionLabel: string;
    title: string;
    titleItalic: string;

    items: readonly {
      value: string;
      label: string;
    }[];

    quote: string;
    quoteSource: string;
  };

  join: Record<string, string>;

  footer: Record<string, string>;
};

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ar,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export { ar, en };
export * from "./config";