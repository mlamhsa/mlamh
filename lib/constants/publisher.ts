type LocalizedLabel = {
    ar: string;
    en: string;
  };
  
  export const publisherTypeLabels: Record<string, LocalizedLabel> = {
    agency: { ar: "وكالة", en: "Agency" },
    salon: { ar: "صالون", en: "Salon" },
    production_company: {
      ar: "شركة إنتاج",
      en: "Production Company",
    },
    casting_agency: {
      ar: "وكالة كاستنج",
      en: "Casting Agency",
    },
    media_company: {
      ar: "شركة إعلامية",
      en: "Media Company",
    },
    brand: {
      ar: "علامة تجارية",
      en: "Brand",
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