import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
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

  async function signUp() {
    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    if (!normalizedName || !normalizedEmail || password.length < 8) {
      setError(locale === "ar" ? "أدخل اسمك وبريدك وكلمة مرور من 8 أحرف على الأقل." : "Enter your name, email and a password of at least 8 characters.");
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
        setError(locale === "ar" ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check your details and try again.");
        return;
      }
      if (data.session) {
        router.replace("/onboarding");
        return;
      }
      setMessage(locale === "ar" ? "تم إنشاء الحساب. افتح رسالة التأكيد في بريدك، ثم سجّل الدخول لإكمال ملف الموهبة." : "Account created. Confirm your email, then sign in to finish your talent profile.");
    } catch {
      setError(locale === "ar" ? "تعذر إنشاء الحساب الآن." : "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
    <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
    <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text style={styles.title}>{locale === "ar" ? "أنشئ ملف موهبتك" : "Create your talent account"}</Text><Text style={styles.subtitle}>{locale === "ar" ? "ابدأ بحساب مجاني، ثم ابنِ ملفك وتقدم على الفرص المناسبة." : "Start free, build your portfolio and apply to matching opportunities."}</Text></View>
    <View style={styles.form}>
      <TextInput autoCapitalize="words" autoComplete="name" placeholder={locale === "ar" ? "الاسم المهني" : "Professional name"} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={styles.input} />
      <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder={locale === "ar" ? "البريد الإلكتروني" : "Email"} placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput autoCapitalize="none" autoComplete="new-password" secureTextEntry placeholder={locale === "ar" ? "كلمة المرور — 8 أحرف على الأقل" : "Password — at least 8 characters"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void signUp()} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Pressable disabled={loading || Boolean(message)} onPress={() => void signUp()} style={[styles.primaryButton, (loading || Boolean(message)) && styles.disabled]}><Text style={styles.primaryText}>{loading ? (locale === "ar" ? "جارٍ إنشاء الحساب…" : "Creating account…") : (locale === "ar" ? "إنشاء حساب موهبة" : "Create talent account")}</Text></Pressable>
      <Pressable onPress={() => router.replace("/login")}><Text style={styles.loginLink}>{locale === "ar" ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
    </View>
  </View></KeyboardAvoidingView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, content: { flex: 1, paddingHorizontal: 24, paddingTop: 64, justifyContent: "center", gap: 30 }, back: { color: theme.accent, fontSize: 14, fontWeight: "600", position: "absolute", top: -52 }, header: { gap: 10 }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 2.2 }, title: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" }, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 24 }, form: { gap: 13 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 20 }, success: { color: theme.accent, fontSize: 13, lineHeight: 21 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 4 }, primaryText: { color: "#181818", fontSize: 15, fontWeight: "800" }, loginLink: { color: theme.muted, textAlign: "center", fontSize: 13, paddingVertical: 8 }, disabled: { opacity: 0.5 },
}); }
