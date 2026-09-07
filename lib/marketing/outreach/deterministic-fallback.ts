type OutreachTask = {
  task_type: string;
  channel: string | null;
  input: Record<string, unknown> | null;
};

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isFreeMarketingAIUnavailableError(message: string) {
  return /required capabilities:\s*free/i.test(message)
    || /free tier.*ended/i.test(message)
    || /free tier users do not have access/i.test(message);
}

export function buildDeterministicOutreachFallback(task: OutreachTask) {
  if (task.task_type !== "outreach_preparation") return null;

  const input = record(task.input);
  const contact = record(input.contact);
  const leadId = positiveInteger(input.lead_id);
  const organization = text(input.organization);
  const contactName = text(contact.name);
  const role = text(contact.role);
  const linkedinAvailable = contact.linkedin_available === true;
  const emailAvailable = contact.email_available === true;
  const requestedChannel = text(task.channel)?.toLowerCase();
  const channel = requestedChannel === "linkedin" && linkedinAvailable
    ? "linkedin"
    : requestedChannel === "email" && emailAvailable
      ? "email"
      : linkedinAvailable
        ? "linkedin"
        : emailAvailable
          ? "email"
          : null;

  if (!leadId || !organization || !contactName || !role || !channel) return null;

  const opportunityType = text(input.opportunity_type);
  const activity = opportunityType === "commercial_production"
    ? "الإنتاج التجاري والمحتوى"
    : "الإنتاج والكاستينغ";

  const message = [
    `مرحبًا ${contactName}،`,
    "",
    "معك سوسن من فريق تطوير الأعمال في MLAMH | ملامح.",
    "",
    "MLAMH منصة متخصصة في ربط شركات الإنتاج والوكالات والمشاريع بالممثلين والمودلز والمواهب في السعودية، من خلال مسار منظم يبدأ من الـBrief وينتهي باستقبال وترشيح المتقدمين المناسبين حسب متطلبات كل مشروع.",
    "",
    `بحكم دورك كـ${role} في ${organization} وعمل الشركة في ${activity}، نرى فرصة واضحة للتعاون وتسهيل الوصول إلى المواهب المطلوبة للمشاريع الحالية والقادمة.`,
    "",
    "يمكن لفريقكم إرسال متطلبات المشروع والمدينة والتاريخ والمواصفات الأساسية، ويتولى MLAMH تنظيم الاحتياج واستقبال المواهب المناسبة عبر المنصة.",
    "",
    `يسعدني التنسيق معك لمعرفة أفضل آلية تعاون بين ${organization} وMLAMH للمشاريع القادمة.`,
    "",
    "تحياتي،",
    "Sawsan Ahdadi",
    "Business Development",
    "MLAMH | ملامح",
    "mlamh.net",
  ].join("\n");

  return {
    executive_summary: `Prepared a deterministic governed first-touch draft for ${organization} because free Marketing AI capacity was unavailable.`,
    observed_signals: [
      `Verified contact: ${contactName}`,
      `Verified role: ${role}`,
      `Available governed channel: ${channel}`,
    ],
    priorities: ["Route the prepared draft through the existing CEO approval gate before any external delivery."],
    recommended_next_actions: ["Review the draft in CEO Decision Queue; send only after explicit approval."],
    data_gaps: [],
    decisions_needed: ["CEO approval is required before external delivery."],
    outreach_drafts: [{
      lead_id: leadId,
      channel,
      subject: channel === "email" ? "Casting & Talent Supply Partnership — MLAMH" : null,
      message,
    }],
    fallback_metadata: {
      mode: "deterministic_verified_contact_template",
      external_send_allowed: false,
      paid_ai_used: false,
    },
  };
}
