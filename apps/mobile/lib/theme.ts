export const colors = {
  background: "#050505",
  foreground: "#F5F5F0",
  gold: "#C9A962",
  goldSoft: "#D4AF6A",
  grayDeep: "#0C0C0C",
  grayElevated: "#141414",
  grayMuted: "#6B6B6B",
} as const;

export const lightTheme = {
  background: colors.background,
  surface: colors.grayDeep,
  surfaceElevated: colors.grayElevated,
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
} as const;

export const darkTheme = {
  background: colors.background,
  surface: colors.grayDeep,
  surfaceElevated: colors.grayElevated,
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
} as const;

export type MlamhTheme = typeof lightTheme | typeof darkTheme;
