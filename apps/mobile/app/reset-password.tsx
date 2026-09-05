import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function ResetPasswordScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  async function save() {
    if (loading) return;
    if (password.length < 8) { setError(isArabic ? "استخدم كلمة مرور من 8 أحرف على الأقل." : "Use a password with at least 8 characters."); return; }
    if (password !== confirm) { setError(isArabic ? "كلمتا المرور غير متطابقتين." : "The passwords do not match."); return; }
    setLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(isArabic ? "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." : "This recovery link is invalid or expired. Request a new one."); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(isArabic ? "تعذر تحديث كلمة المرور. حاول مرة أخرى." : "Unable to update your password. Please try again."); return; }
      router.replace("/");
    } catch { setError(isArabic ? "تعذر تحديث كلمة المرور الآن." : "Unable to update your password right now."); }
    finally { setLoading(false); }
  }
  const textAlign = isRtl ? "right" : "left";
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View style={[styles.content,{direction:isRtl?"rtl":"ltr"}]}>
    <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text><View style={styles.header}><Text style={styles.eyebrow}>{isArabic ? "أمان الحساب" : "ACCOUNT SECURITY"}</Text><Text accessibilityRole="header" style={[styles.title,{textAlign}]}>{isArabic ? "أنشئ كلمة مرور جديدة" : "Create a new password"}</Text><Text style={[styles.subtitle,{textAlign}]}>{isArabic ? "اختر كلمة مرور قوية ومختلفة عن كلمات المرور المستخدمة في حساباتك الأخرى." : "Choose a strong password you don't reuse on other accounts."}</Text></View>
    <Text style={[styles.label,{textAlign}]}>{isArabic ? "كلمة المرور الجديدة" : "New password"}</Text><TextInput secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input,{textAlign}]} />
    <Text style={[styles.label,{textAlign}]}>{isArabic ? "تأكيد كلمة المرور" : "Confirm password"}</Text><TextInput secureTextEntry autoComplete="new-password" returnKeyType="done" value={confirm} onChangeText={setConfirm} onSubmitEditing={() => void save()} placeholder="••••••••" placeholderTextColor={theme.muted} style={[styles.input,{textAlign}]} />
    {error ? <Text accessibilityRole="alert" style={[styles.error,{textAlign}]}>{error}</Text> : null}<Pressable disabled={loading} onPress={() => void save()} style={[styles.button,loading&&styles.disabled]}><Text style={styles.buttonText}>{loading ? (isArabic ? "جارٍ الحفظ…" : "Saving…") : (isArabic ? "حفظ كلمة المرور" : "Save password")}</Text></Pressable>
  </View></ScrollView></KeyboardAvoidingView>;
}
function createStyles(theme: typeof darkTheme){return StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},scroll:{flexGrow:1,justifyContent:"center",paddingVertical:24},content:{width:"100%",maxWidth:520,alignSelf:"center",paddingHorizontal:24,gap:14},brand:{color:theme.accent,fontSize:18,fontWeight:"800",letterSpacing:1.1,marginBottom:12},header:{gap:8,marginBottom:8},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.6},title:{color:theme.text,fontSize:31,lineHeight:38,fontWeight:"700"},subtitle:{color:theme.muted,fontSize:14,lineHeight:22},label:{color:theme.text,fontSize:12,fontWeight:"700"},input:{minHeight:52,borderWidth:1,borderColor:theme.border,borderRadius:12,backgroundColor:theme.surface,color:theme.text,paddingHorizontal:14,paddingVertical:Platform.OS==="ios"?14:11,fontSize:15},error:{color:"#E59A9A",fontSize:13,lineHeight:20},button:{minHeight:52,borderRadius:12,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:6},buttonText:{color:theme.background,fontSize:14,fontWeight:"900"},disabled:{opacity:.4}});}
