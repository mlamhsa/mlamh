export const colors = {
  gold: "#D4A017",
  charcoal: "#2E2E2E",
  ivory: "#F5F1E8",
  bronze: "#8C6A2D",
} as const;

export const lightTheme = {
  background: colors.ivory,
  surface: "#FFFFFF",
  text: colors.charcoal,
  muted: "#6F6A61",
  border: "#DED7C9",
  accent: colors.gold,
} as const;

export const darkTheme = {
  background: "#181818",
  surface: colors.charcoal,
  text: colors.ivory,
  muted: "#B9B0A2",
  border: "#44403A",
  accent: colors.gold,
} as const;
