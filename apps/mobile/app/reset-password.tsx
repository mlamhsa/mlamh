import { router } from "expo-router";
import { LockKeyhole } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function ResetPasswordScreen() {
  const { locale } = useLocale();
  const sessionContext = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSessionReady(Boolean(data.session));
      setChecking(false);
    }
    void check();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSessionReady(Boolean(nextSession));
      setChecking(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit() {
    setError("");
    if (!sessionReady) {
      setError(isArabic ? "جلسة الاستعادة غير متاحة أو انتهت صلاحيتها. اطلب رابطًا جديدًا." : "The recovery session is unavailable or expired. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setError(isArabic ? "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل." : "Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError(isArabic ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(isArabic ? "تعذر تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية، اطلب رابطًا جديدًا." : "Unable to update the password. The link may have expired; request a new one.");
        return;
      }
      await sessionContext.refresh();
      setDone(true);
    } catch {
      setError(isArabic ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.icon}><LockKeyhole size={24} color={colors.gold} /></View>
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "تأمين الحساب" : "SECURE YOUR ACCOUNT"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "كلمة مرور جديدة" : "Create a new password"}</Text>
        <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "اختر كلمة مرور قوية جديدة لحسابك في ملامح." : "Choose a strong new password for your MLAMH account."}</Text>

        <View style={styles.card}>
          {checking ? (
            <Text style={styles.centerText}>{isArabic ? "جارٍ التحقق من رابط الاستعادة…" : "Verifying your recovery link…"}</Text>
          ) : done ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneTitle}>{isArabic ? "تم تحديث كلمة المرور" : "Password updated"}</Text>
              <Text style={[styles.doneText, { writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "يمكنك الآن متابعة استخدام حسابك بكلمة المرور الجديدة." : "You can now continue using your account with the new password."}</Text>
              <Pressable onPress={() => router.replace("/" as never)} style={styles.primary}><Text style={styles.primaryText}>{isArabic ? "الانتقال إلى حسابي" : "Continue to my account"}</Text></Pressable>
            </View>
          ) : !sessionReady ? (
            <View style={styles.doneBox}>
              <Text style={styles.errorTitle}>{isArabic ? "رابط الاستعادة غير متاح" : "Recovery link unavailable"}</Text>
              <Text style={[styles.doneText, { writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا من صفحة استعادة الحساب." : "The link is invalid or expired. Request a new one from account recovery."}</Text>
              <Pressable onPress={() => router.replace("/forgot-password" as never)} style={styles.secondary}><Text style={styles.secondaryText}>{isArabic ? "طلب رابط جديد" : "Request a new link"}</Text></Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.label, { textAlign: align }]}>{isArabic ? "كلمة المرور الجديدة" : "New password"}</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoCapitalize="none" autoCorrect={false} placeholder={isArabic ? "8 أحرف على الأقل" : "At least 8 characters"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} />
              <Text style={[styles.label, { textAlign: align, marginTop: spacing.md }]}>{isArabic ? "تأكيد كلمة المرور" : "Confirm password"}</Text>
              <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry textContentType="newPassword" autoCapitalize="none" autoCorrect={false} placeholder={isArabic ? "أعد كتابة كلمة المرور" : "Re-enter password"} placeholderTextColor={colors.textMuted} style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]} onSubmitEditing={() => void submit()} />
              {error ? <Text style={[styles.error, { textAlign: align }]}>{error}</Text> : null}
              <Pressable disabled={loading} onPress={() => void submit()} style={({ pressed }) => [styles.primary, loading && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ التحديث…" : "Updating…") : (isArabic ? "حفظ كلمة المرور الجديدة" : "Save new password")}</Text></Pressable>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  icon: { width: 54, height: 54, alignItems: "center", justifyContent: "center", alignSelf: "center", borderRadius: 18, borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.08)", marginBottom: spacing.lg },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.1 },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 38, fontWeight: "700", marginTop: spacing.sm },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.sm },
  card: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg },
  centerText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, textAlign: "center" },
  label: { color: "rgba(255,255,255,0.68)", fontSize: 12, fontWeight: "600" },
  input: { minHeight: 56, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.28)", color: colors.textPrimary, paddingHorizontal: spacing.lg, fontSize: 14 },
  error: { color: "#FCA5A5", fontSize: 12, lineHeight: 20, borderWidth: 1, borderColor: "rgba(248,113,113,0.24)", backgroundColor: "rgba(248,113,113,0.08)", borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  primary: { minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, borderRadius: radius.lg, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  primaryText: { color: "#080808", fontSize: 14, fontWeight: "800" },
  secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  secondaryText: { color: colors.gold, fontSize: 12, fontWeight: "700" },
  doneBox: { alignItems: "center" },
  doneTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  errorTitle: { color: "#FCA5A5", fontSize: 16, fontWeight: "700", textAlign: "center" },
  doneText: { color: colors.textMuted, fontSize: 12, lineHeight: 21, textAlign: "center", marginTop: spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
});
