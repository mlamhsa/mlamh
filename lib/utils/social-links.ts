export function normalizeInstagramUrl(
    value?: string | null
  ) {
    if (!value) return null;
  
    const cleanValue = value.trim();
  
    if (!cleanValue) return null;
  
    if (
      cleanValue.startsWith("http://") ||
      cleanValue.startsWith("https://")
    ) {
      return cleanValue;
    }
  
    if (cleanValue.startsWith("@")) {
      return `https://instagram.com/${cleanValue.slice(1)}`;
    }
  
    return `https://${cleanValue}`;
  }
  
  export function normalizeWhatsappNumber(
    value?: string | null
  ) {
    if (!value) return null;
  
    const cleaned = value.replace(/\D/g, "");
  
    if (!cleaned) return null;
  
    return cleaned;
  }
  
  export function buildWhatsappUrl(
    value?: string | null
  ) {
    const normalized = normalizeWhatsappNumber(value);
  
    if (!normalized) return null;
  
    return `https://wa.me/${normalized}`;
  }