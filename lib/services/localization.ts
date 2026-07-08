export function cleanText(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
  }
  
  export function numberOrNull(value: unknown) {
    const raw = cleanText(value);
    if (!raw) return null;
  
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
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
    const cities = [
      { value: "riyadh", ar: "الرياض", en: "Riyadh" },
      { value: "jeddah", ar: "جدة", en: "Jeddah" },
      { value: "makkah", ar: "مكة", en: "Makkah" },
      { value: "madinah", ar: "المدينة المنورة", en: "Madinah" },
      { value: "dammam", ar: "الدمام", en: "Dammam" },
      { value: "khobar", ar: "الخبر", en: "Khobar" },
      { value: "dhahran", ar: "الظهران", en: "Dhahran" },
      { value: "taif", ar: "الطائف", en: "Taif" },
      { value: "abha", ar: "أبها", en: "Abha" },
      { value: "khamis_mushait", ar: "خميس مشيط", en: "Khamis Mushait" },
      { value: "tabuk", ar: "تبوك", en: "Tabuk" },
      { value: "hail", ar: "حائل", en: "Hail" },
      { value: "qassim", ar: "القصيم", en: "Qassim" },
      { value: "buraidah", ar: "بريدة", en: "Buraidah" },
      { value: "unayzah", ar: "عنيزة", en: "Unaizah" },
      { value: "jazan", ar: "جازان", en: "Jazan" },
      { value: "najran", ar: "نجران", en: "Najran" },
      { value: "al_ahsa", ar: "الأحساء", en: "Al Ahsa" },
      { value: "jubail", ar: "الجبيل", en: "Jubail" },
      { value: "yanbu", ar: "ينبع", en: "Yanbu" },
    ];
  
    const clean = cleanText(value);
  
    const match = cities.find(
      (city) =>
        city.value === clean ||
        city.ar === clean ||
        city.en === clean
    );
  
    return {
      city_ar: match?.ar ?? clean,
      city_en: match?.en ?? clean,
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