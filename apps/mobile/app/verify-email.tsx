import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, RotateCcw } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { goBackOrReplace } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type AccountType = "talent" | "publisher";
type TalentIntent = "actor" | "model" | "";
type ApiResult = { ok?: boolean; code?: string };

const BRAND_LOGO_AR = require("../assets/logo.ar.png");
const BRAND_LOGO_EN = require("../assets/logo.en.png");
const RESEND_SECONDS = 45;

async function postJson(accessToken: string, path: string, body: unknown) {
  const response = await fetch(`${MOBILE_API_BASE_URL}${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(body),
  });
  const raw = await response.text().catch(() => "");
  let result: ApiResult = {};
  try { result = raw ? JSON.parse(raw) as ApiResult : {}; } catch { result = {}; }
  return { response, result };
}

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string; accountType?: AccountType; talentIntent?: TalentIntent }>();
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = useMemo(() => createStyles(), []);
  const email = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const accountType: AccountType = params.accountType === "publisher" ? "publisher" : "talent";
  const talentIntent: TalentIntent = params.talentIntent === "actor" || params.talentIntent === "model" ? params.talentIntent : "";
  const [token, setToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  function normalizeOtp(value: string) { return value.replace(/[^0-9]/g, "").slice(0, 6); }

  async function finishEmailSignup(accessToken: string) {
    const { data: { user } } = await supabase.auth.getUser();
    const metadata = user?.user_metadata ?? {};
    const displayName = String(metadata.display_name ?? metadata.contact_name ?? metadata.full_name ?? metadata.name ?? "").trim();
    const phone = String(metadata.phone ?? "").trim();

    if (!displayName || !phone) {
      router.replace({ pathname: "/complete-account", params: { accountType, intent: talentIntent || undefined } });
      return;
    }

    const accountAttempt = await postJson(accessToken, "/api/account/details", { displayName, phone, accountType });
    if (!accountAttempt.response.ok || !accountAttempt.result.ok) {
      router.replace({ pathname: "/complete-account", params: { accountType, intent: talentIntent || undefined } });
      return;
    }

    if (accountType === "publisher") {
      router.replace("/publisher/setup");
      return;
    }

    if (talentIntent) {
      const talentAttempt = await postJson(accessToken, "/api/talent/onboarding", { talentType: talentIntent });
      if (talentAttempt.response.ok && talentAttempt.result.ok) {
        router.replace("/profile/journey");
        return;
      }
    }
    router.replace("/onboarding");
  }

  async function verify() {
    if (!email) return setError(isArabic ? "تعذر تحديد البريد الإلكتروني. ارجع وأعد التسجيل." : "We could not determine your email. Go back and try signup again.");
    if (token.length !== 6) return setError(isArabic ? "أدخل رمز التحقق المكون من 6 أرقام." : "Enter the 6-digit verification code.");
    setLoading(true); setError(null); setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (authError || !data.session) {
        setError(isArabic ? "الرمز غير صحيح أو انتهت صلاحيته. تحقق من الرمز أو أرسل رمزًا جديدًا." : "That code is incorrect or expired. Check it or request a new code.");
        return;
      }
      setMessage(isArabic ? "تم تأكيد بريدك بنجاح." : "Your email has been verified.");
      await finishEmailSignup(data.session.access_token);
    } catch {
      setError(isArabic ? "تعذر تأكيد البريد الآن. تحقق من اتصالك وحاول مرة أخرى." : "We could not verify your email right now. Check your connection and try again.");
    } finally { setLoading(false); }
  }

  async function resend() {
    if (!email || secondsLeft > 0 || resending) return;
    setResending(true); setError(null); setMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
      if (resendError) return setError(isArabic ? "تعذر إرسال رمز جديد الآن. حاول بعد قليل." : "We could not send a new code right now. Try again shortly.");
      setToken(""); setSecondsLeft(RESEND_SECONDS);
      setMessage(isArabic ? "أرسلنا رمزًا جديدًا إلى بريدك." : "We sent a new code to your email.");
    } catch { setError(isArabic ? "تعذر إرسال رمز جديد الآن." : "We could not send a new code right now."); }
    finally { setResending(false); }
  }

  const textAlign = isRtl ? "right" : "left";
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => goBackOrReplace("/signup")} style={styles.iconButton}>{isRtl ? <ArrowRight size={22} color={darkTheme.text} /> : <ArrowLeft size={22} color={darkTheme.text} />}</Pressable>
          <Image source={isArabic ? BRAND_LOGO_AR : BRAND_LOGO_EN} resizeMode="contain" style={styles.logo} />
          <Pressable accessibilityRole="button" onPress={() => changeLocale(isArabic ? "en" : "ar")} style={styles.languageButton}><Text style={styles.languageText}>{isArabic ? "EN" : "العربية"}</Text></Pressable>
        </View>
        <View style={[styles.hero, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <View style={styles.mailIcon}><Mail size={26} color={darkTheme.accent} strokeWidth={1.8} /></View>
          <Text style={[styles.eyebrow, { textAlign }]}>{isArabic ? "تأكيد البريد" : "EMAIL VERIFICATION"}</Text>
          <Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "تحقق من بريدك" : "Verify your email"}</Text>
          <Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "أرسلنا رمزًا مكونًا من 6 أرقام إلى" : "We sent a 6-digit code to"}</Text>
          <Text selectable style={styles.email}>{email || "—"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.label, { textAlign }]}>{isArabic ? "رمز التحقق" : "Verification code"} <Text style={styles.required}>*</Text></Text>
          <TextInput autoFocus accessibilityLabel={isArabic ? "رمز التحقق" : "Verification code"} autoComplete="one-time-code" textContentType="oneTimeCode" keyboardType="number-pad" maxLength={6} value={token} onChangeText={(value) => { setToken(normalizeOtp(value)); setError(null); }} onSubmitEditing={() => void verify()} placeholder="000000" placeholderTextColor="#70706A" style={styles.otpInput} returnKeyType="done" />
          <Text style={[styles.requiredLegend, { textAlign }]}>{isArabic ? "* حقل مطلوب" : "* Required field"}</Text>
          {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.errorText, { textAlign }]}>{error}</Text></View> : null}
          {message ? <View style={[styles.successBox, isRtl && styles.rowRtl]}><CheckCircle2 size={18} color="#B8D8B5" /><Text style={[styles.successText, { textAlign }]}>{message}</Text></View> : null}
          <Pressable accessibilityRole="button" disabled={loading || token.length !== 6} onPress={() => void verify()} style={({ pressed }) => [styles.primaryButton, (loading || token.length !== 6) && styles.disabled, pressed && styles.pressed]}>{loading ? <ActivityIndicator color="#10100E" /> : <Text style={styles.primaryText}>{isArabic ? "تأكيد الرمز والمتابعة" : "Verify and continue"}</Text>}</Pressable>
          <Pressable accessibilityRole="button" disabled={secondsLeft > 0 || resending} onPress={() => void resend()} style={({ pressed }) => [styles.resendButton, (secondsLeft > 0 || resending) && styles.resendDisabled, pressed && styles.pressed]}><RotateCcw size={16} color={secondsLeft > 0 ? "#777770" : darkTheme.accent} /><Text style={[styles.resendText, secondsLeft > 0 && styles.resendTextDisabled]}>{resending ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : secondsLeft > 0 ? (isArabic ? `إعادة الإرسال خلال ${secondsLeft} ثانية` : `Resend in ${secondsLeft}s`) : (isArabic ? "إعادة إرسال الرمز" : "Resend code")}</Text></Pressable>
          <View style={styles.hintBox}><Text style={[styles.hintText, { textAlign }]}>{isArabic ? "لم تجد الرسالة؟ تحقق من Spam / Junk قبل طلب رمز جديد." : "Can't find the email? Check Spam / Junk before requesting a new code."}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => goBackOrReplace("/signup")} style={styles.changeEmailButton}><Text style={styles.changeEmailText}>{isArabic ? "تغيير البريد الإلكتروني" : "Change email address"}</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function createStyles() { return StyleSheet.create({
  screen:{flex:1,backgroundColor:darkTheme.background},content:{flex:1,width:"100%",maxWidth:560,alignSelf:"center",paddingHorizontal:20,paddingBottom:18},topRow:{minHeight:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},rowRtl:{flexDirection:"row-reverse"},iconButton:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#2B2B28",alignItems:"center",justifyContent:"center"},logo:{width:112,height:36},languageButton:{minWidth:42,height:36,paddingHorizontal:8,borderRadius:18,borderWidth:1,borderColor:"#2B2B28",alignItems:"center",justifyContent:"center"},languageText:{color:darkTheme.text,fontSize:12,fontWeight:"700"},hero:{paddingTop:28,paddingBottom:22},mailIcon:{width:52,height:52,borderRadius:26,backgroundColor:"#1E1B14",borderWidth:1,borderColor:"#4D4023",alignItems:"center",justifyContent:"center",marginBottom:18},eyebrow:{color:darkTheme.accent,fontSize:12,letterSpacing:1.2,fontWeight:"800",marginBottom:8,width:"100%"},title:{color:darkTheme.text,fontSize:30,lineHeight:38,fontWeight:"800",width:"100%"},subtitle:{color:"#B8B8B1",fontSize:15,lineHeight:23,marginTop:10,width:"100%"},email:{color:darkTheme.text,fontSize:15,lineHeight:23,marginTop:4,fontWeight:"700",width:"100%",writingDirection:"ltr",textAlign:"left"},card:{backgroundColor:"#151513",borderWidth:1,borderColor:"#292925",borderRadius:24,padding:20,gap:12},label:{color:darkTheme.text,fontSize:14,fontWeight:"700",width:"100%"},required:{color:darkTheme.accent},requiredLegend:{color:"#9A998F",fontSize:12,width:"100%",marginTop:-4},otpInput:{height:64,borderRadius:16,borderWidth:1,borderColor:"#4D4023",backgroundColor:"#0C0C0B",color:darkTheme.text,fontSize:30,fontWeight:"800",textAlign:"center",letterSpacing:12,writingDirection:"ltr",paddingHorizontal:14},errorBox:{borderRadius:14,padding:12,backgroundColor:"#281718",borderWidth:1,borderColor:"#5A2C30"},errorText:{color:"#F2B8B5",fontSize:13,lineHeight:20},successBox:{flexDirection:"row",alignItems:"center",gap:8,borderRadius:14,padding:12,backgroundColor:"#142019",borderWidth:1,borderColor:"#31523B"},successText:{color:"#B8D8B5",flex:1,fontSize:13,lineHeight:20},primaryButton:{height:54,borderRadius:16,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center",marginTop:4},primaryText:{color:"#10100E",fontSize:15,fontWeight:"800"},disabled:{opacity:.45},pressed:{opacity:.82},resendButton:{minHeight:42,flexDirection:"row",gap:7,alignItems:"center",justifyContent:"center"},resendDisabled:{opacity:.8},resendText:{color:darkTheme.accent,fontSize:13,fontWeight:"700"},resendTextDisabled:{color:"#777770"},hintBox:{borderRadius:14,backgroundColor:"#10100F",padding:12},hintText:{color:"#9F9F98",fontSize:12,lineHeight:19,width:"100%"},changeEmailButton:{minHeight:38,alignItems:"center",justifyContent:"center"},changeEmailText:{color:"#E5E2D8",fontSize:13,fontWeight:"700",textDecorationLine:"underline"}
}); }
