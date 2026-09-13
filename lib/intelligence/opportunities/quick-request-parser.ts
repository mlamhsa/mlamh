type Locale = "ar" | "en";

type QuickRequestDraft = {
  title: string;
  description: string;
  opportunity_type: "actor" | "model" | null;
  city: string;
  required_gender: "any" | "male" | "female";
  compensation_type: "fixed" | "negotiable" | "unpaid";
  budget: string | null;
  required_count: number;
  work_date: string | null;
  work_time: string | null;
  work_duration: string | null;
  application_days: number;
};

type ParseResult = {
  draft: QuickRequestDraft;
  needs_follow_up: boolean;
  follow_up_field: "opportunity_type" | null;
  follow_up_question: string | null;
};

const CITY_ALIASES: Array<{ value: string; aliases: string[] }> = [
  { value: "riyadh", aliases: ["الرياض", "riyadh"] },
  { value: "jeddah", aliases: ["جدة", "jeddah"] },
  { value: "makkah", aliases: ["مكة", "مكه", "makkah", "mecca"] },
  { value: "madinah", aliases: ["المدينة", "المدينه", "madinah", "medina"] },
  { value: "dammam", aliases: ["الدمام", "dammam"] },
  { value: "khobar", aliases: ["الخبر", "khobar", "alkhobar"] },
  { value: "dhahran", aliases: ["الظهران", "dhahran"] },
  { value: "taif", aliases: ["الطائف", "taif"] },
  { value: "abha", aliases: ["أبها", "ابها", "abha"] },
  { value: "khamis_mushait", aliases: ["خميس مشيط", "khamis mushait"] },
  { value: "tabuk", aliases: ["تبوك", "tabuk"] },
  { value: "hail", aliases: ["حائل", "hail"] },
  { value: "qassim", aliases: ["القصيم", "qassim"] },
  { value: "buraidah", aliases: ["بريدة", "بريده", "buraidah"] },
  { value: "unayzah", aliases: ["عنيزة", "عنيزه", "unayzah", "unaizah"] },
  { value: "jazan", aliases: ["جازان", "جيزان", "jazan"] },
  { value: "najran", aliases: ["نجران", "najran"] },
  { value: "al_ahsa", aliases: ["الأحساء", "الاحساء", "al ahsa", "alahsa"] },
  { value: "jubail", aliases: ["الجبيل", "jubail"] },
  { value: "yanbu", aliases: ["ينبع", "yanbu"] },
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function detectType(text: string): QuickRequestDraft["opportunity_type"] {
  if (/(مودل|عارض|عارضة|model)/i.test(text)) return "model";
  if (/(ممثل|ممثلة|تمثيل|actor|actress)/i.test(text)) return "actor";
  return null;
}

function detectGender(text: string): QuickRequestDraft["required_gender"] {
  if (/(بنت|فتاة|سيدة|انثى|أنثى|female|woman|girl)/i.test(text)) return "female";
  if (/(شاب|رجل|ذكر|male|man|boy)/i.test(text)) return "male";
  return "any";
}

function detectCity(text: string, fallbackCity?: string | null) {
  const normalized = normalize(text);
  for (const city of CITY_ALIASES) {
    if (city.aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
      return city.value;
    }
  }
  return fallbackCity?.trim() || "";
}

function detectBudget(text: string) {
  if (/(بدون مقابل|مجاني|غير مدفوع|unpaid|volunteer)/i.test(text)) {
    return { compensation_type: "unpaid" as const, budget: null };
  }

  const patterns = [
    /(?:الميزانية|الميزانيه|المقابل|الأجر|الاجر|budget|pay|fee)\s*[:：-]?\s*(\d[\d,]*)/i,
    /(\d[\d,]*)\s*(?:ريال|ر\.س|sar)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return {
        compensation_type: "fixed" as const,
        budget: match[1].replace(/,/g, ""),
      };
    }
  }

  return { compensation_type: "negotiable" as const, budget: null };
}

function detectRequiredCount(text: string) {
  const match = text.match(/(\d{1,3})\s*(?:مودل|مودلز|ممثل|ممثلين|ممثلة|ممثلات|أشخاص|اشخاص|people|models?|actors?)/i);
  if (!match?.[1]) return 1;
  const count = Number(match[1]);
  return Number.isInteger(count) && count >= 1 && count <= 1000 ? count : 1;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function detectWorkDate(text: string, now = new Date()) {
  if (/(بكرة|غدًا|غدا|tomorrow)/i.test(text)) return addDays(now, 1);
  if (/(اليوم|today)/i.test(text)) return addDays(now, 0);
  return null;
}

function detectWorkTime(text: string) {
  const match = text.match(/(?:الساعة|الساعه|at)?\s*(\d{1,2})(?::(\d{2}))?\s*(ص|م|am|pm)?/i);
  if (!match?.[1]) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = (match[3] || "").toLowerCase();

  if (minute > 59 || hour > 23) return null;
  if ((meridiem === "م" || meridiem === "pm") && hour < 12) hour += 12;
  if ((meridiem === "ص" || meridiem === "am") && hour === 12) hour = 0;
  if (hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function detectDuration(text: string) {
  if (/(يوم كامل|full day)/i.test(text)) return "full_day";
  if (/(ساعتين|ساعتان|2\s*ساع|2\s*hours?)/i.test(text)) return "2_hours";
  if (/(4\s*ساع|أربع ساعات|اربع ساعات|4\s*hours?)/i.test(text)) return "4_hours";
  if (/(ساعة واحدة|ساعة|1\s*ساع|1\s*hour)/i.test(text)) return "1_hour";
  return null;
}

function buildTitle(text: string, type: QuickRequestDraft["opportunity_type"], locale: Locale) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length >= 3 && clean.length <= 90) return clean;
  if (type === "model") return locale === "ar" ? "مطلوب مودل للتصوير" : "Model needed for a shoot";
  if (type === "actor") return locale === "ar" ? "مطلوب ممثل / ممثلة" : "Actor needed";
  return locale === "ar" ? "طلب موهبة جديد" : "New talent request";
}

export function parseQuickRequestText({
  text,
  locale,
  fallbackCity,
}: {
  text: string;
  locale: Locale;
  fallbackCity?: string | null;
}): ParseResult {
  const cleanText = text.trim().replace(/\s+/g, " ");
  const type = detectType(cleanText);
  const compensation = detectBudget(cleanText);
  const draft: QuickRequestDraft = {
    title: buildTitle(cleanText, type, locale),
    description: cleanText,
    opportunity_type: type,
    city: detectCity(cleanText, fallbackCity),
    required_gender: detectGender(cleanText),
    compensation_type: compensation.compensation_type,
    budget: compensation.budget,
    required_count: detectRequiredCount(cleanText),
    work_date: detectWorkDate(cleanText),
    work_time: detectWorkTime(cleanText),
    work_duration: detectDuration(cleanText),
    application_days: 3,
  };

  if (!draft.opportunity_type) {
    return {
      draft,
      needs_follow_up: true,
      follow_up_field: "opportunity_type",
      follow_up_question:
        locale === "ar"
          ? "تبحث عن ممثل/ممثلة أم مودل؟"
          : "Are you looking for an actor or a model?",
    };
  }

  return {
    draft,
    needs_follow_up: false,
    follow_up_field: null,
    follow_up_question: null,
  };
}
