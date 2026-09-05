import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function ForgotPasswordScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function submit() {
    const value = email.trim().toLowerCase();
    if (loading || message) return;
    if (!isValidEmail(value)) {
      setError(isArabic ? "أدخل بريدًا إلكترونيًا صالحًا." : "Enter a valid email address.");
      return;
    }
    setLoading(true); setError(null); setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: "mlamh://reset-password" });
      if (resetError) { setError(isArabic ? "تعذر إرسال طلب الاستعادة الآن. حاول مرة أخرى." : "Unable to send the recovery request right now. Please try again."); return; }
      setMessage(isArabic ? "إذا كان البريد مرتبطًا بحساب ملامح فستصلك رسالة استعادة. افتح الرابط من هذا الجهاز للعودة إلى التطبيق." : "If this email is linked to a MLAMH account, you'll receive a recovery message. Open the link on this device to return to the app.");
    } catch { setError(isArabic ? "تعذر الاتصال بملامح. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again."); }
    finally { setLoading(false); }
  }
  const textAlign = isRtl ? "right" : "left";
  const disabled = loading || Boolean(message);
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"><View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={[styles.top, isRtl && styles.topRtl]}><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.iconButton}><Text style={[styles.back, isRtl && styles.backRtl]}>‹</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
    <View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text><Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "استعادة كلمة المرور" : "Reset your password"}</Text><Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "أدخل بريد حسابك وسنرسل رابطًا آمنًا يعيدك للتطبيق." : "Enter your account email and we'll send a secure link that returns you to the app."}</Text></View>
    <Text style={[styles.label, { textAlign }]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text><TextInput accessibilityLabel={isArabic ? "البريد الإلكتروني" : "Email"} autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="done" value={email} onChangeText={(value) => { setEmail(value); if (error) setError(null); }} onSubmitEditing={() => void submit()} placeholder="name@example.com" placeholderTextColor={theme.muted} style={[styles.input, { textAlign }]} />
    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, { textAlign }]}>{error}</Text></View> : null}{message ? <View style={styles.messageBox}><Text accessibilityLiveRegion="polite" style={[styles.message, { textAlign }]}>{message}</Text></View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال رابط الاستعادة" : "Send recovery link"} accessibilityState={{ disabled, busy: loading }} disabled={disabled} onPress={() => void submit()} style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : message ? (isArabic ? "تم إرسال الطلب" : "Request sent") : (isArabic ? "إرسال رابط الاستعادة" : "Send recovery link")}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"} onPress={() => router.replace("/login")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}</Text></Pressable>
  </View></ScrollView></KeyboardAvoidingView>;
}
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({ screen:{flex:1,backgroundColor:theme.background},scroll:{flexGrow:1,justifyContent:"center",paddingVertical:24},content:{width:"100%",maxWidth:520,alignSelf:"center",paddingHorizontal:24,gap:16},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10},topRtl:{flexDirection:"row-reverse"},iconButton:{width:44,height:44,alignItems:"center",justifyContent:"center",marginHorizontal:-8},back:{color:theme.text,fontSize:31},backRtl:{transform:[{rotate:"180deg"}]},brand:{color:theme.accent,fontSize:18,fontWeight:"800",letterSpacing:1.1},header:{gap:8,marginBottom:8},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.6},title:{color:theme.text,fontSize:31,lineHeight:38,fontWeight:"700"},subtitle:{color:theme.muted,fontSize:14,lineHeight:22},label:{color:theme.text,fontSize:12,fontWeight:"700"},input:{minHeight:52,borderWidth:1,borderColor:theme.border,borderRadius:12,backgroundColor:theme.surface,color:theme.text,paddingHorizontal:14,paddingVertical:Platform.OS==="ios"?14:11,fontSize:15},errorBox:{borderWidth:1,borderColor:"#C84F4F66",backgroundColor:"#C84F4F14",borderRadius:12,padding:12},error:{color:"#E59A9A",fontSize:13,lineHeight:20},messageBox:{backgroundColor:theme.chip,borderWidth:1,borderColor:"#C9A96244",borderRadius:12,padding:12},message:{color:theme.text,fontSize:13,lineHeight:20},button:{minHeight:52,borderRadius:12,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:4},buttonText:{color:theme.background,fontSize:14,fontWeight:"900"},secondaryButton:{minHeight:48,alignItems:"center",justifyContent:"center"},secondaryText:{color:theme.text,fontSize:12,fontWeight:"700"},disabled:{opacity:.4},pressed:{opacity:.82}}); }
