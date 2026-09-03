import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router } from "expo-router";
import type { User } from "@supabase/supabase-js";

import { AppTabBar } from "@/components/AppTabBar";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function ProfileScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.replace("/");
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text style={styles.eyebrow}>MLAMH</Text>
        <Text style={styles.title}>{locale === "ar" ? "ملفي" : "Profile"}</Text>
        {user ? (
          <>
            <View style={styles.identityCard}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(user.email?.[0] ?? "M").toUpperCase()}</Text></View>
              <View style={styles.identityText}>
                <Text style={styles.identityTitle}>{locale === "ar" ? "حساب الموهبة" : "Talent account"}</Text>
                <Text style={styles.email}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.portfolioCard}>
              <Text style={styles.sectionTitle}>{locale === "ar" ? "مساحة ملف الموهبة" : "Talent portfolio"}</Text>
              <Text style={styles.body}>{locale === "ar" ? "هذه هي نقطة الانطلاق لملفك الاحترافي: الصور، النبذة، المهارات، الأسواق والتوفر ستُربط هنا بالبيانات الحالية للمنصة." : "This is the foundation for your professional portfolio: media, bio, skills, work markets and availability will connect here to the platform data."}</Text>
            </View>
            <Pressable style={styles.secondaryButton} disabled={signingOut} onPress={() => void signOut()}>
              <Text style={styles.secondaryButtonText}>{signingOut ? (locale === "ar" ? "جارٍ تسجيل الخروج…" : "Signing out…") : (locale === "ar" ? "تسجيل الخروج" : "Sign out")}</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.portfolioCard}>
            <Text style={styles.sectionTitle}>{locale === "ar" ? "سجّل الدخول لإدارة ملفك" : "Sign in to manage your profile"}</Text>
            <Text style={styles.body}>{locale === "ar" ? "تابع طلباتك، المحادثات والتنبيهات من حساب واحد." : "Keep applications, conversations and alerts connected to one account."}</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push({ pathname: "/login", params: { next: "/profile" } })}>
              <Text style={styles.primaryButtonText}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</Text>
            </Pressable>
          </View>
        )}
      </View>
      <AppTabBar active="profile" locale={locale} theme={theme} />
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 64, gap: 16 },
    eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 2.2 },
    title: { color: theme.text, fontSize: 38, fontWeight: "300", marginBottom: 6 },
    identityCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface },
    avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#181818", fontSize: 22, fontWeight: "700" },
    identityText: { flex: 1, gap: 4 },
    identityTitle: { color: theme.text, fontSize: 17, fontWeight: "600" },
    email: { color: theme.muted, fontSize: 13 },
    portfolioCard: { gap: 12, padding: 20, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface },
    sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "500" },
    body: { color: theme.muted, fontSize: 14, lineHeight: 23 },
    primaryButton: { marginTop: 6, backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
    primaryButtonText: { color: "#181818", fontSize: 14, fontWeight: "700" },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
    secondaryButtonText: { color: theme.text, fontSize: 14, fontWeight: "600" },
  });
}
