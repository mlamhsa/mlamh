from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"pattern missing in {path}: {old[:160]!r}")
    p.write_text(s.replace(old, new, count))


replace('apps/mobile/app.json', '"buildNumber": "12"', '"buildNumber": "13"')
replace('apps/mobile/app.json', '"versionCode": 12', '"versionCode": 13')

replace('apps/mobile/app/publisher/index.tsx', 'contentContainerStyle={[s.content,{paddingTop:Math.max(insets.top+16,26)}]}', 'contentContainerStyle={[s.content,{paddingTop:Math.max(insets.top+28,42)}]}')
old = 'ListFooterComponent={<View style={s.footer}><Pressable onPress={()=>router.push("/publisher/settings")} style={[s.settingsRow,rtl&&s.rowRtl]}><Settings size={18} color={darkTheme.accent}/><View style={s.flex}><Text style={[s.settingsTitle,txt(rtl)]}>{ar?"الإعدادات والخصوصية":"Settings & privacy"}</Text><Text style={[s.meta,txt(rtl)]}>{ar?"الإشعارات، اللغة، الأمان، الدعم وحذف الحساب":"Notifications, language, security, support and account deletion"}</Text></View></Pressable></View>}'
replace('apps/mobile/app/publisher/index.tsx', old, 'ListFooterComponent={<View style={{height:18}}/>}')

replace('apps/mobile/app/profile/settings.tsx', 'const [phone, setPhone] = useState("—");', 'const [phone, setPhone] = useState("—");\n  const [accountType, setAccountType] = useState<"talent" | "publisher" | null>(null);')
replace('apps/mobile/app/profile/settings.tsx', 'setPhone(account?.phone ?? (isArabic ? "غير مضاف" : "Not added"));', 'setPhone(account?.phone ?? (isArabic ? "غير مضاف" : "Not added"));\n      setAccountType(account?.type ?? null);')
replace('apps/mobile/app/profile/settings.tsx', '<AccountDetail icon={Phone} label={isArabic ? "رقم الجوال" : "Mobile number"} value={phone} isRtl={isRtl} styles={styles} theme={theme} />', '<SettingsRow title={isArabic ? "رقم الجوال" : "Mobile number"} subtitle={phone} icon={Phone} onPress={() => router.push("/account/phone")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} />')
old = '<View style={styles.group}><SettingsRow title={isArabic ? "مركز الإشعارات" : "Notification center"} subtitle={isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates"} icon={Bell} onPress={() => router.push("/notifications")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} /><SettingsRow title={isArabic ? "الصور والملف" : "Photos & portfolio"} subtitle={isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio"} icon={Images} onPress={() => router.push("/profile/media")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last /></View>'
new = '<View style={styles.group}><SettingsRow title={isArabic ? "مركز الإشعارات" : "Notification center"} subtitle={isArabic ? "عرض التنبيهات وحالة القراءة" : "View alerts and unread updates"} icon={Bell} onPress={() => router.push("/notifications")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last={accountType === "publisher"} />{accountType !== "publisher" ? <SettingsRow title={isArabic ? "الصور والملف" : "Photos & portfolio"} subtitle={isArabic ? "إدارة الصورة الرئيسية ومعرض الأعمال" : "Manage your primary photo and portfolio"} icon={Images} onPress={() => router.push("/profile/media")} isRtl={isRtl} ForwardIcon={ForwardIcon} styles={styles} theme={theme} last /> : null}</View>'
replace('apps/mobile/app/profile/settings.tsx', old, new)

