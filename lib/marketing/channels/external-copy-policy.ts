const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function normalizeExternalCopy(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\\+(?:r\\+n|n|r)/g, "\n")
    .replace(/\\+([.!?,،؛:])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function westernizeDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => ARABIC_INDIC_DIGITS[digit] ?? digit);
}

export function containsLiveTalentCountClaim(value: unknown) {
  const copy = westernizeDigits(normalizeExternalCopy(value));
  if (!copy) return false;

  const talentTerms = "(?:موهبة|مواهب|موهوب(?:ة|ين|ات)?|talents?|actors?\\s+and\\s+models?|ممثل(?:ين|ون)?|مودلز?)";
  const number = "(?:\\d{1,7})";

  const numberBeforeTalent = new RegExp(`${number}\\s+(?:تسجيل(?:ات)?\\s+)?${talentTerms}`, "i");
  const talentBeforeNumber = new RegExp(`${talentTerms}\\s*(?:لدينا|مسجل(?:ة|ين)?|registered|total|عدد)?\\s*[:=-]?\\s*${number}`, "i");

  return numberBeforeTalent.test(copy) || talentBeforeNumber.test(copy);
}

export function assertExternalMarketingCopyPolicy(value: unknown) {
  const copy = normalizeExternalCopy(value);
  if (!copy) throw new Error("External copy policy blocked: empty_copy.");
  if (containsLiveTalentCountClaim(copy)) {
    throw new Error("External copy policy blocked: live_talent_count_must_remain_internal.");
  }
  return copy;
}
