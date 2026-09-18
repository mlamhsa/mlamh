import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { LockKeyhole, Mail } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { signInWithNativeApple } from "@/src/native/apple-auth";
import { signInWithNativeGoogle } from "@/src/native/google-auth";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    if (Platform.OS !== "ios") return () => { active = false; };
    void AppleAuthentication.isAvailableAsync()
      .then((available) => { if (active) setAppleAvailable(available); })
      .catch(() => { if (active) setAppleAvailable(false); });
    return () => { active = false; };
  }, []);

  async function finishSignIn() {
    await session.refresh();
    router.replace("/" as never);
  }

  async function handleEmailSignIn() {
    if (submitting || appleSubmitting || googleSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert(
        isArabic ? "بيانات ناقصة" : "Missing details",
        isArabic ? "أدخل البريد الإلكتروني وكلمة المرور." : "Enter your email and password.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        Alert.alert(
          isArabic ? "تعذر تسجيل الدخول" : "Unable to sign in",
          isArabic
            ? "تحقق من البريد الإلكتروني وكلمة المرور ثم حاول مرة أخرى."
            : "Check your email and password, then try again.",
        );
        return;
      }
      await finishSignIn();
    } catch {
      Alert.alert(
        isArabic ? "تعذر الاتصال" : "Connection error",
        isArabic ? "تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى." : "Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (submitting || appleSubmitting || googleSubmitting) return;
    setGoogleSubmitting(true);
    try {
      const result = await signInWithNativeGoogle();
      if (!result.ok) {
        if (!result.canceled) {
          Alert.alert(
            isArabic ? "تعذر تسجيل الدخول عبر Google" : "Google sign-in failed",
            isArabic ? "حاول مرة أخرى بعد قليل." : "Please try again in a moment.",
          );
        }
        return;
      }
      await finishSignIn();
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleAppleSignIn() {
    if (submitting || appleSubmitting || googleSubmitting) return;
    setAppleSubmitting(true);
    try {
      const result = await signInWithNativeApple();
      if (!result.ok) {
        if (!result.canceled) {
          Alert.alert(
            isArabic ? "تعذر تسجيل الدخول عبر Apple" : "Apple sign-in failed",
            isArabic ? "حاول مرة أخرى بعد قليل." : "Please try again in a moment.",
          );
        }
        return;
      }
      await finishSignIn();
    } finally {
      setAppleSubmitting(false);
    }
  }

  const disabled = submitting || appleSubmitting || googleSubmitting;

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, isArabic && styles.backButtonRtl, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text>
          </Pressable>

          <Text style={[styles.brand, { textAlign: align }]}>MLAMH</Text>
          <Text style={[styles.title, { textAlign: align }]}>
            {isArabic ? "مرحبًا بعودتك" : "Welcome back"}
          </Text>
          <Text style={[styles.subtitle, { textAlign: align }]}>
            {isArabic
              ? "سجّل الدخول للوصول إلى حسابك ولوحة التحكم الخاصة بك."
              : "Sign in to access your account and dashboard."}
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputShell, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <Mail size={18} color={colors.gold} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder={isArabic ? "البريد الإلكتروني" : "Email"}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}
              />
            </View>

            <View style={[styles.inputShell, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <LockKeyhole size={18} color={colors.gold} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType="password"
                placeholder={isArabic ? "كلمة المرور" : "Password"}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}
                onSubmitEditing={() => void handleEmailSignIn()}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/forgot-password?email=${encodeURIComponent(email.trim().toLowerCase())}` as never)}
              style={styles.forgotButton}
            >
              <Text style={[styles.forgotText, { textAlign: align }]}>{isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => void handleEmailSignIn()}
              style={({ pressed }) => [
                styles.primaryButton,
                disabled && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryText}>
                {submitting
                  ? isArabic
                    ? "جارٍ تسجيل الدخول…"
                    : "Signing in…"
                  : isArabic
                    ? "دخول"
                    : "Sign in"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.socialBlock}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>{isArabic ? "أو" : "OR"}</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => void handleGoogleSignIn()}
              style={({ pressed }) => [styles.googleButton, disabled && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.googleText}>
                {googleSubmitting
                  ? isArabic ? "جارٍ فتح Google…" : "Opening Google…"
                  : isArabic ? "المتابعة باستخدام Google" : "Continue with Google"}
              </Text>
            </Pressable>

            {Platform.OS === "ios" ? (
              appleAvailable ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={14}
                  style={[styles.appleButton, disabled && styles.disabled]}
                  onPress={() => void handleAppleSignIn()}
                />
              ) : (
                <View style={[styles.appleFallback, styles.disabledPreview]}>
                  <Text style={styles.appleMark}></Text>
                  <Text style={styles.appleFallbackText}>
                    {isArabic ? "المتابعة باستخدام Apple" : "Continue with Apple"}
                  </Text>
                </View>
              )
            ) : null}

            {appleSubmitting ? (
              <Text style={styles.appleLoading}>
                {isArabic ? "جارٍ تأكيد Apple…" : "Confirming with Apple…"}
              </Text>
            ) : null}
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push("/account-type" as never)} style={styles.joinRow}>
            <Text style={[styles.note, { textAlign: "center" }]}>
              {isArabic ? "ليس لديك حساب؟ انضم إلى ملامح" : "New to MLAMH? Join now"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xxxl,
  },
  backButtonRtl: { alignSelf: "flex-end" },
  rowRtl: { flexDirection: "row-reverse" },
  rowLtr: { flexDirection: "row" },
  backText: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  brand: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 4,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  form: { gap: spacing.md, marginTop: spacing.xxxl },
  rowReverse: { flexDirection: "row-reverse" },
  forgotButton: { alignSelf: "stretch", minHeight: 30, justifyContent: "center" },
  forgotText: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  joinRow: { marginTop: spacing.xl, alignItems: "center" },
  inputShell: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
  primaryText: { color: colors.background, fontSize: 15, fontWeight: "900" },
  socialBlock: { marginTop: spacing.xl, gap: spacing.md },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  googleButton: { width: "100%", height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md, borderRadius: 14, backgroundColor: "#FFFFFF" },
  googleMark: { color: "#111111", fontSize: 19, fontWeight: "800" },
  googleText: { color: "#111111", fontSize: 14, fontWeight: "700" },
  appleButton: { width: "100%", height: 54 },
  appleFallback: { width: "100%", height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: 14, backgroundColor: "#FFFFFF" },
  appleMark: { color: "#000000", fontSize: 21, fontWeight: "700" },
  appleFallbackText: { color: "#000000", fontSize: 14, fontWeight: "700" },
  disabledPreview: { opacity: 0.92 },
  appleLoading: { color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: spacing.sm },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: spacing.xl },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.84 },
});
