import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Languages, ShieldCheck, UserRound, HelpCircle } from "lucide-react-native";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { colors, radius, spacing } from "@/src/theme/tokens";

export default function SettingsScreen() {
  const { locale, setLocale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "MLAMH" : "MLAMH"}</Text>
        <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "الإعدادات" : "Settings"}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "إدارة اللغة والحساب والخصوصية والدعم." : "Manage language, account, privacy and support."}</Text>

        <View style={styles.card}>
          <SettingRow icon={Languages} label={isArabic ? "اللغة" : "Language"} value={isArabic ? "العربية" : "English"} isArabic={isArabic} onPress={() => void setLocale(isArabic ? "en" : "ar")} />
          <SettingRow icon={UserRound} label={isArabic ? "الحساب" : "Account"} value={session.status === "guest" ? (isArabic ? "تسجيل الدخول" : "Sign in") : (isArabic ? "إدارة الحساب" : "Manage account")} isArabic={isArabic} onPress={() => router.push(session.status === "guest" ? "/login" : "/account")} />
          <SettingRow icon={ShieldCheck} label={isArabic ? "الخصوصية والأمان" : "Privacy & security"} value={isArabic ? "إعدادات الحساب" : "Account controls"} isArabic={isArabic} onPress={() => router.push(session.status === "guest" ? "/login" : "/account")} />
          <SettingRow icon={HelpCircle} label={isArabic ? "المساعدة والدعم" : "Help & support"} value="support@mlamh.net" isArabic={isArabic} onPress={() => void Linking.openURL("mailto:support@mlamh.net")} />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon: Icon, label, value, isArabic, onPress }: { icon: typeof Languages; label: string; value: string; isArabic: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, isArabic && styles.rowRtl, pressed && styles.pressed]}>
      <View style={styles.icon}><Icon size={19} color={colors.gold} /></View>
      <View style={styles.copy}>
        <Text style={[styles.label, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{label}</Text>
        <Text style={[styles.value, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{value}</Text>
      </View>
      {isArabic ? <ChevronLeft size={18} color={colors.textMuted} /> : <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.background},
  content:{paddingHorizontal:spacing.lg,paddingTop:spacing.xl,paddingBottom:120},
  eyebrow:{color:colors.gold,fontSize:10,fontWeight:"800",letterSpacing:2},
  title:{color:colors.textPrimary,fontSize:30,lineHeight:38,fontWeight:"700",marginTop:spacing.sm},
  subtitle:{color:colors.textMuted,fontSize:13,lineHeight:22,marginTop:spacing.sm},
  card:{marginTop:spacing.xl,borderWidth:1,borderColor:colors.border,borderRadius:radius.xl,backgroundColor:colors.surface,overflow:"hidden"},
  row:{minHeight:76,flexDirection:"row",alignItems:"center",gap:spacing.md,paddingHorizontal:spacing.lg,borderBottomWidth:1,borderBottomColor:"rgba(255,255,255,.06)"},
  rowRtl:{flexDirection:"row-reverse"},
  icon:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:"rgba(201,169,98,.2)",backgroundColor:"rgba(201,169,98,.06)",alignItems:"center",justifyContent:"center"},
  copy:{flex:1},label:{color:colors.textPrimary,fontSize:14,fontWeight:"700"},value:{color:colors.textMuted,fontSize:11,marginTop:4},pressed:{opacity:.72}
});
