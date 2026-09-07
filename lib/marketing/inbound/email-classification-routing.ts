export type InboundEmailClassification =
  | "casting"
  | "commercial"
  | "partnership"
  | "support"
  | "opt_out"
  | "general";

export type InboundEmailRoute = "dana" | "ceo_review" | "support_review" | "manual_review";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

const COMMERCIAL_SIGNAL = /(?:price|pricing|budget|discount|contract|agreement|legal|guarantee|commitment|invoice|payment|rate|fee|سعر|تسعير|ميزانية|خصم|عقد|اتفاقية|قانون|ضمان|التزام|فاتورة|دفع|مقابل)/iu;
const PARTNERSHIP_SIGNAL = /(?:partnership|partner|sponsor|sponsorship|investment|investor|شراكة|شريك|رعاية|راعٍ|راعي|استثمار|مستثمر)/iu;
const SUPPORT_SIGNAL = /(?:support|help|account|login|password|technical|issue|problem|دعم|مساعدة|حساب|دخول|كلمة المرور|تقني|مشكلة)/iu;
const OPT_OUT_SIGNAL = /(?:unsubscribe|opt[ -]?out|stop emailing|remove me|do not contact|إلغاء الاشتراك|لا تراسل|لا تتواصل|أوقف الرسائل)/iu;
const CASTING_SIGNAL = /(?:casting|model|models|actor|actors|talent|brief|shoot|filming|audition|مودل|مودلز|ممثل|ممثلين|موهبة|مواهب|كاستنج|تصوير|تجربة أداء|بريف)/iu;

export function classifyAndRouteInboundEmail(input: {
  analysis?: Record<string, unknown>;
  content?: string | null;
  subject?: string | null;
}) {
  const analysis = record(input.analysis);
  const intent = text(analysis.intent).toLowerCase();
  const haystack = `${text(input.subject)}\n${text(input.content)}\n${intent}`;
  const modelRequiresCeo = analysis.requires_ceo === true;

  if (OPT_OUT_SIGNAL.test(haystack)) {
    return {
      classification: "opt_out" as const,
      route: "manual_review" as const,
      requiresCeo: false,
      reason: "explicit_opt_out_signal",
    };
  }

  if (modelRequiresCeo || PARTNERSHIP_SIGNAL.test(haystack)) {
    return {
      classification: PARTNERSHIP_SIGNAL.test(haystack) ? "partnership" as const : "commercial" as const,
      route: "ceo_review" as const,
      requiresCeo: true,
      reason: modelRequiresCeo ? "model_requires_ceo" : "deterministic_partnership_signal",
    };
  }

  if (COMMERCIAL_SIGNAL.test(haystack)) {
    return {
      classification: "commercial" as const,
      route: "ceo_review" as const,
      requiresCeo: true,
      reason: "deterministic_commercial_signal",
    };
  }

  if (SUPPORT_SIGNAL.test(haystack)) {
    return {
      classification: "support" as const,
      route: "support_review" as const,
      requiresCeo: false,
      reason: "support_signal",
    };
  }

  if (CASTING_SIGNAL.test(haystack)) {
    return {
      classification: "casting" as const,
      route: "dana" as const,
      requiresCeo: false,
      reason: "casting_signal",
    };
  }

  return {
    classification: "general" as const,
    route: "dana" as const,
    requiresCeo: false,
    reason: "default_general",
  };
}
