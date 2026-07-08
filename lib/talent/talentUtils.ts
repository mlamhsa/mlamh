export const APPLICATION_STATUSES = [
    "pending",
    "reviewing",
    "shortlisted",
    "accepted",
    "rejected",
  ] as const;
  
  export function normalizeStatus(status?: string | null) {
    if (
      status === "reviewing" ||
      status === "shortlisted" ||
      status === "accepted" ||
      status === "rejected"
    ) {
      return status;
    }
  
    return "pending";
  }
  
  export function statusLabel(status?: string | null, isRtl = false) {
    const normalized = normalizeStatus(status);
  
    if (normalized === "reviewing")
      return isRtl ? "قيد المراجعة" : "Reviewing";
  
    if (normalized === "shortlisted")
      return isRtl ? "القائمة المختصرة" : "Shortlisted";
  
    if (normalized === "accepted")
      return isRtl ? "مقبول" : "Accepted";
  
    if (normalized === "rejected")
      return isRtl ? "مرفوض" : "Rejected";
  
    return isRtl ? "جديد" : "Pending";
  }
  
  export function statusClass(status?: string | null) {
    const normalized = normalizeStatus(status);
  
    if (normalized === "reviewing")
      return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  
    if (normalized === "shortlisted")
      return "border-gold/30 bg-gold/10 text-gold";
  
    if (normalized === "accepted")
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  
    if (normalized === "rejected")
      return "border-red-400/30 bg-red-400/10 text-red-300";
  
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
  
  export function profileStatusLabel(status?: string | null, isRtl = false) {
    if (status === "approved")
      return isRtl ? "معتمد" : "Approved";
  
    if (status === "pending")
      return isRtl ? "بانتظار الاعتماد" : "Pending approval";
  
    if (status === "rejected")
      return isRtl ? "غير معتمد" : "Not approved";
  
    if (status === "draft")
      return isRtl ? "مسودة" : "Draft";
  
    return status ? status.replaceAll("_", " ") : "-";
  }
  
  export function availabilityLabel(status?: string | null, isRtl = false) {
    if (status === "available_now")
      return isRtl ? "متاح حالياً" : "Available now";
  
    if (status === "available")
      return isRtl ? "متاح" : "Available";
  
    if (status === "busy")
      return isRtl ? "مشغول" : "Busy";
  
    if (status === "unavailable")
      return isRtl ? "غير متاح" : "Unavailable";
  
    return status ? status.replaceAll("_", " ") : "-";
  }
  
  export function formatDate(value?: string | null, locale = "en") {
    if (!value) return "-";
  
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  }