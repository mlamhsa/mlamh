export const colors = {
  background: "#050505",
  surface: "#0B0B0B",
  surfaceElevated: "#111111",
  gold: "#C9A962",
  goldSoft: "#D9BD7A",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.66)",
  textMuted: "rgba(255,255,255,0.38)",
  border: "rgba(255,255,255,0.10)",
  success: "#6ED7A8",
  warning: "#E7C26F",
  error: "#F08B8B",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  eyebrow: 11,
  caption: 12,
  body: 15,
  bodyLarge: 17,
  title: 24,
  display: 36,
} as const;

export const motion = {
  fast: 150,
  standard: 220,
  slow: 320,
} as const;
