export const MLAMH_COLORS = {
  primaryGold: "#D4A017",
  charcoal: "#2E2E2E",
  warmIvory: "#F5F1E8",
  deepGold: "#8C6A2D",
} as const;

export const MLAMH_LIGHT_THEME = {
  background: MLAMH_COLORS.warmIvory,
  surface: MLAMH_COLORS.warmIvory,
  text: MLAMH_COLORS.charcoal,
  primary: MLAMH_COLORS.primaryGold,
  accent: MLAMH_COLORS.deepGold,
} as const;

export const MLAMH_DARK_THEME = {
  background: MLAMH_COLORS.charcoal,
  surface: MLAMH_COLORS.charcoal,
  text: MLAMH_COLORS.warmIvory,
  primary: MLAMH_COLORS.primaryGold,
  accent: MLAMH_COLORS.deepGold,
} as const;

/**
 * Approved MLAMH Mobile Design Direction v1.
 * Bronze is a supporting accent only; Mustard Gold remains the primary brand color.
 * Component-level semantic tokens will be layered on top when the Expo app is created.
 */
export const MLAMH_MOBILE_DESIGN = {
  themes: ["light", "dark"] as const,
  contentFirst: true,
  rtlReady: true,
  brand: MLAMH_COLORS,
} as const;
