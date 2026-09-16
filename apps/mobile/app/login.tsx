import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { LockKeyhole, Mail } from "lucide-react-native";
import { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { signInWithNativeApple } from "@/src/native/apple-auth";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function LoginScreen() {
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);

  async function finishSignIn() {
    router.replace("/" as never);
  }

  async function handleEmailSignIn() {
    if (submitting || appleSubmitting) return;
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

  async function handleAppleSignIn() {
    if (submitting || appleSubmitting) return;
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

  const disabled = submitting || appleSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
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
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text>
          </Pressable>

          <Text style={styles.brand}>MLAMH</Text>
          <Text style={[styles.title, { textAlign: align }]}>
            {isArabic ? "تسجيل الدخول" : "Sign in"}
          </Text>
          <Text style={[styles.subtitle, { textAlign: align }]}>
            {isArabic
              ? "ادخل إلى حسابك في ملامح وتابع ملفك وفرصك ورسائلك."
              : "Access your MLAMH account, profile, opportunities and messages."}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputShell}>
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
                style={[styles.input, { textAlign: align }]}
              />
            </View>

            <View style={styles.inputShell}>
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
                style={[styles.input, { textAlign: align }]}
                onSubmitEditing={() => void handleEmailSignIn()}
              />
            </View>

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

          {Platform.OS === "ios" ? (
            <View style={styles.appleBlock}>
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{isArabic ? "أو" : "OR"}</Text>
                <View style={styles.divider} />
              </View>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={14}
                style={[styles.appleButton, disabled && styles.disabled]}
                onPress={() => void handleAppleSignIn()}
              />
              {appleSubmitting ? (
                <Text style={styles.appleLoading}>
                  {isArabic ? "جارٍ تأكيد Apple…" : "Confirming with Apple…"}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.note, { textAlign: align }]}>
            {isArabic
              ? "هذه النسخة التجريبية تستخدم حساب ملامح الحالي. إنشاء حساب جديد سيُستكمل ضمن رحلة التسجيل المعتمدة."
              : "This test build uses your existing MLAMH account. New-account onboarding will follow the approved registration flow."}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  appleBlock: { marginTop: spacing.xl },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  appleButton: { width: "100%", height: 54 },
  appleLoading: { color: colors.textMuted, fontSize: 11, textAlign: "center", marginTop: spacing.sm },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: spacing.xl },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.84 },
});
