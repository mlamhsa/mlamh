type Locale = "ar" | "en";

const labelsAr: Record<string, string> = {
  draft: "مسودة",
  pending_review: "قيد المراجعة",
  published: "منشورة",
  open: "مفتوحة",
  closed: "مغلقة",
  archived: "مؤرشفة",
  rejected: "مرفوضة",
};

const labelsEn: Record<string, string> = {
  draft: "Draft",
  pending_review: "In Review",
  published: "Published",
  open: "Open",
  closed: "Closed",
  archived: "Archived",
  rejected: "Rejected",
};

export function getOpportunityStatusLabel(
  status?: string | null,
  locale: Locale = "ar"
) {
  if (!status) return "-";

  const labels = locale === "ar" ? labelsAr : labelsEn;

  return labels[status] ?? status.replaceAll("_", " ");
}

export function getOpportunityStatusClass(status?: string | null) {
  switch (status) {
    case "published":
    case "open":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
    case "pending_review":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "closed":
      return "border-white/15 bg-white/5 text-white/50";
    case "archived":
    case "rejected":
      return "border-red-400/30 bg-red-400/10 text-red-300";
    case "draft":
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}