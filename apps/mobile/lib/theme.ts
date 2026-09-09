export const colors = {
  background: "#050505",
  foreground: "#F5F5F0",
  gold: "#C9A962",
  goldSoft: "#D4AF6A",
  grayDeep: "#0C0C0C",
  grayElevated: "#141414",
  grayMuted: "#6B6B6B",
  success: "#49C991",
  warning: "#E6B566",
  danger: "#E59A9A",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  pageTitle: { fontSize: 28, lineHeight: 35, fontWeight: "900" as const },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: "900" as const },
  body: { fontSize: 13, lineHeight: 21, fontWeight: "400" as const },
  label: { fontSize: 11, lineHeight: 16, fontWeight: "800" as const },
  caption: { fontSize: 10, lineHeight: 15, fontWeight: "600" as const },
} as const;

const sharedTheme = {
  background: colors.background,
  surface: colors.grayDeep,
  surfaceElevated: colors.grayElevated,
  grayElevated: colors.grayElevated,
  text: colors.foreground,
  muted: "#B9B6AE",
  grayMuted: colors.grayMuted,
  border: "#FFFFFF14",
  accent: colors.gold,
  nav: colors.grayDeep,
  input: colors.grayDeep,
  chip: "#C9A9621F",
  shadow: "#00000099",
  charcoal: colors.background,
  ivory: colors.foreground,
  bronze: colors.goldSoft,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  dangerSurface: "#E59A9A10",
  successSurface: "#49C99110",
} as const;

export const lightTheme = sharedTheme;
export const darkTheme = sharedTheme;

export type MlamhTheme = typeof darkTheme;
