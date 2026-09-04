import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function SignupScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
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
      setError(isArabic ? "أدخل اسمك وبريدك وكلمة مرور من 8 أحرف على الأقل." : "Enter your name, email and a password of at least 8 characters.");
      return;
    }
    setLoading(true); setError(null); setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { display_name: normalizedName } } });
      if (authError || !data.user) { setError(isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check your details and try again."); return; }
      if (data.session) { router.replace("/onboarding"); return; }
      setMessage(isArabic ? "تم إنشاء الحساب. افتح رسالة التأكيد في بريدك، ثم سجّل الدخول لإكمال ملف الموهبة." : "Account created. Confirm your email, then sign in to finish your talent profile.");
    } catch { setError(isArabic ? "تعذر إنشاء الحساب الآن." : "Unable to create your account right now."); }
    finally { setLoading(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.topRow}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.backIcon}>‹</Text></Pressable><View style={styles.brandMark}><Text style={styles.brandM}>M</Text></View><View style={styles.topSpacer} /></View>
        <View style={styles.header}><Text style={styles.eyebrow}>MLAMH</Text><Text accessibilityRole="header" style={styles.title}>{isArabic ? "ابدأ رحلتك في ملامح" : "Start your MLAMH journey"}</Text><Text style={styles.subtitle}>{isArabic ? "أنشئ حساب موهبة مجاني، ابنِ معرض أعمالك، ثم تقدم على الفرص المناسبة." : "Create a free talent account, build your portfolio, then apply to matching opportunities."}</Text></View>
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{isArabic ? "الاسم المهني" : "Professional name"}</Text>
          <TextInput accessibilityLabel={isArabic ? "الاسم المهني" : "Professional name"} autoCapitalize="words" autoComplete="name" returnKeyType="next" placeholder={isArabic ? "اسمك كما تريد أن يظهر" : "Name shown on your profile"} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={styles.input} />
          <Text style={styles.fieldLabel}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder="name@example.com" placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={styles.input} />
          <Text style={styles.fieldLabel}>{isArabic ? "كلمة المرور" : "Password"}</Text>
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} accessibilityHint={isArabic ? "ثمانية أحرف على الأقل" : "At least eight characters"} autoCapitalize="none" autoComplete="new-password" secureTextEntry returnKeyType="done" placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void signUp()} />
          {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
          {message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.success}>{message}</Text> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب موهبة" : "Create talent account"} accessibilityState={{ disabled: loading || Boolean(message), busy: loading }} disabled={loading || Boolean(message)} onPress={() => void signUp()} style={[styles.primaryButton, (loading || Boolean(message)) && styles.disabled]}><Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : (isArabic ? "إنشاء حساب" : "Create account")}</Text></Pressable>
          <Text style={styles.freeNote}>{isArabic ? "مجاني للانضمام والتقديم على الفرص" : "Free to join and apply to opportunities"}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} onPress={() => router.replace("/login")}><Text style={styles.loginLink}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 22 }, content: { width: "100%", paddingHorizontal: 20, paddingTop: 38, gap: 24 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backIcon: { color: theme.text, fontSize: 32, lineHeight: 34 }, topSpacer: { width: 46 }, brandMark: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }, brandM: { color: theme.accent, fontSize: 25, fontWeight: "900" },
  header: { gap: 8, alignItems: "center" }, eyebrow: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2.4 }, title: { color: theme.text, fontSize: 33, lineHeight: 41, fontWeight: "700", textAlign: "center" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23, textAlign: "center", maxWidth: 360 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 26, backgroundColor: theme.surface, padding: 18, gap: 10 }, fieldLabel: { color: theme.text, fontSize: 12, fontWeight: "800", marginTop: 3 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, color: theme.text, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, minHeight: 50 },
  error: { color: "#C84F4F", fontSize: 13, lineHeight: 20 }, success: { color: theme.accent, fontSize: 13, lineHeight: 21 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 16, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 6 }, primaryText: { color: "#2E2E2E", fontSize: 15, fontWeight: "900" }, freeNote: { color: theme.muted, fontSize: 11, textAlign: "center" }, loginLink: { color: theme.muted, textAlign: "center", fontSize: 13, paddingVertical: 12, fontWeight: "600" }, disabled: { opacity: 0.5 }
}); }
