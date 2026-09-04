export const colors = {
  gold: "#D4A017",
  goldStrong: "#E1A700",
  charcoal: "#2E2E2E",
  ivory: "#F5F1E8",
  bronze: "#8C6A2D",
  black: "#101415",
} as const;

export const lightTheme = {
  background: "#F7F3EC",
  surface: "#FBF8F2",
  surfaceElevated: "#FFFFFF",
  text: "#121212",
  muted: "#6F6A61",
  border: "#E7DFD2",
  accent: colors.goldStrong,
  nav: "#FCFAF5",
  input: "#FFFFFF",
  chip: "#F1ECE4",
  shadow: "#000000",
} as const;

export const darkTheme = {
  background: "#101415",
  surface: "#161B1D",
  surfaceElevated: "#1D2325",
  text: "#F8F3EA",
  muted: "#AFA89D",
  border: "#2B3234",
  accent: colors.goldStrong,
  nav: "#111617",
  input: "#1D2325",
  chip: "#23292B",
  shadow: "#000000",
} as const;

export type MlamhTheme = typeof lightTheme | typeof darkTheme;
