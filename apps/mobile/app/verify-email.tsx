import { router, useLocalSearchParams } from "expo-router";
import { MailCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { completeMobilePublisherOnboarding, finalizeMobileAccount } from "@/src/domains/account/api";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { supabase } from "@/src/services/supabase";
import { colors, radius, spacing } from "@/src/theme/tokens";

const RESEND_SECONDS = 45;
type AccountType = "talent" | "publisher";

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string | string[]; type?: string | string[] }>();
  const email = paramValue(params.email).trim().toLowerCase();
  const accountType: AccountType = paramValue(params.type) === "publisher" ? "publisher" : "talent";
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const [token, setToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function normalizeOtp(value: string) {
    return value.replace(/[^0-9]/g, "").slice(0, 6);
  }

  async function finishVerifiedUser(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
    const metadata = user.user_metadata ?? {};
    const displayName = String(metadata.full_name ?? metadata.display_name ?? metadata.contact_name ?? user.email?.split("@")[0] ?? "").trim();
    const phone = String(metadata.phone ?? "").trim();
    if (displayName.length < 2 || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError(isArabic ? "تم تأكيد البريد، لكن بيانات الحساب الأساسية غير مكتملة. ارجع إلى التسجيل وأكمل البيانات." : "Your email is verified, but required account details are missing. Return to signup and complete them.");
      return;
    }
    await finalizeMobileAccount({ displayName, phone, accountType });
    if (accountType === "publisher") {
      const publisherType = String(metadata.publisher_type ?? "").trim();
      const publisherMode = String(metadata.publisher_mode ?? "").trim();
      if (!publisherType || (publisherMode !== "individual" && publisherMode !== "organization")) {
        setError(isArabic ? "تم تأكيد البريد، لكن صفة الناشر غير مكتملة. ارجع إلى التسجيل واختر صفة الناشر." : "Your email is verified, but the publisher type is missing. Return to signup and choose your publisher type.");
        return;
      }
      await completeMobilePublisherOnboarding({
        publisherMode: publisherMode as "individual" | "organization",
        publisherType,
      });
    }
    await session.refresh();
    setMessage(isArabic ? "تم تأكيد بريدك وتجهيز حسابك بنجاح." : "Your email and account have been verified successfully.");
    router.replace("/" as never);
  }

  async function verify() {
    if (!email) {
      setError(isArabic ? "تعذر تحديد البريد الإلكتروني. ارجع إلى التسجيل وحاول مرة أخرى." : "We could not determine your email. Return to signup and try again.");
      return;
    }
    if (token.length !== 6) {
      setError(isArabic ? "أدخل رمز التحقق المكون من 6 أرقام." : "Enter the 6-digit verification code.");
      return;
    }
    setLoading(true); setError(""); setMessage("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const existing = sessionData.session;
      if (existing?.user?.email?.trim().toLowerCase() === email && existing.user.email_confirmed_at) {
        await finishVerifiedUser(existing.user);
        return;
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (verifyError || !data.session || !data.user) {
        setError(isArabic ? "الرمز غير صحيح أو انتهت صلاحيته. تحقق منه أو اطلب رمزًا جديدًا." : "That code is incorrect or expired. Check it or request a new code.");
        return;
      }
      await finishVerifiedUser(data.user);
    } catch {
      setError(isArabic ? "تعذر تأكيد البريد أو تجهيز الحساب الآن. تحقق من اتصالك وحاول مرة أخرى." : "We could not verify your email or prepare your account. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email || secondsLeft > 0 || resending) return;
    setResending(true); setError(""); setMessage("");
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) {
        setError(isArabic ? "تعذر إرسال رمز جديد الآن. حاول بعد قليل." : "We could not send a new code right now. Try again shortly.");
        return;
      }
      setToken("");
      setSecondsLeft(RESEND_SECONDS);
      setMessage(isArabic ? "أرسلنا رمزًا جديدًا إلى بريدك." : "We sent a new code to your email.");
    } catch {
      setError(isArabic ? "تعذر إرسال رمز جديد الآن." : "We could not send a new code right now.");
    } finally {
      setResending(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.icon}><MailCheck size={28} color={colors.gold} /></View>
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "تأكيد البريد" : "EMAIL VERIFICATION"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "تحقق من بريدك الإلكتروني" : "Verify your email"}</Text>
        <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "أرسلنا رمزًا مكونًا من 6 أرقام إلى:" : "We sent a 6-digit code to:"}</Text>
        <Text style={styles.email}>{email || "—"}</Text>

        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: align }]}>{isArabic ? "رمز التحقق" : "Verification code"}<Text style={styles.required}> *</Text></Text>
          <TextInput value={token} onChangeText={(value) => { setToken(normalizeOtp(value)); setError(""); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} placeholder="000000" placeholderTextColor="rgba(255,255,255,0.18)" style={styles.otp} onSubmitEditing={() => void verify()} />

          {error ? <Text style={[styles.error, { textAlign: align }]}>{error}</Text> : null}
          {message ? <Text style={[styles.message, { textAlign: align }]}>{message}</Text> : null}

          <Pressable disabled={loading || token.length !== 6} onPress={() => void verify()} style={({ pressed }) => [styles.primary, (loading || token.length !== 6) && styles.disabled, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{loading ? (isArabic ? "جارٍ التحقق…" : "Verifying…") : (isArabic ? "تأكيد الرمز والمتابعة" : "Verify and continue")}</Text>
          </Pressable>

          <Pressable disabled={secondsLeft > 0 || resending} onPress={() => void resend()} style={styles.resend}>
            <Text style={[styles.resendText, (secondsLeft > 0 || resending) && styles.resendDisabled]}>{resending ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : secondsLeft > 0 ? (isArabic ? `إعادة الإرسال خلال ${secondsLeft} ثانية` : `Resend in ${secondsLeft}s`) : (isArabic ? "إعادة إرسال الرمز" : "Resend code")}</Text>
          </Pressable>

          <Text style={[styles.hint, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "لم تجد الرسالة؟ تحقق من البريد غير المرغوب فيه قبل طلب رمز جديد." : "Can't find the email? Check Spam / Junk before requesting a new code."}</Text>

          <Pressable onPress={() => router.replace(`/register?type=${accountType}` as never)} style={styles.changeEmail}>
            <Text style={styles.changeEmailText}>{isArabic ? "تغيير البريد الإلكتروني" : "Change email address"}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  icon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", alignSelf: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.08)", marginBottom: spacing.lg },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: 30, lineHeight: 38, fontWeight: "700", marginTop: spacing.sm },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginTop: spacing.sm },
  email: { color: colors.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center", writingDirection: "ltr", marginTop: spacing.sm },
  card: { marginTop: spacing.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 28, padding: spacing.lg },
  label: { color: "rgba(255,255,255,0.68)", fontSize: 12, fontWeight: "600" },
  required: { color: colors.gold },
  otp: { minHeight: 66, marginTop: spacing.sm, borderWidth: 1, borderColor: "rgba(201,169,98,0.36)", borderRadius: radius.lg, backgroundColor: "rgba(0,0,0,0.32)", color: colors.textPrimary, fontSize: 30, fontWeight: "700", letterSpacing: 10, textAlign: "center", writingDirection: "ltr" },
  error: { color: "#FCA5A5", fontSize: 12, lineHeight: 20, borderWidth: 1, borderColor: "rgba(248,113,113,0.24)", backgroundColor: "rgba(248,113,113,0.08)", borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  message: { color: "#D1FAE5", fontSize: 12, lineHeight: 20, borderWidth: 1, borderColor: "rgba(110,231,183,0.2)", backgroundColor: "rgba(110,231,183,0.08)", borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md },
  primary: { minHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, borderRadius: radius.lg, marginTop: spacing.lg },
  primaryText: { color: "#080808", fontSize: 14, fontWeight: "800" },
  resend: { minHeight: 46, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  resendText: { color: colors.gold, fontSize: 12, fontWeight: "600" },
  resendDisabled: { color: "rgba(255,255,255,0.28)" },
  hint: { color: "rgba(255,255,255,0.38)", fontSize: 11, lineHeight: 19, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.sm },
  changeEmail: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: spacing.sm },
  changeEmailText: { color: colors.textMuted, fontSize: 12, textDecorationLine: "underline" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.995 }] },
});
