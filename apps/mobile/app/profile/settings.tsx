import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Bell, ChevronLeft, ChevronRight, Images, KeyRound, Languages, LifeBuoy, LogOut, Mail, Phone, Scale, Smartphone, SlidersHorizontal, Trash2, UserRound } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { leaveAuthenticatedScreen } from "@/lib/navigation";
import { preparePushRegistration, signOutMobile } from "@/lib/push";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

export default function ProfileSettingsScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [signingOut, setSigningOut] = useState(false);
  const [switchingLocale, setSwitchingLocale] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [email, setEmail] = useState("—");
  const [phone, setPhone] = useState("—");
  const [accountType, setAccountType] = useState<"talent" | "publisher" | null>(null);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const ForwardIcon = isRtl ? ChevronLeft : ChevronRight;

  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ data }, account] = await Promise.all([
        supabase.auth.getUser(),
        getMobileAccountContext().catch(() => null),
      ]);
      if (!active) return;
      setEmail(data.user?.email ?? "—");
      setPhone(account?.phone ?? (isArabic ? "غير مضاف" : "Not added"));
      setAccountType(account?.type ?? null);
    })();
    return () => { active = false; };
  }, [isArabic]);

  function chooseLocale(next: "ar" | "en") {
    if (next === locale || switchingLocale) return;
    setSwitchingLocale(true);
    if (!changeLocale(next)) { setSwitchingLocale(false); return; }
    requestAnimationFrame(() => setSwitchingLocale(false));
  }

  async function enableNotifications() {
    if (pushBusy) return;
    setPushBusy(true);
    setPushMessage(null);
    const result = await preparePushRegistration(locale);
    setPushBusy(false);
    if (result.ok) {
      setPushEnabled(true);
      setPushMessage(isArabic ? "تم تفعيل إشعارات ملامح على هذا الجهاز." : "MLAMH notifications are enabled on this device.");
      return;
    }
    const messages: Record<string, { ar: string; en: string }> = {
      PERMISSION_DENIED: { ar: "تم رفض إذن الإشعارات. يمكنك تفعيله من إعدادات الجهاز.", en: "Notification permission was denied. You can enable it in device settings." },
      PERMISSION_NOT_GRANTED: { ar: "لم يتم منح إذن الإشعارات بعد.", en: "Notification permission has not been granted yet." },
      UNAUTHENTICATED: { ar: "انتهت الجلسة. سجّل الدخول ثم حاول مرة أخرى.", en: "Your session expired. Sign in and try again." },
    };
    setPushMessage(messages[result.code]?.[locale] ?? (isArabic ? "تعذر تفعيل الإشعارات حاليًا." : "Unable to enable notifications right now."));
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOutMobile(); router.replace("/"); }
    finally { setSigningOut(false); }
  }

  const homeRoute = accountType === "publisher" ? "/publisher" : "/profile";
  const sectionLabelStyle = [styles.sectionLabel, isArabic && styles.sectionLabelArabic, isRtl && styles.textRtl];

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.top, isRtl && styles.rowRtl]}><Pressable accessibilityRole="button" onPress={() => leaveAuthenticatedScreen(homeRoute)} style={styles.backButton}><BackIcon size={20} strokeWidth={1.9} color={theme.text} /></Pressable><Text style={[styles.brand, isArabic && styles.brandArabic]}>{isArabic ? "ملامح" : "MLAMH"}</Text></View>
      <View style={[styles.hero, isRtl && styles.rowRtl]}><View style={styles.heroIcon}><SlidersHorizontal size={21} color={theme.accent} strokeWidth={1.8} /></View><View style={styles.heroCopy}><Text style={[styles.title, isRtl && styles.textRtl]}>{isArabic ? "الإعدادات" : "Settings"}</Text><Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "بيانات حسابك، اللغة، التنبيهات والخصوصية في مكان واحد." : "Your account, language, alerts and privacy in one place."}</Text></View></View>

      <Text style={sectionLabelStyle}>{isArabic ? "بيانات الحساب" : "ACCOUNT DETAILS"}</Text>
      <View style={styles.accountCard}>
        <AccountDetail icon={Mail} label={isArabic ? "البريد الإلكتروني" : "Email"} value={email} isRtl={isRtl} styles={styles} theme={theme} />
        <SettingsRow title={isArabic ? "رقم الجوال" : "Mobile number"} subtitle={phone} icon={Phone} onPress={() => router.push("/account/phone")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} />
        <SettingsRow title={isArabic ? "إعادة تعيين كلمة المرور" : "Reset password"} subtitle={isArabic ? "أرسل رابطًا آمنًا إلى بريدك لتغيير كلمة المرور" : "Send a secure link to your email to change your password"} icon={KeyRound} onPress={() => router.push("/forgot-password")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last />
      </View>

      <Text style={sectionLabelStyle}>{isArabic ? "التفضيلات" : "PREFERENCES"}</Text>
      <View style={styles.card}>
        <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Languages size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.cardHeadingCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "اللغة" : "Language"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "تتغير اللغة فورًا مع بقائك في الصفحة الحالية." : "Language changes instantly while keeping you on the current page."}</Text></View></View>
        <View style={styles.languageOptions}><Pressable disabled={switchingLocale} onPress={() => chooseLocale("ar")} style={[styles.languageOption, locale === "ar" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "ar" && styles.languageOptionTextActive]}>العربية</Text></Pressable><Pressable disabled={switchingLocale} onPress={() => chooseLocale("en")} style={[styles.languageOption, locale === "en" && styles.languageOptionActive]}><Text style={[styles.languageOptionText, locale === "en" && styles.languageOptionTextActive]}>English</Text></Pressable></View>
        {switchingLocale ? <View style={[styles.inline, isRtl && styles.rowRtl]}><ActivityIndicator size="small" color={theme.accent}/><Text style={[styles.microcopy, isRtl && styles.textRtl]}>{isArabic ? "جارٍ تطبيق اللغة…" : "Applying language…"}</Text></View> : null}
      </View>

      <View style={styles.card}>
        <View style={[styles.cardHeading, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Smartphone size={19} strokeWidth={1.9} color={theme.accent} /></View><View style={styles.cardHeadingCopy}><Text style={[styles.rowTitle, isRtl && styles.textRtl]}>{isArabic ? "تنبيهات الجهاز" : "Device alerts"}</Text><Text style={[styles.rowSubtitle, isRtl && styles.textRtl]}>{isArabic ? "استقبل تحديثات الطلبات والقبول والرسائل." : "Receive application, acceptance and message updates."}</Text></View><View style={[styles.statusDot, pushEnabled && styles.statusDotEnabled]} /></View>
        <Pressable disabled={pushBusy || pushEnabled} onPress={() => void enableNotifications()} style={[styles.pushButton, (pushBusy || pushEnabled) && styles.disabled]}>{pushBusy ? <ActivityIndicator color={theme.background}/> : <Text style={styles.pushButtonText}>{pushEnabled ? (isArabic ? "مفعّلة" : "Enabled") : (isArabic ? "تفعيل الإشعارات" : "Enable notifications")}</Text>}</Pressable>
        {pushMessage ? <Text accessibilityRole="alert" style={[styles.microcopy, isRtl && styles.textRtl]}>{pushMessage}</Text> : null}
      </View>

      <Text style={sectionLabelStyle}>{isArabic ? "التطبيق" : "APP"}</Text>
      <View style={styles.group}><SettingsRow title={isArabic ? "مركز الإشعارات" : "Notification center"} subtitle={isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates"} icon={Bell} onPress={() => router.push("/notifications")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last={accountType === "publisher"} />{accountType !== "publisher" ? <SettingsRow title={isArabic ? "الصور والملف" : "Photos & portfolio"} subtitle={isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio"} icon={Images} onPress={() => router.push("/profile/media")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last /> : null}</View>

      <Text style={sectionLabelStyle}>{isArabic ? "الدعم" : "SUPPORT"}</Text>
      <View style={styles.group}><SettingsRow title={isArabic ? "الشكاوى والدعم" : "Complaints & support"} subtitle={isArabic ? "افتح تذكرة وتابع طلبك من داخل ملامح" : "Open a ticket without leaving MLAMH"} icon={LifeBuoy} onPress={() => router.push("/support")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last /></View>

      <Text style={sectionLabelStyle}>{isArabic ? "القانوني" : "LEGAL"}</Text>
      <View style={styles.group}><SettingsRow title={isArabic ? "القانوني والسياسات" : "Legal & policies"} subtitle={isArabic ? "الخصوصية والشروط وسياسة الاسترداد داخل التطبيق" : "Privacy, terms and refund policy inside the app"} icon={Scale} onPress={() => router.push("/legal")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last /></View>

      <Text style={sectionLabelStyle}>{isArabic ? "الجلسة" : "SESSION"}</Text>
      <Pressable disabled={signingOut} style={[styles.signOut, isRtl && styles.rowRtl, signingOut && styles.disabled]} onPress={() => void signOut()}>{signingOut ? <ActivityIndicator color={theme.text} /> : <><LogOut size={18} strokeWidth={1.9} color={theme.text} /><View style={styles.signOutCopy}><Text style={[styles.signOutText,isRtl&&styles.textRtl]}>{isArabic ? "تسجيل الخروج" : "Sign out"}</Text><Text style={[styles.signOutHint,isRtl&&styles.textRtl]}>{isArabic ? "يمكنك تسجيل الدخول مرة أخرى في أي وقت." : "You can sign back in at any time."}</Text></View></>}</Pressable>

      <Text style={[...sectionLabelStyle, styles.dangerSectionLabel]}>{isArabic ? "منطقة حساسة" : "DANGER ZONE"}</Text>
      <View style={styles.group}><SettingsRow title={isArabic ? "حذف الحساب" : "Delete account"} subtitle={isArabic ? "إجراء نهائي منفصل عن تسجيل الخروج" : "A permanent action, separate from signing out"} icon={Trash2} onPress={() => router.push("/account/delete")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last danger /></View>
    </ScrollView>
  </SafeAreaView>;
}

function AccountDetail({ icon: Icon, label, value, isRtl, styles, theme }: { icon: typeof UserRound; label: string; value: string; isRtl: boolean; styles: ReturnType<typeof createStyles>; theme: typeof darkTheme }) { return <View style={[styles.accountRow, isRtl && styles.rowRtl]}><View style={styles.iconShell}><Icon size={18} color={theme.accent} strokeWidth={1.9}/></View><View style={styles.accountCopy}><Text style={[styles.accountLabel, isRtl && styles.textRtl]}>{label}</Text><Text numberOfLines={1} style={[styles.accountValue, isRtl && styles.textRtl]}>{value}</Text></View></View>; }
function SettingsRow({ title, subtitle, icon: RowIcon, onPress, isRtl, ForwardIcon, styles, theme, last = false, danger = false }: { title: string; subtitle: string; icon: typeof Bell; onPress: () => void; isRtl: boolean; ForwardIcon: typeof ChevronLeft; styles: ReturnType<typeof createStyles>; theme: typeof darkTheme; last?: boolean; danger?: boolean }) { return <Pressable style={[styles.row, last && styles.rowLast, isRtl && styles.rowRtl]} onPress={onPress}><View style={[styles.rowLead, isRtl && styles.rowRtl]}><View style={[styles.iconShell,danger&&styles.dangerIcon]}><RowIcon size={19} strokeWidth={1.9} color={danger?theme.danger:theme.accent}/></View><View style={styles.rowText}><Text style={[styles.rowTitle,danger&&styles.dangerText,isRtl&&styles.textRtl]}>{title}</Text><Text style={[styles.rowSubtitle,isRtl&&styles.textRtl]}>{subtitle}</Text></View></View><ForwardIcon size={18} strokeWidth={1.8} color={danger?theme.danger:theme.muted}/></Pressable>; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:680,alignSelf:"center",paddingHorizontal:20,paddingTop:12,paddingBottom:42,gap:17},contentCompact:{paddingHorizontal:14,gap:14},top:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",minHeight:54},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},backButton:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},brand:{color:theme.accent,fontSize:15,fontWeight:"900",letterSpacing:1.7},brandArabic:{letterSpacing:0},hero:{flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:"#C9A96233",borderRadius:22,backgroundColor:"#C9A96208",padding:16},heroIcon:{width:46,height:46,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",backgroundColor:"#C9A9620C",alignItems:"center",justifyContent:"center"},heroCopy:{flex:1},title:{color:theme.text,fontSize:28,lineHeight:34,fontWeight:"900"},subtitle:{color:theme.muted,fontSize:12,lineHeight:18,marginTop:3},sectionLabel:{color:theme.muted,fontSize:9,fontWeight:"900",letterSpacing:1.5,marginTop:3},sectionLabelArabic:{letterSpacing:0,fontSize:12},accountCard:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,overflow:"hidden"},accountRow:{minHeight:70,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:15,borderBottomWidth:1,borderBottomColor:theme.border},accountCopy:{flex:1},accountLabel:{color:theme.muted,fontSize:10,fontWeight:"700",marginBottom:4},accountValue:{color:theme.text,fontSize:14,fontWeight:"800"},card:{borderWidth:1,borderColor:theme.border,borderRadius:20,padding:15,gap:13,backgroundColor:theme.surface},cardHeading:{flexDirection:"row",alignItems:"center",gap:12},cardHeadingCopy:{flex:1},iconShell:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"#C9A9620B",borderWidth:1,borderColor:"#C9A96233"},languageOptions:{flexDirection:"row",gap:9},languageOption:{flex:1,minHeight:46,borderWidth:1,borderColor:theme.border,borderRadius:14,alignItems:"center",justifyContent:"center"},languageOptionActive:{borderColor:theme.accent,backgroundColor:"#C9A96218"},languageOptionText:{color:theme.muted,fontSize:13,fontWeight:"800"},languageOptionTextActive:{color:theme.accent},inline:{flexDirection:"row",alignItems:"center",gap:8},microcopy:{color:theme.muted,fontSize:11,lineHeight:17},statusDot:{width:9,height:9,borderRadius:5,backgroundColor:theme.grayMuted},statusDotEnabled:{backgroundColor:theme.accent},pushButton:{minHeight:48,borderRadius:14,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},pushButtonText:{color:theme.background,fontSize:13,fontWeight:"900"},group:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,overflow:"hidden"},row:{minHeight:72,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,borderBottomWidth:1,borderBottomColor:theme.border},rowLast:{borderBottomWidth:0},rowLead:{flex:1,flexDirection:"row",alignItems:"center",gap:12},rowText:{flex:1},rowTitle:{color:theme.text,fontSize:14,fontWeight:"900"},rowSubtitle:{color:theme.muted,fontSize:11,lineHeight:17,marginTop:3},signOut:{minHeight:68,borderRadius:18,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,flexDirection:"row",alignItems:"center",gap:11,paddingHorizontal:15},signOutCopy:{flex:1},signOutText:{color:theme.text,fontSize:14,fontWeight:"900"},signOutHint:{color:theme.muted,fontSize:10,lineHeight:16,marginTop:3},dangerSectionLabel:{color:theme.danger},dangerIcon:{borderColor:"#E59A9A44",backgroundColor:theme.dangerSurface},dangerText:{color:theme.danger},disabled:{opacity:.55}}); }