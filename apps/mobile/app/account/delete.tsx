import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";

import { deleteAccount } from "@/lib/api";
import { revokeNativeAppleAuthorizationForDeletion } from "@/lib/apple-auth";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme, radii, spacing, typography } from "@/lib/theme";

export default function DeleteAccountScreen() {
  const { locale } = useAppLocale();
  const ar = locale === "ar";
  const rtl = isRtlLocale(locale);
  const Back = rtl ? ChevronRight : ChevronLeft;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (deleting) return;
    Alert.alert(
      ar ? "التأكيد النهائي" : "Final confirmation",
      ar ? "هذا الإجراء نهائي ولا يمكن التراجع عنه. هل تريد حذف الحساب؟" : "This action is permanent and cannot be undone. Delete your account?",
      [
        { text: ar ? "إلغاء" : "Cancel", style: "cancel" },
        { text: ar ? "حذف نهائي" : "Delete permanently", style: "destructive", onPress: () => void performDelete() },
      ],
    );
  }

  async function performDelete() {
    if (deleting) return;
    setDeleting(true); setError(null);
    const appleRevocation = await revokeNativeAppleAuthorizationForDeletion();
    if (!appleRevocation.ok) {
      setDeleting(false);
      if (appleRevocation.canceled) return setError(ar ? "أُلغي تأكيد Apple، لذلك لم يتم حذف الحساب." : "Apple confirmation was canceled, so your account was not deleted.");
      if (appleRevocation.code === "APPLE_REVOCATION_NOT_CONFIGURED") return setError(ar ? "حذف حساب Apple غير متاح مؤقتًا حتى يكتمل إعداد Apple الآمن. لم يتم حذف أي بيانات." : "Apple account deletion is temporarily unavailable until secure Apple revocation is configured. No data was deleted.");
      return setError(ar ? "تعذر إلغاء تفويض Apple بأمان، لذلك لم يتم حذف الحساب." : "We could not securely revoke Apple authorization, so your account was not deleted.");
    }
    const result = await deleteAccount();
    if (!result.ok) { setDeleting(false); setError(ar ? "تعذر حذف الحساب الآن. حاول مرة أخرى أو تواصل مع الدعم." : "We couldn't delete your account right now. Try again or contact support."); return; }
    await supabase.auth.signOut().catch(() => undefined);
    router.replace("/");
  }

  return <SafeAreaView style={s.screen} edges={["top","bottom"]}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
    <View style={[s.top,rtl&&s.rowRtl]}><Pressable onPress={()=>router.back()} style={s.back}><Back size={21} color={darkTheme.text}/></Pressable><Text style={[s.brand,txt(rtl)]}>{ar?"إدارة الحساب":"ACCOUNT MANAGEMENT"}</Text></View>
    <View style={s.hero}><View style={s.heroIcon}><AlertTriangle size={28} color={darkTheme.danger}/></View><Text accessibilityRole="header" style={[s.title,txt(rtl)]}>{ar?"حذف الحساب":"Delete account"}</Text><Text style={[s.body,txt(rtl)]}>{ar?"استخدم هذه الصفحة فقط إذا كنت تريد إغلاق حسابك نهائيًا. تسجيل الخروج لا يحذف أي بيانات ويمكنك العودة للحساب لاحقًا.":"Use this page only if you want to permanently close your account. Signing out does not delete data and you can return later."}</Text></View>
    <View style={s.warning}><Text style={[s.warningTitle,txt(rtl)]}>{ar?"ما الذي سيتم حذفه؟":"What will be deleted?"}</Text><Text style={[s.warningText,txt(rtl)]}>{ar?"الحساب، الملف، الصور والبيانات المرتبطة به وفق سياسة ملامح والالتزامات النظامية المطبقة.":"Your account, profile, photos and associated data under MLAMH policy and applicable retention obligations."}</Text></View>
    {error?<View style={s.errorBox}><Text accessibilityRole="alert" style={[s.error,txt(rtl)]}>{error}</Text></View>:null}
    <Pressable disabled={deleting} onPress={confirmDelete} style={[s.delete,deleting&&s.disabled]}>{deleting?<ActivityIndicator color={darkTheme.danger}/>:<><Trash2 size={18} color={darkTheme.danger}/><Text style={s.deleteText}>{ar?"حذف الحساب نهائيًا":"Delete account permanently"}</Text></>}</Pressable>
    <Pressable disabled={deleting} onPress={()=>router.back()} style={s.cancel}><Text style={s.cancelText}>{ar?"الاحتفاظ بالحساب":"Keep my account"}</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
function txt(rtl:boolean){return{textAlign:rtl?"right" as const:"left" as const,writingDirection:rtl?"rtl" as const:"ltr" as const}}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{width:"100%",maxWidth:620,alignSelf:"center",padding:spacing.lg,gap:spacing.lg},top:{minHeight:48,flexDirection:"row",alignItems:"center",gap:12},rowRtl:{flexDirection:"row-reverse"},back:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:darkTheme.border,alignItems:"center",justifyContent:"center"},brand:{flex:1,color:darkTheme.muted,fontSize:10,fontWeight:"900"},hero:{borderWidth:1,borderColor:"#E59A9A33",backgroundColor:darkTheme.dangerSurface,borderRadius:radii.xl,padding:20,gap:10},heroIcon:{width:52,height:52,borderRadius:26,borderWidth:1,borderColor:"#E59A9A44",alignItems:"center",justifyContent:"center"},title:{...typography.pageTitle,color:darkTheme.text},body:{...typography.body,color:darkTheme.muted},warning:{borderWidth:1,borderColor:darkTheme.border,borderRadius:radii.lg,backgroundColor:darkTheme.surface,padding:16,gap:7},warningTitle:{color:darkTheme.text,fontSize:14,fontWeight:"900"},warningText:{color:darkTheme.muted,fontSize:12,lineHeight:20},errorBox:{borderWidth:1,borderColor:"#E59A9A44",backgroundColor:darkTheme.dangerSurface,borderRadius:radii.md,padding:12},error:{color:darkTheme.danger,fontSize:11,lineHeight:18},delete:{minHeight:54,borderRadius:radii.md,borderWidth:1,borderColor:"#E59A9A88",backgroundColor:darkTheme.dangerSurface,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},deleteText:{color:darkTheme.danger,fontSize:13,fontWeight:"900"},cancel:{minHeight:50,borderRadius:radii.md,borderWidth:1,borderColor:darkTheme.border,alignItems:"center",justifyContent:"center"},cancelText:{color:darkTheme.text,fontSize:13,fontWeight:"800"},disabled:{opacity:.5}});