replace('apps/mobile/app/notifications/index.tsx', 'import { ArrowUpRight, BellRing, CheckCircle2, Clock3, Inbox } from "lucide-react-native";', 'import { ArrowUpRight, BellRing, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Inbox } from "lucide-react-native";')
replace('apps/mobile/app/notifications/index.tsx', 'import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";', 'import { isRtlLocale } from "@/lib/i18n";\nimport { useAppLocale } from "@/lib/locale-context";')
replace('apps/mobile/app/notifications/index.tsx', 'const locale = getDeviceLocale();', 'const { locale } = useAppLocale();')
needle = 'const theme = darkTheme;\n  const styles = useMemo(() => createStyles(theme), [theme]);'
replace('apps/mobile/app/notifications/index.tsx', needle, needle + '\n  const BackIcon = isRtl ? ChevronRight : ChevronLeft;')
old = '<View style={[styles.topRow, isRtl && styles.rowRtl]}>\n              <View style={styles.headingCopy}>'
new = '<View style={[styles.topRow, isRtl && styles.rowRtl]}>\n              <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.backButton}><BackIcon size={20} color={theme.text} strokeWidth={1.9}/></Pressable>\n              <View style={styles.headingCopy}>'
replace('apps/mobile/app/notifications/index.tsx', old, new)
replace('apps/mobile/app/notifications/index.tsx', 'const actionLabel = accountType === "publisher" ? (ar ? "العودة للرئيسية" : "Back to dashboard") : (ar ? "استكشف الفرص" : "Explore opportunities");\n  const action = () => accountType === "publisher" ? router.replace("/publisher") : router.replace("/opportunities");', 'const actionLabel = ar ? "رجوع" : "Back";\n  const action = () => router.back();')
replace('apps/mobile/app/notifications/index.tsx', 'topRow: {', 'backButton:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},\n    topRow: {')

replace('apps/mobile/app/talents/index.tsx', '        <Text style={[styles.count, directionText(isRtl)]}>{resultLabel}</Text>', '')
replace('apps/mobile/app/talents/index.tsx', '  const resultLabel = isArabic\n    ? `${formatLatinNumber(total, "ar")} موهبة`\n    : `${formatLatinNumber(total, "en")} talent${total === 1 ? "" : "s"}`;\n\n', '')
replace('apps/mobile/app/talents/index.tsx', '"ابحث باحتراف بدون كشف بيانات التواصل الخاصة. الوصول يتدرج حسب الثقة وسياق المشروع."', '"اكتشف المواهب المناسبة لمشروعك مع بحث احترافي وحماية كاملة لبيانات التواصل."')

replace('apps/mobile/app/publisher/opportunities/new.tsx', 'contentContainerStyle={s.content}', 'contentContainerStyle={[s.content,{flexGrow:1}]}')
replace('apps/mobile/app/publisher/opportunities/new.tsx', 'content:{', 'content:{flexGrow:1,')

