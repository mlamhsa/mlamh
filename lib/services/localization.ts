import { findSaudiCity } from "@/lib/data/saudi-cities";

export function cleanText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }
  
  export function numberOrNull(value: unknown) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }
  
    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).trim());
  
    return Number.isFinite(parsed)
      ? parsed
      : null;
  }
  
  export function createSlug(value: string) {
    return `${value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")}-${Date.now()}`;
  }
  
  export function localizeOpportunityCity(value: string) {
    const clean = cleanText(value);
    const match = findSaudiCity(clean);

    return {
      city_slug: match?.slug ?? "",
      city_ar: match?.ar ?? "",
      city_en: match?.en ?? "",
    };
  }
  
  export function localizeOpportunityType(value: string) {
    const types = [
      { value: "model", ar: "مودل", en: "Model" },
      { value: "actor", ar: "ممثل / ممثلة", en: "Actor" },
      { value: "photographer", ar: "مصور / مصورة", en: "Photographer" },
      { value: "makeup_artist", ar: "خبير / خبيرة تجميل", en: "Makeup Artist" },
      { value: "content_creator", ar: "صانع / صانعة محتوى", en: "Content Creator" },
      { value: "voice_over", ar: "تعليق صوتي", en: "Voice Over" },
      { value: "other", ar: "أخرى", en: "Other" },
    ];
  
    const clean = cleanText(value);
  
    const match = types.find(
      (type) =>
        type.value === clean ||
        type.ar === clean ||
        type.en === clean
    );
  
    return {
      value: match?.value ?? clean,
      ar: match?.ar ?? clean,
      en: match?.en ?? clean,
    };
  }