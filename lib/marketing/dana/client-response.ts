export type DanaClientLanguage = "ar" | "en";

const ARABIC_RE = /[\u0600-\u06FF]/g;
const LATIN_RE = /[A-Za-z]/g;

export function detectDanaClientLanguage(subject?: string | null, message?: string | null): DanaClientLanguage {
  const text = `${subject ?? ""} ${message ?? ""}`;
  const arabic = (text.match(ARABIC_RE) ?? []).length;
  const latin = (text.match(LATIN_RE) ?? []).length;
  return arabic >= latin ? "ar" : "en";
}

function talentLabel(type: string | null | undefined, language: DanaClientLanguage) {
  if (language === "ar") {
    if (type === "model") return "مودل";
    if (type === "actor") return "ممثل/ممثلة";
    if (type === "mixed") return "مواهب";
    return "موهبة";
  }
  if (type === "model") return "model";
  if (type === "actor") return "actor";
  return "talent";
}

function localizedCity(city: string | null | undefined, language: DanaClientLanguage) {
  if (!city) return null;
  if (language === "ar" && city.trim().toLowerCase() === "jeddah") return "جدة";
  if (language === "ar" && city.trim().toLowerCase() === "riyadh") return "الرياض";
  return city;
}

export function buildDanaExecutiveSummary(input: {
  language: DanaClientLanguage;
  talentType?: string | null;
  talentCount?: number | null;
  city?: string | null;
  recurring?: boolean;
  socialContent?: boolean;
  compensation?: string | null;
  matchCount: number;
  supplyMissing: number;
  alternativesRequested?: boolean;
}) {
  const count = input.talentCount ?? 1;
  const city = localizedCity(input.city, input.language);
  if (input.language === "ar") {
    const parts = [
      `العميل يطلب ${count} ${talentLabel(input.talentType, "ar")}${city ? ` في ${city}` : ""}.`,
      input.recurring ? "التعاون شهري ومستمر." : "الطلب لمشروع محدد.",
      input.socialContent ? "الاستخدام يشمل تصوير المنتجات ومحتوى السوشيال والفيديو." : null,
      input.compensation ? `المقابل المذكور: ${input.compensation}.` : "المقابل يحتاج تأكيدًا مع العميل.",
      input.matchCount > 0 ? `وجدت Dana ${input.matchCount} موهبة مطابقة وقابلة للترشيح حاليًا.` : "لا توجد موهبة مطابقة قابلة للترشيح حاليًا.",
      input.alternativesRequested && input.matchCount <= count ? "العميل طلب بدائل للمقارنة، ولا توجد بدائل إضافية مطابقة جاهزة حاليًا؛ نحتاج استكمال الترشيحات." : null,
      input.supplyMissing > 0 ? `يوجد عجز أساسي قدره ${input.supplyMissing} موهبة عن العدد المطلوب.` : null,
    ].filter(Boolean);
    return parts.join(" ");
  }
  const parts = [
    `The client is requesting ${count} ${talentLabel(input.talentType, "en")}${city ? ` in ${city}` : ""}.`,
    input.recurring ? "The engagement is monthly and recurring." : "The request is for a specific project.",
    input.socialContent ? "The work includes product shoots, social content and video." : null,
    input.compensation ? `Stated compensation: ${input.compensation}.` : "Compensation still needs confirmation.",
    input.matchCount > 0 ? `Dana found ${input.matchCount} matching, sendable talent profile(s).` : "No matching sendable talent is currently available.",
    input.alternativesRequested && input.matchCount <= count ? "The client requested alternatives for comparison; no additional matching alternatives are ready yet, so the shortlist needs to be expanded." : null,
    input.supplyMissing > 0 ? `The core requested count has a supply gap of ${input.supplyMissing}.` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export function buildDanaChannelDrafts(input: {
  language: DanaClientLanguage;
  senderName?: string | null;
  talentType?: string | null;
  city?: string | null;
  matchNames: string[];
  supplyMissing: number;
  alternativesRequested?: boolean;
}) {
  const firstName = input.matchNames[0] ?? null;
  const city = localizedCity(input.city, input.language);
  if (input.language === "ar") {
    const alternatives = input.alternativesRequested && firstName
      ? " كما طلبتم بدائل للمقارنة، سنستكمل ترشيح مودلز إضافيات مطابقات في جدة بدل إرسال ملفات غير مناسبة."
      : "";
    const email = firstName
      ? `مرحبًا ${input.senderName ?? ""}،\n\nشكرًا لتواصلكم مع ملامح. راجعنا احتياجكم للتعاون الشهري المستمر في تصوير المنتجات والعبايات ومحتوى السوشيال والفيديو. لدينا حاليًا ترشيح مطابق وقابل للتقديم: ${firstName}${city ? ` في ${city}` : ""}.${alternatives}\n\nسنؤكد معكم التفاصيل النهائية وموعد التصوير قبل التواصل مع الموهبة. وإذا كانت لديكم متطلبات إضافية مثل العمر أو المقاسات أو الخبرة، أرسلوها لنا لنحدّث قائمة الترشيحات.\n\nفريق ملامح | الشراكات والكاستنج`
      : `مرحبًا ${input.senderName ?? ""}،\n\nشكرًا لتواصلكم مع ملامح. راجعنا احتياجكم، ونعمل حاليًا على استكمال قائمة المواهب المطابقة بدل إرسال ملفات غير مناسبة. سنشارككم الخيارات المؤهلة فور اكتمالها، ويمكنكم إرسال أي متطلبات إضافية لتحديث قائمة الترشيحات.\n\nفريق ملامح | الشراكات والكاستنج`;
    const whatsapp = firstName
      ? `مرحبًا ${input.senderName ?? ""}، معكم فريق ملامح. راجعنا طلبكم للتعاون الشهري ولدينا حاليًا ترشيح مطابق: ${firstName}${city ? ` – ${city}` : ""}.${input.alternativesRequested ? " وبما أنكم طلبتم بدائل للمقارنة، سنستكمل ترشيحات إضافية مطابقة بدل إرسال ملفات غير مناسبة." : ""} إذا لديكم موعد محدد للتصوير أو متطلبات إضافية أرسلوها لنا ونكمل معكم الخطوة التالية.`
      : `مرحبًا ${input.senderName ?? ""}، معكم فريق ملامح. استلمنا وراجعنا طلبكم، ونعمل على استكمال الترشيحات المطابقة بدل إرسال ملفات غير مناسبة. إذا لديكم متطلبات إضافية أرسلوها لنا وسنضيفها لمتطلبات الطلب.`;
    return { email, whatsapp };
  }

  const alternatives = input.alternativesRequested && firstName
    ? " As requested, we will continue building additional matching alternatives for comparison rather than sending unsuitable profiles."
    : "";
  const email = firstName
    ? `Hello ${input.senderName ?? ""},\n\nThank you for contacting MLAMH. We reviewed your recurring monthly requirement for product shoots, social content and video. We currently have a matching, sendable profile: ${firstName}${city ? ` in ${city}` : ""}.${alternatives}\n\nWe can confirm the final details and shoot date before talent outreach. If you have additional requirements such as age range, measurements or experience, please send them and we will refine the shortlist.\n\nMLAMH Team | Partnerships & Casting`
    : `Hello ${input.senderName ?? ""},\n\nThank you for contacting MLAMH. We reviewed your requirements and are completing the matching shortlist rather than sending unsuitable profiles. Please share any additional requirements and we will use them to refine the shortlist.\n\nMLAMH Team | Partnerships & Casting`;
  const whatsapp = firstName
    ? `Hello ${input.senderName ?? ""}, this is the MLAMH team. We reviewed your recurring request and currently have a matching profile: ${firstName}${city ? ` – ${city}` : ""}.${input.alternativesRequested ? " We will also continue building additional matching alternatives for comparison." : ""} Send us the shoot date or any additional requirements and we can move to the next step.`
    : `Hello ${input.senderName ?? ""}, this is the MLAMH team. We reviewed your request and are completing the matching shortlist rather than sending unsuitable profiles. Send any additional requirements and we will add them to the request.`;
  return { email, whatsapp };
}