phone = '''import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react-native";

import { getMobileAccountContext } from "@/lib/account";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

function normalizePhone(value:string){const t=value.trim();return t.startsWith("+")?`+${t.replace(/\\D/g,"")}`:t.replace(/\\D/g,"");}
function validPhone(value:string){return /^\\+[1-9]\\d{7,14}$/.test(value);}

export default function AccountPhoneScreen(){
  const {locale}=useAppLocale(); const ar=locale==="ar",rtl=isRtlLocale(locale); const BackIcon=rtl?ChevronRight:ChevronLeft;
  const [phone,setPhone]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState<string|null>(null); const [error,setError]=useState<string|null>(null);
  const [account,setAccount]=useState<Awaited<ReturnType<typeof getMobileAccountContext>>>(null);
  useEffect(()=>{let active=true; void getMobileAccountContext().then((x)=>{if(!active)return;setAccount(x);setPhone(x?.phone??"");setLoading(false);}).catch(()=>setLoading(false));return()=>{active=false};},[]);
  const save=async()=>{const normalized=normalizePhone(phone);if(!validPhone(normalized)){setError(ar?"أدخل رقمًا دوليًا صحيحًا مثل +9665XXXXXXXX.":"Enter a valid international number such as +9665XXXXXXXX.");return;}if(!account?.displayName||!account.type){setError(ar?"تعذر قراءة بيانات الحساب.":"Unable to read account details.");return;}setSaving(true);setError(null);setMessage(null);try{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token){router.replace("/login");return;}const r=await fetch(`${MOBILE_API_BASE_URL}/api/account/details`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({displayName:account.displayName,phone:normalized,accountType:account.type})});const raw=await r.text();let payload:any={};try{payload=raw?JSON.parse(raw):{}}catch{}if(!r.ok||payload.ok!==true){setError(ar?"تعذر حفظ رقم الجوال. حاول مرة أخرى.":"Unable to save your mobile number. Try again.");return;}setPhone(normalized);setMessage(ar?"تم حفظ الرقم. سيبقى غير موثّق حتى إكمال التحقق عند توفره.":"Number saved. It remains unverified until verification is completed.");}catch{setError(ar?"تعذر الاتصال بملامح الآن.":"Unable to reach MLAMH right now.");}finally{setSaving(false)}};
  return <SafeAreaView style={s.screen} edges={["top","bottom"]}><KeyboardAvoidingView style={s.screen} behavior={Platform.OS==="ios"?"padding":undefined}><View style={s.content}><View style={[s.top,rtl&&s.rowRtl]}><Pressable onPress={()=>router.back()} style={s.back}><BackIcon size={20} color={darkTheme.text}/></Pressable><Text style={[s.brand,txt(rtl)]}>{ar?"ملامح":"MLAMH"}</Text><View style={s.spacer}/></View><View style={s.hero}><View style={s.icon}><Phone size={22} color={darkTheme.accent}/></View><Text style={[s.title,txt(rtl)]}>{ar?"رقم الجوال":"Mobile number"}</Text><Text style={[s.subtitle,txt(rtl)]}>{ar?"أضف أو عدّل رقم الجوال المرتبط بحسابك باستخدام الصيغة الدولية.":"Add or update the mobile number linked to your account using international format."}</Text></View>{loading?<ActivityIndicator color={darkTheme.accent}/>:<View style={s.card}><Text style={[s.label,txt(rtl)]}>{ar?"رقم الجوال":"Mobile number"}</Text><TextInput value={phone} onChangeText={(v)=>{setPhone(v);setError(null);setMessage(null)}} keyboardType="phone-pad" autoComplete="tel" placeholder="+9665XXXXXXXX" placeholderTextColor={darkTheme.muted} style={s.input}/><Text style={[s.helper,txt(rtl)]}>{ar?"مثال: +9665XXXXXXXX":"Example: +9665XXXXXXXX"}</Text>{error?<Text style={[s.error,txt(rtl)]}>{error}</Text>:null}{message?<Text style={[s.success,txt(rtl)]}>{message}</Text>:null}<Pressable disabled={saving} onPress={()=>void save()} style={[s.save,saving&&s.disabled]}>{saving?<ActivityIndicator color={darkTheme.background}/>:<Text style={s.saveText}>{ar?"حفظ الرقم":"Save number"}</Text>}</Pressable></View>}</View></KeyboardAvoidingView></SafeAreaView>;
}
function txt(rtl:boolean){return{textAlign:rtl?"right" as const:"left" as const,writingDirection:rtl?"rtl" as const:"ltr" as const}}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{flex:1,paddingHorizontal:20,paddingBottom:24},top:{minHeight:64,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},rowRtl:{flexDirection:"row-reverse"},back:{width:42,height:42,borderRadius:14,borderWidth:1,borderColor:darkTheme.border,alignItems:"center",justifyContent:"center"},spacer:{width:42},brand:{color:darkTheme.accent,fontWeight:"900",fontSize:15},hero:{paddingTop:22,paddingBottom:22,gap:8},icon:{width:44,height:44,borderRadius:15,borderWidth:1,borderColor:"#C9A96244",alignItems:"center",justifyContent:"center",marginBottom:4},title:{color:darkTheme.text,fontSize:28,fontWeight:"900"},subtitle:{color:darkTheme.muted,fontSize:13,lineHeight:21},card:{padding:18,borderWidth:1,borderColor:darkTheme.border,borderRadius:22,backgroundColor:darkTheme.surface,gap:10},label:{color:darkTheme.text,fontSize:13,fontWeight:"800"},input:{minHeight:54,borderWidth:1,borderColor:darkTheme.border,borderRadius:15,backgroundColor:darkTheme.background,color:darkTheme.text,paddingHorizontal:14,fontSize:15,textAlign:"left",writingDirection:"ltr"},helper:{color:darkTheme.muted,fontSize:11},error:{color:"#E59A9A",fontSize:12},success:{color:"#55CF98",fontSize:12},save:{minHeight:52,borderRadius:15,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center",marginTop:6},saveText:{color:darkTheme.background,fontWeight:"900"},disabled:{opacity:.5}});
'''
p = Path('apps/mobile/app/account/phone.tsx')
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(phone)
