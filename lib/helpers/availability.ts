type Locale = "ar" | "en";

const ar: Record<string, string> = {
  available_now: "متاح الآن",
  available: "متاح",
  busy: "مشغول",
  unavailable: "غير متاح",
};

const en: Record<string, string> = {
  available_now: "Available now",
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
};

export function getAvailabilityLabel(
  status?: string | null,
  locale: Locale = "ar"
) {
  if (!status) return "-";

  const labels = locale === "ar" ? ar : en;

  return labels[status] ?? status.replaceAll("_", " ");
}