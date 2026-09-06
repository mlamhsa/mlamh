import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { signOutMobile } from "@/lib/push";
import { darkTheme } from "@/lib/theme";

export default function ProfileSettingsScreen() {
  const locale = getDeviceLocale(); const isArabic = locale === "ar"; const isRtl = isRtlLocale(locale); const theme = darkTheme; const styles = useMemo(() => createStyles(theme), [theme]); const [signingOut,setSigningOut]=useState(false);
  async function signOut(){if(signingOut)return;setSigningOut(true);try{await signOutMobile();router.replace("/");}finally{setSigningOut(false)}}
  const rows = [
    { title: isArabic ? "الإشعارات" : "Notifications", subtitle: isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates", action: () => router.push("/notifications") },
    { title: isArabic ? "الصور والملف" : "Photos & portfolio", subtitle: isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio", action: () => router.push("/profile/media") },
    { title: isArabic ? "الدعم والسياسات" : "Support & policies", subtitle: isArabic ? "الدعم، الخصوصية، الشروط، الاسترداد والشكاوى" : "Support, privacy, terms, refunds and complaints", action: () => router.push("/support") },
  ];
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content,{direction:isRtl?"rtl":"ltr"}]} contentInsetAdjustmentBehavior="automatic">
    <View style={styles.top}><Pressable onPress={()=>router.back()} hitSlop={8}><Text style={styles.back}>{isArabic?"رجوع":"Back"}</Text></Pressable><Text style={styles.brand}>{isArabic?"ملامح":"MLAMH"}</Text></View>
    <View><Text style={styles.title}>{isArabic?"الإعدادات":"Settings"}</Text><Text style={styles.subtitle}>{isArabic?"إدارة تجربة ملامح من مكان واحد.":"Manage your MLAMH experience in one place."}</Text></View>
    <View style={styles.group}>{rows.map((row)=><Pressable key={row.title} style={styles.row} onPress={row.action}><View style={styles.rowText}><Text style={styles.rowTitle}>{row.title}</Text><Text style={styles.rowSubtitle}>{row.subtitle}</Text></View><Text style={styles.arrow}>{isRtl?"‹":"›"}</Text></Pressable>)}</View>
    <View style={styles.languageCard}><Text style={styles.rowTitle}>{isArabic?"اللغة":"Language"}</Text><Text style={styles.rowSubtitle}>{isArabic?"يتبع التطبيق لغة الجهاز حاليًا. مفتاح اللغة داخل التطبيق ضمن B3.":"The app currently follows device language. In-app language switching is scheduled for B3."}</Text></View>
    <Pressable disabled={signingOut} style={[styles.signOut,signingOut&&styles.disabled]} onPress={()=>void signOut()}><Text style={styles.signOutText}>{signingOut?(isArabic?"جارٍ تسجيل الخروج…":"Signing out…"):(isArabic?"تسجيل الخروج":"Sign out")}</Text></Pressable>
  </ScrollView>
}

function createStyles(theme:typeof darkTheme){return StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:680,alignSelf:"center",paddingHorizontal:20,paddingTop:36,paddingBottom:50,gap:22},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},back:{color:theme.text,fontSize:15,fontWeight:"700"},brand:{color:theme.accent,fontSize:18,fontWeight:"900",letterSpacing:1.5},title:{color:theme.text,fontSize:36,fontWeight:"900"},subtitle:{color:theme.muted,fontSize:15,lineHeight:23,marginTop:7},group:{borderWidth:1,borderColor:theme.border,borderRadius:18,overflow:"hidden"},row:{minHeight:76,paddingHorizontal:16,paddingVertical:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:theme.border},rowText:{flex:1,paddingRight:12},rowTitle:{color:theme.text,fontSize:16,fontWeight:"800"},rowSubtitle:{color:theme.muted,fontSize:12,lineHeight:18,marginTop:4},arrow:{color:theme.accent,fontSize:26},languageCard:{borderWidth:1,borderColor:theme.border,borderRadius:16,padding:16},signOut:{minHeight:54,borderRadius:14,borderWidth:1,borderColor:"#C84F4F66",alignItems:"center",justifyContent:"center"},signOutText:{color:"#E59A9A",fontSize:15,fontWeight:"900"},disabled:{opacity:.5}})}
