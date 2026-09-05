import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  async function submit() {
    const value = email.trim().toLowerCase(); if (!value || loading) return;
    setLoading(true); setError(null); setMessage(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(value, { redirectTo: "mlamh://reset-password" });
      if (resetError) { setError(isArabic ? "تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى." : "Unable to send a recovery link right now. Please try again."); return; }
      setMessage(isArabic ? "أرسلنا رابط استعادة كلمة المرور. افتحه من هذا الجهاز للعودة إلى تطبيق ملامح." : "We sent a password recovery link. Open it on this device to return to MLAMH.");
    } catch { setError(isArabic ? "تعذر الاتصال بملامح. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again."); }
    finally { setLoading(false); }
  }
  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View style={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={[styles.top, isRtl && styles.topRtl]}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={[styles.back, isRtl && styles.backRtl]}>‹</Text></Pressable><Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
    <View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text><Text accessibilityRole="header" style={[styles.title, { textAlign }]}>{isArabic ? "استعادة كلمة المرور" : "Reset your password"}</Text><Text style={[styles.subtitle, { textAlign }]}>{isArabic ? "أدخل بريد حسابك وسنرسل لك رابطًا آمنًا يعيدك للتطبيق." : "Enter your account email and we'll send a secure link that returns you to the app."}</Text></View>
    <Text style={[styles.label, { textAlign }]}>{isArabic ? "البريد الإلكتروني" : "Email"}</Text><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" returnKeyType="done" value={email} onChangeText={setEmail} onSubmitEditing={() => void submit()} placeholder="name@example.com" placeholderTextColor={theme.muted} style={[styles.input, { textAlign }]} />
    {error ? <Text accessibilityRole="alert" style={[styles.error, { textAlign }]}>{error}</Text> : null}{message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { textAlign }]}>{message}</Text> : null}
    <Pressable disabled={loading || !email.trim()} onPress={() => void submit()} style={[styles.button, (loading || !email.trim()) && styles.disabled]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الإرسال…" : "Sending…") : (isArabic ? "إرسال رابط الاستعادة" : "Send recovery link")}</Text></Pressable>
  </View></ScrollView></KeyboardAvoidingView>;
}
function createStyles(theme: typeof darkTheme) { return StyleSheet.create({ screen:{flex:1,backgroundColor:theme.background},scroll:{flexGrow:1,justifyContent:"center",paddingVertical:24},content:{width:"100%",maxWidth:520,alignSelf:"center",paddingHorizontal:24,gap:16},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:10},topRtl:{flexDirection:"row-reverse"},back:{color:theme.text,fontSize:31},backRtl:{transform:[{rotate:"180deg"}]},brand:{color:theme.accent,fontSize:18,fontWeight:"800",letterSpacing:1.1},header:{gap:8,marginBottom:8},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.6},title:{color:theme.text,fontSize:31,lineHeight:38,fontWeight:"700"},subtitle:{color:theme.muted,fontSize:14,lineHeight:22},label:{color:theme.text,fontSize:12,fontWeight:"700"},input:{minHeight:52,borderWidth:1,borderColor:theme.border,borderRadius:12,backgroundColor:theme.surface,color:theme.text,paddingHorizontal:14,paddingVertical:Platform.OS==="ios"?14:11,fontSize:15},error:{color:"#E59A9A",fontSize:13,lineHeight:20},message:{color:theme.text,backgroundColor:theme.chip,borderWidth:1,borderColor:"#C9A96244",borderRadius:12,padding:12,fontSize:13,lineHeight:20},button:{minHeight:52,borderRadius:12,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:4},buttonText:{color:theme.background,fontSize:14,fontWeight:"900"},disabled:{opacity:.4}}); }
