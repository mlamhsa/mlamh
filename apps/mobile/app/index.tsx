import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { copy, getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function WelcomeScreen() {
  const locale = getDeviceLocale();
  const isDark = useColorScheme() === "dark";
  const theme = isDark ? darkTheme : lightTheme;
  const text = copy[locale];
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text style={styles.brand}>{text.brand}</Text>
        <Text style={styles.headline}>{text.headline}</Text>
        <Text style={styles.subheadline}>{text.subheadline}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/opportunities")}>
            <Text style={styles.primaryButtonText}>{text.discover}</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/login")}>
            <Text style={styles.secondaryButtonText}>{text.signIn}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background, justifyContent: "flex-end" },
    content: { paddingHorizontal: 28, paddingBottom: 54, gap: 18 },
    brand: { color: theme.accent, fontSize: 18, letterSpacing: 2, fontWeight: "600" },
    headline: { color: theme.text, fontSize: 42, lineHeight: 50, fontWeight: "300" },
    subheadline: { color: theme.muted, fontSize: 17, lineHeight: 28, maxWidth: 420 },
    actions: { gap: 12, marginTop: 18 },
    primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" },
    primaryButtonText: { color: "#181818", fontSize: 16, fontWeight: "600" },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, paddingVertical: 16, alignItems: "center" },
    secondaryButtonText: { color: theme.text, fontSize: 16, fontWeight: "500" },
  });
}
