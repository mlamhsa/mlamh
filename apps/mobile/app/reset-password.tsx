import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getMobileAccountContext } from "@/lib/account";
import { getAccountHomeHref } from "@/lib/account-routing";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function ResetPasswordScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [expired, setExpired] = useState(false);
  async function save() {
    if (loading) return;
    if (password.length < 8) { setError(isArabic ? "استخدم كلمة مرور من 8 أحرف على الأقل." : "Use a password with at least 8 characters."); return; }
    if (password !== confirm) { setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match."); return; }
    setLoading(true); setError(null); setExpired(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setExpired(true); setError(isArabic ? "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." : "This recovery link is invalid or expired. Request a new one."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(isArabic ? "تعذر تحديث كلمة المرور. حاول مرة أخرى." : "Unable to update your password. Please try again."); return; }
      const account = await getMobileAccountContext().catch(() => null);
      router.replace(getAccountHomeHref(account) ?? "/opportunities");
    } catch { setError(isArabic ? "تعذر تحديث كلمة المرور الآن." : "Unable to update your password right now."); }
    finally { setLoading(false); }
  }
  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic"><View style={[styles.content,{direction:isRtl?"rtl":"ltr"}]}>
    <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text><View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text><Text accessibilityRole="header" style={[styles.title,{textAlign}]}>{isArabic ? "أنشئ كلمة مرور جديدة" : "Create a new password"}</Text><Text style={[styles.subtitle,{textAlign}]}>{isArabic ? "اختر كلمة مرور قوية ومختلفة عن كلمات المرور المستخدمة في حساباتك الأخرى." : "Choose a strong password you don't reuse on other accounts."}</Text></View>
    <Text style={[styles.label,{textAlign}]}>{isArabic ? "كلمة المرور الجديدة" : "New password"}</Text><TextInput accessibilityLabel={isArabic ? "كلمة المرور الجديدة" : "New password"} secureTextEntry autoComplete="new-password" autoCapitalize="none" returnKeyType="next" value={password} onChangeText={(value) => { setPassword(value); if (error) setError(null); }} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input,{textAlign}]} />
    <Text style={[styles.label,{textAlign}]}>{isArabic ? "تأكيد كلمة المرور" : "Confirm password"}</Text><TextInput accessibilityLabel={isArabic ? "تأكيد كلمة المرور" : "Confirm password"} secureTextEntry autoComplete="new-password" autoCapitalize="none" returnKeyType="done" value={confirm} onChangeText={(value) => { setConfirm(value); if (error) setError(null); }} onSubmitEditing={() => void save()} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input,{textAlign}]} />
    {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error,{textAlign}]}>{error}</Text></View> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "حفظ كلمة المرور" : "Save password"} accessibilityState={{ disabled: loading, busy: loading }} disabled={loading} onPress={() => void save()} style={({pressed})=>[styles.button,loading&&styles.disabled,pressed&&!loading&&styles.pressed]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ كلمة المرور" : "Save password")}</Text></Pressable>
    {expired ? <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "طلب رابط استعادة جديد" : "Request a new recovery link"} onPress={() => router.replace("/forgot-password")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "طلب رابط استعادة جديد" : "Request a new recovery link"}</Text></Pressable> : null}
  </View></ScrollView></KeyboardAvoidingView>;
}
function createStyles(theme: typeof darkTheme){return StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},scroll:{flexGrow:1,justifyContent:"center",paddingVertical:24},content:{width:"100%",maxWidth:520,alignSelf:"center",paddingHorizontal:24,gap:14},brand:{color:theme.accent,fontSize:18,fontWeight:"800",letterSpacing:1.1,marginBottom:12},header:{gap:8,marginBottom:8},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.6},title:{color:theme.text,fontSize:31,lineHeight:38,fontWeight:"700"},subtitle:{color:theme.muted,fontSize:14,lineHeight:22},label:{color:theme.text,fontSize:12,fontWeight:"700"},input:{minHeight:52,borderWidth:1,borderColor:theme.border,borderRadius:12,backgroundColor:theme.surface,color:theme.text,paddingHorizontal:14,paddingVertical:Platform.OS==="ios"?14:11,fontSize:15},errorBox:{borderWidth:1,borderColor:"#C84F4F66",backgroundColor:"#C84F4F14",borderRadius:12,padding:12},error:{color:"#E59A9A",fontSize:13,lineHeight:20},button:{minHeight:52,borderRadius:12,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:6},buttonText:{color:theme.background,fontSize:14,fontWeight:"900"},secondaryButton:{minHeight:48,alignItems:"center",justifyContent:"center"},secondaryText:{color:theme.accent,fontSize:12,fontWeight:"800"},disabled:{opacity:.4},pressed:{opacity:.82}});}
