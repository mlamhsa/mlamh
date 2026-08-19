type LocalizedLabel = {
    ar: string;
    en: string;
  };
  
  export const publisherTypeLabels: Record<
  string,
  { ar: string; en: string }
> = {
  production_company: {
    ar: "شركة إنتاج",
    en: "Production Company",
  },
  advertising_agency: {
    ar: "وكالة إعلانية",
    en: "Advertising Agency",
  },
  casting_agency: {
    ar: "وكالة كاستينغ",
    en: "Casting Agency",
  },
  talent_agency: {
    ar: "وكالة مواهب",
    en: "Talent Agency",
  },
  brand: {
    ar: "علامة تجارية",
    en: "Brand",
  },
  content_company: {
    ar: "شركة محتوى",
    en: "Content Company",
  },
  individual: {
    ar: "فرد / مستقل",
    en: "Individual / Freelancer",
  },
  other: {
    ar: "أخرى",
    en: "Other",
  },
};
  
  export const cityLabels: Record<string, LocalizedLabel> = {
    riyadh: { ar: "الرياض", en: "Riyadh" },
    jeddah: { ar: "جدة", en: "Jeddah" },
    makkah: { ar: "مكة", en: "Makkah" },
    madinah: { ar: "المدينة المنورة", en: "Madinah" },
    dammam: { ar: "الدمام", en: "Dammam" },
    khobar: { ar: "الخبر", en: "Khobar" },
  };