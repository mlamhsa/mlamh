import { router, useLocalSearchParams } from "expo-router";
import { Mail, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const initialEmail = paramValue(params.email).trim().toLowerCase();
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError(isArabic ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
      return;
    }
    setLoading(true); setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: "mlamh://reset-password",
      });
      if (resetError) {
        setError(isArabic ? "تعذر إرسال رابط إعادة التعيين. حاول مرة أخرى." : "Unable to send the reset link. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError(isArabic ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.icon}><Sparkles size={22} color={colors.gold} /></View>
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "استعادة الحساب" : "ACCOUNT RECOVERY"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password"}</Text>
        <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "أدخل بريدك الإلكتروني وسنرسل لك رابطًا آمنًا لتعيين كلمة مرور جديدة." : "Enter your email and we'll send you a secure link to set a new password."}</Text>

        <View style={styles.card}>
          {sent ? (
            <View style={styles.sentBox}>
              <Mail size={24} color={colors.gold} />
              <Text style={styles.sentTitle}>{isArabic ? "تحقق من بريدك الإلكتروني" : "Check your email"}</Text>
              <Text style={[styles.sentText, { writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "إذا كان البريد مرتبطًا بحساب ملامح، ستصلك رسالة تحتوي على رابط آمن لإعادة تعيين كلمة المرور. تحقق أيضًا من Spam / Junk." : "If this email is linked to a MLAMH account, you'll receive a secure password reset link. Also check Spam / Junk."}</Text>
              <Pressable onPress={() => setSent(false)} style={styles.secondary}><Text style={styles.secondaryText}>{isArabic ? "إرسال رابط آخر" : "Send another link"}</Text></Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.inputShell, isArabic && styles.rowReverse]}>
                <Mail size={18} color={colors.gold} />
                <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder={isArabic ? "البريد الإلكتروني" : "Email"} placeholderTextColor={colors.textMuted} style={styles.emailInput} onSubmitEditing={() => void submit()} />
              </View>
              {error ? <Text style={[styles.error, { textAlign: align }]}>{error}</Text> : null}
              <Pressable disabled={loading} onPress={() => void submit()} style={({ pressed }) => [styles.primary, loading && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : (isArabic ? "إرسال رابط إعادة التعيين" : "Send reset link")}</Text></Pressable>
            </>
          )}
          <Pressable onPress={() => router.replace("/login" as never)} style={styles.back}><Text style={styles.backText}>{isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  icon: { width: 52, height: 52, alignItems: "center", justifyContent: "center", alignSelf: "center", borderRadius: 18, borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.08)", marginBottom: spacing.lg },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 38, fontWeight: "700", marginTop: spacing.sm },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  card: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg },
  rowReverse: { flexDirection: "row-reverse" },
  inputShell: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.28)", paddingHorizontal: spacing.lg },
  emailInput: { flex: 1, color: colors.textPrimary, fontSize: 14, textAlign: "left", writingDirection: "ltr" },
  error: { color: "#FCA5A5", fontSize: 12, lineHeight: 20, borderWidth: 1, borderColor: "rgba(248,113,113,0.24)", backgroundColor: "rgba(248,113,113,0.08)", borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  primary: { minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, borderRadius: radius.lg, marginTop: spacing.lg },
  primaryText: { color: "#080808", fontSize: 14, fontWeight: "800" },
  sentBox: { alignItems: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.18)", backgroundColor: "rgba(201,169,98,0.05)", borderRadius: radius.lg, padding: spacing.lg },
  sentTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "700", marginTop: spacing.md, textAlign: "center" },
  sentText: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: spacing.sm, textAlign: "center" },
  secondary: { minHeight: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  secondaryText: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  back: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: spacing.md },
  backText: { color: colors.textMuted, fontSize: 12, textDecorationLine: "underline" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
});
