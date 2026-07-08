type Locale = "ar" | "en";

const ar: Record<string, string> = {
  approved: "مقبول",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
  draft: "مسودة",
};

const en: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  draft: "Draft",
};

export function getProfileStatusLabel(
  status?: string | null,
  locale: Locale = "ar"
) {
  if (!status) return "-";

  const labels = locale === "ar" ? ar : en;

  return labels[status] ?? status.replaceAll("_", " ");
}