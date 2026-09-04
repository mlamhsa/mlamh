export const colors = {
  gold: "#D4A017",
  charcoal: "#2E2E2E",
  ivory: "#F5F1E8",
  bronze: "#8C6A2D",
} as const;

export const lightTheme = {
  background: colors.ivory,
  surface: colors.ivory,
  surfaceElevated: colors.ivory,
  text: colors.charcoal,
  muted: colors.bronze,
  border: "#8C6A2D55",
  accent: colors.gold,
  nav: colors.ivory,
  input: colors.ivory,
  chip: "#D4A01714",
  shadow: "#2E2E2E22",
  charcoal: colors.charcoal,
  ivory: colors.ivory,
  bronze: colors.bronze,
} as const;

export const darkTheme = {
  background: colors.charcoal,
  surface: colors.charcoal,
  surfaceElevated: colors.charcoal,
  text: colors.ivory,
  muted: "#F5F1E8B8",
  border: "#8C6A2D66",
  accent: colors.gold,
  nav: colors.charcoal,
  input: colors.charcoal,
  chip: "#D4A0171F",
  shadow: "#2E2E2E",
  charcoal: colors.charcoal,
  ivory: colors.ivory,
  bronze: colors.bronze,
} as const;

export type MlamhTheme = typeof lightTheme | typeof darkTheme;
