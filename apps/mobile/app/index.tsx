import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { copy, getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function WelcomeScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const text = copy[locale];
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session) { setChecking(false); return; }
      const account = await getMobileAccountContext();
      if (!active) return;
      if (account?.type === "publisher") { router.replace("/publisher"); return; }
      if (account?.type === "talent") { router.replace("/opportunities"); return; }
      setChecking(false);
    })();
    return () => { active = false; };
  }, []);

  if (checking) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text style={styles.brand}>{text.brand}</Text>
        <Text style={styles.headline}>{text.headline}</Text>
        <Text style={styles.subheadline}>{text.subheadline}</Text>
        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/opportunities")}><Text style={styles.primaryButtonText}>{text.discover}</Text></Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push("/login")}><Text style={styles.secondaryButtonText}>{text.signIn}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background, justifyContent: "flex-end" }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 28, paddingBottom: 54, gap: 18 }, brand: { color: theme.accent, fontSize: 18, letterSpacing: 2, fontWeight: "600" }, headline: { color: theme.text, fontSize: 42, lineHeight: 50, fontWeight: "300" }, subheadline: { color: theme.muted, fontSize: 17, lineHeight: 28, maxWidth: 420 }, actions: { gap: 12, marginTop: 18 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" }, primaryButtonText: { color: "#181818", fontSize: 16, fontWeight: "600" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, paddingVertical: 16, alignItems: "center" }, secondaryButtonText: { color: theme.text, fontSize: 16, fontWeight: "500" } }); }
