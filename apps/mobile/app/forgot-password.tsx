import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react-native";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export default function ForgotPasswordScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  async function submit() {
    const value = email.trim().toLowerCase();
    if (loading || message) return;
    if (!isValidEmail(value)) {
      setError(isArabic ? "أدخل بريدًا إلكترونيًا صالحًا." : "Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: "mlamh://reset-password" });
      if (resetError) {
        setError(isArabic ? "تعذر إرسال طلب الاستعادة الآن. حاول مرة أخرى." : "Unable to send the recovery request right now. Please try again.");
        return;
      }
      setMessage(isArabic ? "إذا كان البريد مرتبطًا بحساب ملامح فستصلك رسالة استعادة. افتح الرابط من هذا الجهاز للعودة إلى التطبيق." : "If this email is linked to a MLAMH account, you'll receive a recovery message. Open the link on this device to return to the app.");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const textAlign = isRtl ? "right" : "left";
  const disabled = loading || Boolean(message);

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
          <View style={[styles.top, isRtl && styles.rowRtl]}>
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.iconButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable>
            <Text style={[styles.brand, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
          </View>

          <View style={styles.header}>
            <Text style={[styles.eyebrow, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text>
            <Text accessibilityRole="header" style={[styles.title, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "استعادة كلمة المرور" : "Reset your password"}</Text>
            <Text style={[styles.subtitle, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "أدخل بريد حسابك وسنرسل رابطًا آمنًا يعيدك للتطبيق." : "Enter your account email and we'll send a secure link that returns you to the app."}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={[styles.label, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text>
            <View style={[styles.inputShell, isRtl && styles.rowRtl]}><Mail size={18} color={theme.muted} strokeWidth={1.8} /><TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="done" value={email} onChangeText={(value) => { setEmail(value); if (error) setError(null); }} onSubmitEditing={() => void submit()} placeholder="name@example.com" placeholderTextColor={theme.muted} style={[styles.input, { textAlign }]} /></View>
            {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { textAlign }, isRtl && styles.textRtl]}>{error}</Text></View> : null}
            {message ? <View style={styles.messageBox}><Text accessibilityLiveRegion="polite" style={[styles.message, { textAlign }, isRtl && styles.textRtl]}>{message}</Text></View> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال رابط الاستعادة" : "Send recovery link"} accessibilityState={{ disabled, busy: loading }} disabled={disabled} onPress={() => void submit()} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : message ? (isArabic ? "تم إرسال الطلب" : "Request sent") : (isArabic ? "إرسال رابط الاستعادة" : "Send recovery link")}</Text></Pressable>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"} onPress={() => router.replace("/login")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}</Text></Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function createStyles(theme: typeof darkTheme, compact: boolean) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: compact ? 10 : 18 },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", paddingHorizontal: compact ? 14 : 22, gap: compact ? 14 : 18 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  arabicText: { letterSpacing: 0 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: compact ? 2 : 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
  brand: { color: theme.accent, fontSize: compact ? 16 : 18, fontWeight: "800", letterSpacing: 1.1 },
  header: { gap: compact ? 6 : 8 },
  eyebrow: { color: theme.accent, fontSize: compact ? 9 : 10, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: theme.text, fontSize: compact ? 27 : 31, lineHeight: compact ? 34 : 38, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: compact ? 12 : 14, lineHeight: compact ? 19 : 22 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: compact ? 13 : 16, gap: 11 },
  label: { color: theme.text, fontSize: 12, fontWeight: "700" },
  inputShell: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.background, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13 },
  input: { flex: 1, color: theme.text, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 15 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 },
  error: { color: "#E59A9A", fontSize: 13, lineHeight: 20 },
  messageBox: { backgroundColor: theme.chip, borderWidth: 1, borderColor: "#C9A96244", borderRadius: 12, padding: 12 },
  message: { color: theme.text, fontSize: 13, lineHeight: 20 },
  button: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 2 },
  buttonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: theme.text, fontSize: 12, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.82 },
}); }
