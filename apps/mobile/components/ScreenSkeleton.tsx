import { StyleSheet, View } from "react-native";

import { darkTheme } from "@/lib/theme";

type Variant = "list" | "profile" | "detail";

export function ScreenSkeleton({ variant = "list" }: { variant?: Variant }) {
  const rows = variant === "profile" ? 3 : variant === "detail" ? 4 : 5;
  return <View style={styles.screen} accessibilityRole="progressbar" accessibilityLabel="Loading">
    <View style={styles.content}>
      <View style={styles.brand} />
      <View style={styles.title} />
      <View style={styles.subtitle} />
      {variant === "profile" ? <View style={styles.avatar} /> : null}
      {Array.from({ length: rows }).map((_, index) => <View key={index} style={[styles.card, index === 0 && variant === "detail" && styles.heroCard]} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingTop: 56, gap: 14 },
  brand: { width: 76, height: 12, borderRadius: 6, backgroundColor: darkTheme.surfaceElevated },
  title: { width: "68%", height: 34, borderRadius: 10, backgroundColor: darkTheme.surfaceElevated },
  subtitle: { width: "88%", height: 16, borderRadius: 8, backgroundColor: darkTheme.surface },
  avatar: { width: 112, height: 112, borderRadius: 56, alignSelf: "center", marginVertical: 8, backgroundColor: darkTheme.surfaceElevated },
  card: { height: 96, borderRadius: 16, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface },
  heroCard: { height: 154, borderRadius: 20 },
});
