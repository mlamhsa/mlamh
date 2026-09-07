function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const UNEXPECTED_CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/u;
const BUDGET_AMOUNT = /(?:\bSAR\b|ر\.?\s*س|ريال(?:\s+سعودي)?|﷼)?\s*([0-9٠-٩][0-9٠-٩,٬.]*)\s*(?:\bSAR\b|ر\.?\s*س|ريال(?:\s+سعودي)?|﷼)?/iu;
const EXPLICIT_BUDGET_BASIS = /(?:إجمالي|اجمالي|المجموع|للثلاث|للمودلز|للمواهب|لكل\s+(?:مودل|موهبة|شخص)|per\s+(?:model|talent|person)|total)/iu;

function stripUnexpectedCjk(value: string) {
  return value
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]+/gu, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([،,.!?؟:;])/g, "$1")
    .trim();
}

function deepSanitize(value: unknown): unknown {
  if (typeof value === "string") return stripUnexpectedCjk(value);
  if (Array.isArray(value)) return value.map(deepSanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, deepSanitize(item)]));
  }
  return value;
}

export function hasUnexpectedCjk(value: unknown) {
  if (typeof value === "string") return UNEXPECTED_CJK.test(value);
  if (Array.isArray(value)) return value.some(hasUnexpectedCjk);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasUnexpectedCjk);
  return false;
}

export function inboundBudgetBasisIsAmbiguous(content: string) {
  return BUDGET_AMOUNT.test(content) && !EXPLICIT_BUDGET_BASIS.test(content);
}

export function applyDanaInboundEmailQualityGuard({
  analysis,
  inboundContent,
}: {
  analysis: Record<string, unknown>;
  inboundContent: string;
}) {
  const sanitized = record(deepSanitize(analysis));
  const qualityFlags: string[] = [];

  if (hasUnexpectedCjk(analysis)) qualityFlags.push("unexpected_cjk_removed");

  if (inboundBudgetBasisIsAmbiguous(inboundContent)) {
    qualityFlags.push("budget_basis_ambiguous");
    const requirements = record(sanitized.updated_requirements);
    const budget = record(requirements.budget);
    sanitized.updated_requirements = {
      ...requirements,
      budget: {
        ...budget,
        basis: "unspecified",
      },
    };

    const reply = text(sanitized.reply_draft);
    const alreadyAsks = reply && /(?:هل|clarify|confirm).*(?:إجمالي|اجمالي|لكل|total|per)/iu.test(reply);
    if (!alreadyAsks && reply) {
      sanitized.reply_draft = `${reply}\n\nوللتأكيد: هل الميزانية المذكورة إجمالية لجميع المواهب أم لكل موهبة؟`;
    }
  }

  sanitized.quality_flags = qualityFlags;
  return sanitized;
}
