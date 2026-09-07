import { useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Href, router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getSafePostLoginPath } from "@/lib/post-login-route";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");

async function resolvePostLoginDestination(nextParam?: string): Promise<Href> {
  const account = await getMobileAccountContext().catch(() => null);
  if (account) {
    const safeNext = getSafePostLoginPath(nextParam, account.type);
    if (safeNext) return safeNext as Href;
  }
  return getAccountHomeHref(account) ?? "/opportunities";
}

function getCredentialError(isArabic: boolean, error: { code?: string; message?: string } | null) {
  const code = error?.code?.toLowerCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";
  if (code.includes("email_not_confirmed") || message.includes("email not confirmed")) {
    return isArabic ? "يجب تأكيد بريدك الإلكتروني قبل تسجيل الدخول." : "Confirm your email address before signing in.";
  }
  return isArabic
    ? "تعذر تسجيل الدخول بهذه البيانات. إذا أنشأت حسابك باستخدام Google فاختر «المتابعة باستخدام Google». وإلا تحقق من البريد وكلمة المرور."
    : "We could not sign you in with those credentials. If you created your account with Google, use Continue with Google. Otherwise, check your email and password.";
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError(isArabic ? "أدخل البريد الإلكتروني وكلمة المرور." : "Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (authError || !data.user) {
        setError(getCredentialError(isArabic, authError));
        return;
      }
      router.replace(await resolvePostLoginDestination(nextParam));
    } catch {
      setError(isArabic ? "تعذر تسجيل الدخول. تحقق من الاتصال وحاول مرة أخرى." : "Unable to sign in. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const redirectTo = "mlamh://auth/callback";
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (oauthError || !data.url) {
        setError(isArabic ? "تعذر بدء تسجيل الدخول باستخدام Google." : "Unable to start Google sign-in.");
        return;
      }
      await Linking.openURL(data.url);
    } catch {
      setError(isArabic ? "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى." : "Unable to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const textAlign = isRtl ? "right" : "left";
  const brandSource = isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN;
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={[styles.topRow, compact && styles.topRowCompact, isRtl && styles.topRowRtl]}>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
              {isRtl ? <ArrowRight size={22} color={theme.text} strokeWidth={1.8} /> : <ArrowLeft size={22} color={theme.text} strokeWidth={1.8} />}
            </Pressable>
            <View style={styles.brandLockup}><Image source={brandSource} resizeMode="contain" style={[styles.brandLogo, compact && styles.brandLogoCompact]} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "English" : "العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={styles.languageButton}><Text style={[styles.languageButtonText, isArabic && styles.arabicText]}>{isArabic ? "EN" : "العربية"}</Text></Pressable>
          </View>

          <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
            <Text style={[styles.eyebrow, isArabic && styles.arabicEyebrow, { textAlign }]}>{isArabic ? "مرحبًا بعودتك" : "WELCOME BACK"}</Text>
            <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "تسجيل الدخول إلى ملامح" : "Sign in to MLAMH"}</Text>
            <Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "تابع فرصك وطلباتك ورسائلك من مكان واحد." : "Continue to your opportunities, applications and messages."}</Text>
          </View>

          <View style={[styles.formCard, compact && styles.formCardCompact]}>
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
              <View style={[styles.inputShell, isRtl && styles.rowRtl]}>
                <Mail size={18} color={theme.muted} strokeWidth={1.8} />
                <TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" returnKeyType="next" placeholder="name@example.com" placeholderTextColor={theme.muted} value={email} onChangeText={setEmail} style={[styles.input, { textAlign: "left", writingDirection: "ltr" }]} />
              </View>
            </View>
            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "كلمة المرور" : "Password"}</Text>
              <View style={[styles.inputShell, isRtl && styles.rowRtl]}>
                <LockKeyhole size={18} color={theme.muted} strokeWidth={1.8} />
                <TextInput accessibilityLabel={isArabic ? "كلمة المرور" : "Password"} autoCapitalize="none" autoComplete="current-password" secureTextEntry={!showPassword} returnKeyType="done" value={password} onChangeText={setPassword} style={[styles.input, { textAlign: isRtl ? "right" : "left", writingDirection: isRtl ? "rtl" : "ltr" }]} onSubmitEditing={() => void signIn()} />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? (isArabic ? "إخفاء كلمة المرور" : "Hide password") : (isArabic ? "إظهار كلمة المرور" : "Show password")} onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                  {showPassword ? <EyeOff size={18} color={theme.muted} strokeWidth={1.8} /> : <Eye size={18} color={theme.muted} strokeWidth={1.8} />}
                </Pressable>
              </View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "نسيت كلمة المرور" : "Forgot password"} onPress={() => router.push("/forgot-password")} style={[styles.linkButton, isRtl && styles.linkButtonRtl]}><Text style={[styles.forgotLink, isArabic && styles.arabicText, { textAlign }]}>{isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}</Text></Pressable>
            {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, isArabic && styles.arabicText, { textAlign }]}>{error}</Text></View> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "تسجيل الدخول" : "Sign in"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void signIn()} style={({ pressed }) => [styles.primaryButton, loading && styles.disabled, pressed && styles.pressed]}><Text style={[styles.primaryButtonText, isArabic && styles.arabicText]}>{loading ? (isArabic ? "جارٍ الدخول…" : "Signing in…") : (isArabic ? "تسجيل الدخول" : "Sign in")}</Text></Pressable>
          </View>

          <View style={styles.dividerRow}><View style={styles.dividerLine}/><Text style={[styles.dividerText, isArabic && styles.arabicText]}>{isArabic ? "أو" : "OR"}</Text><View style={styles.dividerLine}/></View>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "المتابعة باستخدام Google" : "Continue with Google"} disabled={loading} onPress={() => void signInWithGoogle()} style={({ pressed }) => [styles.googleButton, loading && styles.disabled, pressed && styles.pressed]}><Text style={[styles.googleButtonText, isArabic && styles.arabicText]}>{isArabic ? "المتابعة باستخدام Google" : "Continue with Google"}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إنشاء حساب" : "Create an account"} onPress={() => router.push("/signup")} style={styles.secondaryButton}><Text style={[styles.signupLink, isArabic && styles.arabicText]}>{isArabic ? "إنشاء حساب جديد" : "Create a new account"}</Text></Pressable>
          <Text style={[styles.footnote, isArabic && styles.arabicFootnote]}>{isArabic ? "موهبة حقيقية. فرص أكثر." : "REAL TALENT. MORE OPPORTUNITIES."}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 12 },
  scrollContentCompact: { justifyContent: "flex-start", paddingVertical: 6 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: 22, paddingTop: 4, paddingBottom: 30, gap: 18 },
  contentCompact: { paddingHorizontal: 15, gap: 14, paddingBottom: 18 },
  topRow: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topRowCompact: { minHeight: 58 },
  topRowRtl: { flexDirection: "row-reverse" },
  rowRtl: { flexDirection: "row-reverse" },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
  languageButton: { minWidth: 42, height: 42, paddingHorizontal: 10, borderRadius: 21, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface },
  languageButtonText: { color: theme.accent, fontSize: 11, fontWeight: "800" },
  brandLockup: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  brandLogo: { width: 132, height: 52 },
  brandLogoCompact: { width: 112, height: 44 },
  header: { gap: 7 },
  eyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2.6 },
  arabicEyebrow: { letterSpacing: 0, writingDirection: "rtl" },
  title: { color: theme.text, fontSize: 34, lineHeight: 41, fontWeight: "500", letterSpacing: -0.5 },
  titleCompact: { fontSize: 29, lineHeight: 35 },
  subtitle: { color: theme.muted, fontSize: 14, lineHeight: 22, maxWidth: 430 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface, padding: 16, gap: 13 },
  formCardCompact: { padding: 13, gap: 11 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: theme.text, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  inputShell: { minHeight: 54, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.background, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 12 },
  linkButton: { minHeight: 38, justifyContent: "center", alignSelf: "flex-start" },
  linkButtonRtl: { alignSelf: "flex-end" },
  forgotLink: { color: theme.accent, fontSize: 11, fontWeight: "700" },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 },
  error: { color: "#E59A9A", fontSize: 13, lineHeight: 20 },
  primaryButton: { backgroundColor: theme.accent, minHeight: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "900", textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { color: theme.muted, fontSize: 10, fontWeight: "800" },
  googleButton: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface, paddingHorizontal: 18 },
  googleButtonText: { color: theme.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  secondaryButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  signupLink: { color: theme.accent, fontSize: 12, fontWeight: "800", textAlign: "center" },
  footnote: { color: "#6F6F69", fontSize: 9, fontWeight: "800", letterSpacing: 2, textAlign: "center", paddingTop: 4 },
  arabicFootnote: { letterSpacing: 0, writingDirection: "rtl" },
  arabicText: { letterSpacing: 0, writingDirection: "rtl" },
  disabled: { opacity: .45 },
  pressed: { opacity: .82 },
}); }
