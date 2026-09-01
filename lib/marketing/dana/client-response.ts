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
}) {
  const count = input.talentCount ?? 1;
  if (input.language === "ar") {
    const parts = [
      `العميل يطلب ${count} ${talentLabel(input.talentType, "ar")}${input.city ? ` في ${input.city}` : ""}.`,
      input.recurring ? "التعاون مستمر/متكرر." : "الطلب لمشروع محدد.",
      input.socialContent ? "الاستخدام يشمل محتوى وتصوير سوشيال/فيديو." : null,
      input.compensation ? `المقابل المذكور: ${input.compensation}.` : "المقابل يحتاج تأكيدًا مع العميل.",
      input.supplyMissing === 0
        ? `Dana وجدت ${input.matchCount} موهبة قابلة للإرسال لهذا الـBrief.`
        : `المتاح حاليًا ${input.matchCount} ويوجد عجز ${input.supplyMissing} موهبة.`
    ].filter(Boolean);
    return parts.join(" ");
  }
  const parts = [
    `The client is requesting ${count} ${talentLabel(input.talentType, "en")}${input.city ? ` in ${input.city}` : ""}.`,
    input.recurring ? "The engagement is recurring." : "The request is for a specific project.",
    input.socialContent ? "The work includes social/video content." : null,
    input.compensation ? `Stated compensation: ${input.compensation}.` : "Compensation still needs confirmation.",
    input.supplyMissing === 0
      ? `Dana found ${input.matchCount} sendable talent profile(s) for this brief.`
      : `${input.matchCount} profile(s) are currently sendable, with a supply gap of ${input.supplyMissing}.`
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
}) {
  const firstName = input.matchNames[0] ?? null;
  if (input.language === "ar") {
    const email = input.supplyMissing === 0 && firstName
      ? `مرحبًا ${input.senderName ?? ""}،\n\nشكرًا لتواصلكم مع ملامح ومشاركة تفاصيل احتياجكم. راجعنا الطلب، ولدينا موهبة مناسبة وقابلة للترشيح حاليًا: ${firstName}${input.city ? ` في ${input.city}` : ""}.\n\nيمكننا الانتقال للخطوة التالية وتأكيد التفاصيل النهائية قبل التواصل مع الموهبة. إذا كان لديكم أي متطلبات إضافية مثل العمر، المقاسات، الخبرة أو موعد التصوير، أرسلوها لنا لنحدّث الترشيح.\n\nفريق ملامح | الشراكات والكاستنج`
      : `مرحبًا ${input.senderName ?? ""}،\n\nشكرًا لتواصلكم مع ملامح ومشاركة تفاصيل احتياجكم. راجعنا الطلب ونقوم حاليًا باستكمال قائمة المواهب المناسبة بدل إرسال ترشيحات غير مطابقة. سنشارككم الخيارات المؤهلة فور اكتمالها، ويمكنكم أيضًا إرسال أي متطلبات إضافية تساعدنا في تضييق نطاق الترشيح.\n\nفريق ملامح | الشراكات والكاستنج`;
    const whatsapp = input.supplyMissing === 0 && firstName
      ? `مرحبًا ${input.senderName ?? ""}، معكم فريق ملامح. راجعنا طلبكم ولدينا ترشيح مناسب حاليًا: ${firstName}${input.city ? ` – ${input.city}` : ""}. إذا لديكم متطلبات إضافية أو موعد محدد للتصوير أرسلوها لنا ونكمل معكم الخطوة التالية.`
      : `مرحبًا ${input.senderName ?? ""}، معكم فريق ملامح. استلمنا وراجعنا طلبكم، ونعمل على استكمال الترشيحات المناسبة بدل إرسال ملفات غير مطابقة. إذا لديكم متطلبات إضافية أرسلوها لنا وسنضيفها للـBrief.`;
    return { email, whatsapp };
  }

  const email = input.supplyMissing === 0 && firstName
    ? `Hello ${input.senderName ?? ""},\n\nThank you for contacting MLAMH and sharing your casting requirements. We reviewed the brief and currently have a suitable, sendable profile: ${firstName}${input.city ? ` in ${input.city}` : ""}.\n\nWe can move to the next step and confirm any final details before talent outreach. If you have additional requirements such as age range, measurements, experience, or shoot date, please send them and we will refine the shortlist.\n\nMLAMH Team | Partnerships & Casting`
    : `Hello ${input.senderName ?? ""},\n\nThank you for contacting MLAMH and sharing your requirements. We reviewed the brief and are currently completing the suitable shortlist rather than sending profiles that do not meet your criteria. Please share any additional requirements and we will include them in the brief.\n\nMLAMH Team | Partnerships & Casting`;
  const whatsapp = input.supplyMissing === 0 && firstName
    ? `Hello ${input.senderName ?? ""}, this is the MLAMH team. We reviewed your request and currently have a suitable profile: ${firstName}${input.city ? ` – ${input.city}` : ""}. Send us any additional requirements or the shoot date and we can move to the next step.`
    : `Hello ${input.senderName ?? ""}, this is the MLAMH team. We reviewed your request and are completing the suitable shortlist rather than sending mismatched profiles. Send any additional requirements and we will add them to the brief.`;
  return { email, whatsapp };
}
