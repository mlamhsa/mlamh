import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LockKeyhole } from "lucide-react-native";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function ResetPasswordScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme, compact), [compact, theme]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function save() {
    if (loading) return;
    if (password.length < 8) {
      setError(isArabic ? "استخدم كلمة مرور من 8 أحرف على الأقل." : "Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setExpired(true);
        setError(isArabic ? "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." : "This recovery link is invalid or expired. Request a new one.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(isArabic ? "تعذر تحديث كلمة المرور. حاول مرة أخرى." : "Unable to update your password. Please try again.");
        return;
      }
      const account = await getMobileAccountContext().catch(() => null);
      router.replace(getAccountHomeHref(account) ?? "/opportunities");
    } catch {
      setError(isArabic ? "تعذر تحديث كلمة المرور الآن." : "Unable to update your password right now.");
    } finally {
      setLoading(false);
    }
  }

  const textAlign = isRtl ? "right" : "left";

  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
          <Text style={[styles.brand, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
          <View style={styles.header}>
            <Text style={[styles.eyebrow, isArabic && styles.arabicText, isRtl && styles.textRtl]}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text>
            <Text accessibilityRole="header" style={[styles.title, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "أنشئ كلمة مرور جديدة" : "Create a new password"}</Text>
            <Text style={[styles.subtitle, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "اختر كلمة مرور قوية ومختلفة عن كلمات المرور المستخدمة في حساباتك الأخرى." : "Choose a strong password you don't reuse on other accounts."}</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={[styles.label, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "كلمة المرور الجديدة" : "New password"}</Text>
            <View style={[styles.inputShell, isRtl && styles.rowRtl]}><LockKeyhole size={18} color={theme.muted} strokeWidth={1.8} /><TextInput accessibilityLabel={isArabic ? "كلمة المرور الجديدة" : "New password"} secureTextEntry autoComplete="new-password" autoCapitalize="none" returnKeyType="next" value={password} onChangeText={(value) => { setPassword(value); if (error) setError(null); }} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input, { textAlign }]} /></View>

            <Text style={[styles.label, { textAlign }, isRtl && styles.textRtl]}>{isArabic ? "تأكيد كلمة المرور" : "Confirm password"}</Text>
            <View style={[styles.inputShell, isRtl && styles.rowRtl]}><LockKeyhole size={18} color={theme.muted} strokeWidth={1.8} /><TextInput accessibilityLabel={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} secureTextEntry autoComplete="new-password" autoCapitalize="none" returnKeyType="done" value={confirm} onChangeText={(value) => { setConfirm(value); if (error) setError(null); }} onSubmitEditing={() => void save()} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input, { textAlign }]} /></View>

            {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { textAlign }, isRtl && styles.textRtl]}>{error}</Text></View> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "حفظ كلمة المرور" : "Save password"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void save()} style={({ pressed }) => [styles.button, loading && styles.disabled, pressed && !loading && styles.pressed]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ كلمة المرور" : "Save password")}</Text></Pressable>
          </View>

          {expired ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "طلب رابط استعادة جديد" : "Request a new recovery link"} onPress={() => router.replace("/forgot-password")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "طلب رابط استعادة جديد" : "Request a new recovery link"}</Text></Pressable> : null}
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
  brand: { color: theme.accent, fontSize: compact ? 16 : 18, fontWeight: "800", letterSpacing: 1.1, marginBottom: compact ? 2 : 8 },
  header: { gap: compact ? 6 : 8 },
  eyebrow: { color: theme.accent, fontSize: compact ? 9 : 10, fontWeight: "900", letterSpacing: 1.6 },
  title: { color: theme.text, fontSize: compact ? 27 : 31, lineHeight: compact ? 34 : 38, fontWeight: "700" },
  subtitle: { color: theme.muted, fontSize: compact ? 12 : 14, lineHeight: compact ? 19 : 22 },
  formCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: compact ? 13 : 16, gap: 10 },
  label: { color: theme.text, fontSize: 12, fontWeight: "700" },
  inputShell: { minHeight: 52, borderWidth: 1, borderColor: theme.border, borderRadius: 13, backgroundColor: theme.background, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13 },
  input: { flex: 1, color: theme.text, paddingVertical: Platform.OS === "ios" ? 13 : 10, fontSize: 15 },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 12, padding: 12 },
  error: { color: "#E59A9A", fontSize: 13, lineHeight: 20 },
  button: { minHeight: 52, borderRadius: 13, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginTop: 2 },
  buttonText: { color: theme.background, fontSize: 14, fontWeight: "900" },
  secondaryButton: { minHeight: 48, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: theme.accent, fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.82 },
}); }
