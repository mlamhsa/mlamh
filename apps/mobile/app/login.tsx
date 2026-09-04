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
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isArabic = locale === "ar";

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
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
        <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "مرحباً بعودتك" : "Welcome back"}</Text><Text style={styles.subtitle}>{isArabic ? "سجّل الدخول للمتابعة من حسابك في ملامح." : "Sign in to continue with your MLAMH account."}</Text></View>
        <View style={styles.form}>
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder={isArabic ? "البريد الإلكتروني" : "Email"} placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} autoCapitalize="none" autoComplete="current-password" secureTextEntry returnKeyType="done" placeholder={isArabic ? "كلمة المرور" : "Password"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void signIn()} />
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void signIn()} style={({ pressed }) => [styles.primaryButton, (pressed || loading) && styles.buttonPressed]}><Text style={styles.primaryButtonText}>{loading ? (isArabic ? "جارٍ الدخول..." : "Signing in...") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب موهبة" : "Create a talent account"} onPress={() => router.push("/signup")}><Text style={styles.signupLink}>{isArabic ? "جديد في ملامح؟ أنشئ حساب موهبة" : "New to MLAMH? Create a talent account"}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 }, content: { width: "100%", paddingHorizontal: 24, paddingTop: 44, gap: 34 }, back: { color: theme.accent, fontSize: 14, fontWeight: "600", paddingVertical: 8, alignSelf: "flex-start" }, header: { gap: 10 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "700", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 }, form: { gap: 14 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, minHeight: 52 }, error: { color: "#C84F4F", fontSize: 14, lineHeight: 20 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 4 }, primaryButtonText: { color: "#181818", fontSize: 16, fontWeight: "700" }, buttonPressed: { opacity: 0.72 }, signupLink: { color: theme.muted, fontSize: 13, textAlign: "center", paddingVertical: 12 } }); }
