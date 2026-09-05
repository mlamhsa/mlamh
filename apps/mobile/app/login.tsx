import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { type Href, router, useLocalSearchParams } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";
import { getSafePostLoginPath } from "../../../lib/mobile/post-login-route";

async function resolvePostLoginDestination(nextParam?: string): Promise<Href> {
  const account = await getMobileAccountContext().catch(() => null);
  if (account) {
    const safeNext = getSafePostLoginPath(nextParam, account.type);
    if (safeNext) return safeNext as Href;
  }
  return getAccountHomeHref(account) ?? "/opportunities";
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale);
  const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  async function signIn() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) { setError(isArabic ? "أدخل البريد الإلكتروني وكلمة المرور." : "Enter your email and password."); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError || !data.user) { setError(isArabic ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "The email or password is incorrect."); return; }
      const destination = await resolvePostLoginDestination(nextParam);
      router.replace(destination);
    } catch { setError(isArabic ? "تعذر تسجيل الدخول. تحقق من الاتصال وحاول مرة أخرى." : "Unable to sign in. Check your connection and try again."); }
    finally { setLoading(false); }
  }

  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={[styles.topRow, isRtl && styles.topRowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.iconButton}><Text style={[styles.backIcon, isRtl && styles.backIconRtl]}>‹</Text></Pressable><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
        <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "مرحباً بعودتك" : "Welcome back"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "سجّل الدخول لمتابعة الفرص والطلبات والرسائل." : "Sign in to continue with your opportunities, applications and messages."}</Text></View>
        <View style={styles.form}>
          <Text style={[styles.fieldLabel, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder="name@example.com" placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={[styles.input, { textAlign }]} />
          <Text style={[styles.fieldLabel, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "كلمة المرور" : "Password"}</Text>
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} autoCapitalize="none" autoComplete="current-password" secureTextEntry returnKeyType="done" placeholder="••••••••" placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={[styles.input, { textAlign }]} onSubmitEditing={() => void signIn()} />
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "نسيت كلمة المرور" : "Forgot password"} onPress={() => router.push("/forgot-password")} style={styles.linkButton}><Text style={[styles.forgotLink, { textAlign }]}>{isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}</Text></Pressable>
          {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, isArabic && styles.arabicText, { textAlign }]}>{error}</Text></View> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void signIn()} style={({ pressed }) => [styles.primaryButton, loading && styles.disabled, pressed && styles.pressed]}><Text style={[styles.primaryButtonText, isArabic && styles.arabicText]}>{loading ? (isArabic ? "جارٍ الدخول…" : "Signing in…") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Text></Pressable>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب" : "Create an account"} onPress={() => router.push("/signup")} style={styles.secondaryLinkButton}><Text style={[styles.signupLink, isArabic && styles.arabicText]}>{isArabic ? "جديد في ملامح؟ أنشئ حسابك" : "New to MLAMH? Create your account"}</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: Platform.OS === "ios" ? 22 : 18 }, content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, gap: 26 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, topRowRtl: { flexDirection: "row-reverse" }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginHorizontal: -8 }, backIcon: { color: theme.text, fontSize: 31, lineHeight: 34 }, backIconRtl: { transform: [{ rotate: "180deg" }] }, brand: { color: theme.accent, fontSize: 18, lineHeight: 24, fontWeight: "800", letterSpacing: 1.2 },
  header: { gap: 8 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22, maxWidth: 430 }, form: { gap: 9 }, fieldLabel: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 3 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 11, fontSize: 15, minHeight: 50 }, linkButton: { minHeight: 44, justifyContent: "center" }, forgotLink: { color: theme.accent, fontSize: 11, fontWeight: "700", paddingVertical: 4 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 7 }, primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "800" }, secondaryLinkButton: { minHeight: 48, alignItems: "center", justifyContent: "center" }, signupLink: { color: theme.text, fontSize: 13, textAlign: "center", paddingVertical: 8, fontWeight: "600" }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 }, arabicText: { letterSpacing: 0 },
}); }
