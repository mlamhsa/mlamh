import { translateOpportunityContent } from "@/lib/ai/translate-opportunity";
import {
  OpportunityRepository,
  type CreateOpportunityData,
  type OpportunityStatus,
} from "@/lib/repositories/opportunities/OpportunityRepository";

function detectOpportunityLanguage(title: string, description: string): "ar" | "en" {
  return /[\u0600-\u06FF]/.test(`${title} ${description}`) ? "ar" : "en";
}

export class OpportunityService {
  static getAll(filters?: {
    status?: string;
    search?: string;
  }) {
    return OpportunityRepository.getAll(filters ?? {});
  }

  static getStatusSnapshot(id: number) {
    return OpportunityRepository.getStatusSnapshot(id);
  }

  static updateStatus({
    id,
    status,
    published,
  }: {
    id: number;
    status: OpportunityStatus;
    published: boolean;
  }) {
    return OpportunityRepository.updateStatus({
      id,
      status,
      published,
    });
  }

  static async create(data: CreateOpportunityData) {
    const sourceLanguage = detectOpportunityLanguage(data.title, data.description);
    const translated = await translateOpportunityContent({
      sourceLanguage,
      title: data.title,
      description: data.description,
    });

    const localizedData = sourceLanguage === "ar"
      ? {
          ...data,
          title_en: translated.title,
          description_en: translated.description,
        }
      : {
          ...data,
          title: translated.title,
          description: translated.description,
          title_en: data.title,
          description_en: data.description,
        };

    return OpportunityRepository.create(localizedData);
  }
}