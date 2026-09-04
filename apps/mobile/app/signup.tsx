import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function SignupScreen() {
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isArabic = locale === "ar";

  async function signUp() {
    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    if (!normalizedName || !normalizedEmail || password.length < 8) {
      setError(isArabic ? "أدخل اسمك وبريدك وكلمة مرور من 8 أحرف على الأقل." : "Enter your name, email and a password of at least 8 characters.");
      return;
    }
    setLoading(true); setError(null); setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { display_name: normalizedName } },
      });
      if (authError || !data.user) {
        setError(isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check your details and try again.");
        return;
      }
      if (data.session) {
        router.replace("/onboarding");
        return;
      }
      setMessage(isArabic ? "تم إنشاء الحساب. افتح رسالة التأكيد في بريدك، ثم سجّل الدخول لإكمال ملف الموهبة." : "Account created. Confirm your email, then sign in to finish your talent profile.");
    } catch {
      setError(isArabic ? "تعذر إنشاء الحساب الآن." : "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable>
        <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "أنشئ ملف موهبتك" : "Create your talent account"}</Text><Text style={styles.subtitle}>{isArabic ? "ابدأ بحساب مجاني، ثم ابنِ ملفك وتقدم على الفرص المناسبة." : "Start free, build your portfolio and apply to matching opportunities."}</Text></View>
        <View style={styles.form}>
          <TextInput accessibilityLabel={isArabic ? "الاسم المهني" : "Professional name"} autoCapitalize="words" autoComplete="name" returnKeyType="next" placeholder={isArabic ? "الاسم المهني" : "Professional name"} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={styles.input} />
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder={isArabic ? "البريد الإلكتروني" : "Email"} placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} accessibilityHint={isArabic ? "ثمانية أحرف على الأقل" : "At least eight characters"} autoCapitalize="none" autoComplete="new-password" secureTextEntry returnKeyType="done" placeholder={isArabic ? "كلمة المرور — 8 أحرف على الأقل" : "Password — at least 8 characters"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void signUp()} />
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          {message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب موهبة" : "Create talent account"} accessibilityState={{ disabled: loading || Boolean(message), busy: loading }} disabled={loading || Boolean(message)} onPress={() => void signUp()} style={[styles.primaryButton, (loading || Boolean(message)) && styles.disabled]}><Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : (isArabic ? "إنشاء حساب موهبة" : "Create talent account")}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} onPress={() => router.replace("/login")}><Text style={styles.loginLink}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 }, content: { width: "100%", paddingHorizontal: 24, paddingTop: 44, gap: 30 }, back: { color: theme.accent, fontSize: 14, fontWeight: "600", paddingVertical: 8, alignSelf: "flex-start" }, header: { gap: 10 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 }, form: { gap: 13 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, minHeight: 52 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, success: { color: theme.accent, fontSize: 13, lineHeight: 21 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 4 }, primaryText: { color: "#181818", fontSize: 15, fontWeight: "800" }, loginLink: { color: theme.muted, textAlign: "center", fontSize: 13, paddingVertical: 12 }, disabled: { opacity: 0.5 },
}); }
