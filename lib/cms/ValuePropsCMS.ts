import { ValuePropsService } from "@/lib/services/ValuePropsService";

import type {
  HomepageValuePropsLocale,
  PublicHomepageValueProp,
} from "@/lib/types/value-props";

export class ValuePropsCMS {
  static async getPublicValueProps(
    locale: HomepageValuePropsLocale,
  ): Promise<PublicHomepageValueProp[]> {
    const { data, error } =
      await ValuePropsService.getAll();

    if (error || !data) {
      return [];
    }

    return data
      .filter((item) => item.is_active)
      .map((item) => ({
        id: item.id,
        iconKey: item.icon_key,
        title:
          locale === "ar"
            ? item.title_ar
            : item.title_en,
        description:
          locale === "ar"
            ? item.description_ar
            : item.description_en,
      }));
  }
}