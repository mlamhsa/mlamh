import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function SignupScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signUp() {
    const normalizedEmail = email.trim(); const normalizedName = name.trim();
    if (!normalizedName || !normalizedEmail || password.length < 8) { setError(isArabic ? "أدخل اسمك وبريدك وكلمة مرور من 8 أحرف على الأقل." : "Enter your name, email and a password of at least 8 characters."); return; }
    setLoading(true); setError(null); setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { display_name: normalizedName } } });
      if (authError || !data.user) { setError(isArabic ? "تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى." : "Unable to create your account. Check your details and try again."); return; }
      if (data.session) { router.replace("/onboarding"); return; }
      setMessage(isArabic ? "تم إنشاء الحساب. أكّد بريدك الإلكتروني ثم ارجع إلى التطبيق وسجّل الدخول لإكمال ملفك." : "Account created. Confirm your email, then return to the app and sign in to finish your profile.");
    } catch { setError(isArabic ? "تعذر إنشاء الحساب الآن." : "Unable to create your account right now."); }
    finally { setLoading(false); }
  }

  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={[styles.topRow, isRtl && styles.topRowRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={[styles.backIcon, isRtl && styles.backIconRtl]}>‹</Text></Pressable><Text style={[styles.brand, isArabic && styles.arabicText]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
        <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "أنشئ حساب موهبة" : "Create your talent account"}</Text><Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "ابدأ ملفك المهني وتقدّم على الفرص المناسبة من ملامح." : "Build your professional profile and apply to matching opportunities on MLAMH."}</Text></View>
        <View style={styles.form}>
          <FieldLabel text={isArabic ? "الاسم المهني" : "Professional name"} styles={styles} isArabic={isArabic} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "الاسم المهني" : "Professional name"} autoCapitalize="words" autoComplete="name" returnKeyType="next" placeholder={isArabic ? "اسمك كما تريد أن يظهر" : "Name shown on your profile"} placeholderTextColor={theme.muted} value={name} onChangeText={setName} style={[styles.input, isArabic && styles.arabicText, { textAlign }]} />
          <FieldLabel text={isArabic ? "البريد الإلكتروني" : "Email"} styles={styles} isArabic={isArabic} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder="name@example.com" placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={[styles.input, { textAlign }]} />
          <FieldLabel text={isArabic ? "كلمة المرور" : "Password"} styles={styles} isArabic={isArabic} align={textAlign} />
          <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} accessibilityHint={isArabic ? "ثمانية أحرف على الأقل" : "At least eight characters"} autoCapitalize="none" autoComplete="new-password" secureTextEntry returnKeyType="done" placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} placeholderTextColor={theme.muted} value={password} onChangeText={setPassword} style={[styles.input, isArabic && styles.arabicText, { textAlign }]} onSubmitEditing={() => void signUp()} />
          {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, isArabic && styles.arabicText, { textAlign }]}>{error}</Text></View> : null}
          {message ? <View style={styles.successBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.success, isArabic && styles.arabicText, { textAlign }]}>{message}</Text></View> : null}
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب موهبة" : "Create talent account"} accessibilityState={{ disabled: loading || Boolean(message), busy: loading }} disabled={loading || Boolean(message)} onPress={() => void signUp()} style={({ pressed }) => [styles.primaryButton, (loading || Boolean(message)) && styles.disabled, pressed && styles.pressed]}><Text style={[styles.primaryText, isArabic && styles.arabicText]}>{loading ? (isArabic ? "جارٍ إنشاء الحساب…" : "Creating account…") : (isArabic ? "إنشاء الحساب" : "Create account")}</Text></Pressable>
          <Text style={[styles.freeNote, isArabic && styles.arabicText]}>{isArabic ? "الانضمام والتقديم على الفرص مجاني" : "Free to join and apply to opportunities"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} onPress={() => router.replace("/login")}><Text style={[styles.loginLink, isArabic && styles.arabicText]}>{isArabic ? "لديك حساب؟ تسجيل الدخول" : "Already have an account? Sign in"}</Text></Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function FieldLabel({ text, styles, isArabic, align }: { text: string; styles: ReturnType<typeof createStyles>; isArabic: boolean; align: "left" | "right" }) { return <Text style={[styles.fieldLabel, isArabic && styles.arabicText, { textAlign: align }]}>{text}</Text>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: Platform.OS === "ios" ? 22 : 18 }, content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, gap: 24 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, topRowRtl: { flexDirection: "row-reverse" }, backIcon: { color: theme.text, fontSize: 31, lineHeight: 34 }, backIconRtl: { transform: [{ rotate: "180deg" }] }, brand: { color: theme.accent, fontSize: 18, lineHeight: 24, fontWeight: "800", letterSpacing: 1.2 },
  header: { gap: 8 }, title: { color: theme.text, fontSize: 31, lineHeight: 38, fontWeight: "700" }, subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22, maxWidth: 430 },
  form: { gap: 9 }, fieldLabel: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 3 }, input: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 11, fontSize: 15, minHeight: 50 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, successBox: { borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.chip, borderRadius: 12, padding: 12 }, success: { color: theme.text, fontSize: 13, lineHeight: 20 },
  primaryButton: { backgroundColor: theme.accent, borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 7 }, primaryText: { color: theme.background, fontSize: 15, fontWeight: "800" }, freeNote: { color: theme.muted, fontSize: 11, textAlign: "center", marginTop: 2 }, loginLink: { color: theme.text, textAlign: "center", fontSize: 13, paddingVertical: 8, fontWeight: "600" }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.8 }, arabicText: { letterSpacing: 0 },
}); }
