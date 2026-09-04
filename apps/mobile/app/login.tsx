import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { type Href, router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) { setError(isArabic ? "أدخل البريد الإلكتروني وكلمة المرور." : "Enter your email and password."); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError || !data.user) { setError(isArabic ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "The email or password is incorrect."); return; }
      const safeNext = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
      router.replace(safeNext as Href);
    } catch { setError(isArabic ? "تعذر تسجيل الدخول. حاول مرة أخرى." : "Unable to sign in. Please try again."); }
    finally { setLoading(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.topRow}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.backIcon}>‹</Text></Pressable><View style={styles.brandMark}><Text style={styles.brandM}>M</Text></View><View style={styles.topSpacer} /></View>
        <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "مرحباً بعودتك" : "Welcome back"}</Text><Text style={styles.subtitle}>{isArabic ? "ادخل إلى حسابك وتابع الفرص والطلبات والرسائل من مكان واحد." : "Sign in to continue with opportunities, applications and messages in one place."}</Text></View>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder={isArabic ? "name@example.com" : "name@example.com"} placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={styles.input} />
          <Text style={styles.fieldLabel}>{isArabic ? "كلمة المرور" : "Password"}</Text>
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} autoCapitalize="none" autoComplete="current-password" secureTextEntry returnKeyType="done" placeholder="••••••••" placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void signIn()} />
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void signIn()} style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.buttonPressed]}><Text style={styles.primaryButtonText}>{loading ? (isArabic ? "جارٍ الدخول..." : "Signing in...") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب موهبة" : "Create a talent account"} onPress={() => router.push("/signup")}><Text style={styles.signupLink}>{isArabic ? "جديد في ملامح؟ أنشئ حسابك" : "New to MLAMH? Create your account"}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 22 }, content: { width: "100%", paddingHorizontal: 20, paddingTop: 38, gap: 26 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backIcon: { color: theme.text, fontSize: 32, lineHeight: 34 }, topSpacer: { width: 46 }, brandMark: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }, brandM: { color: theme.accent, fontSize: 25, fontWeight: "900" },
  header: { gap: 8, alignItems: "center" }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2.4 }, title: { color: theme.text, fontSize: 34, lineHeight: 42, fontWeight: "700", textAlign: "center" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23, textAlign: "center", maxWidth: 360 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface, padding: 18, gap: 10 }, fieldLabel: { color: theme.text, fontSize: 12, fontWeight: "800", marginTop: 3 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, minHeight: 50 },
  error: { color: "#C84F4F", fontSize: 13, lineHeight: 20 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 16, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 6 }, primaryButtonText: { color: "#2E2E2E", fontSize: 15, fontWeight: "900" }, buttonPressed: { opacity: 0.7 }, signupLink: { color: theme.muted, fontSize: 13, textAlign: "center", paddingVertical: 12, fontWeight: "600" }
}); }
