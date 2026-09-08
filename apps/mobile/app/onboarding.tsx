import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Camera, Check, Clapperboard, Drama, Globe2, Sparkles } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { goBackOrReplace } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type TalentType = "actor" | "model";
type OnboardingResult = { ok?: boolean; code?: string };

const LOGO_AR = require("../assets/logo.ar.png");
const LOGO_EN = require("../assets/logo.en.png");

async function submitTalentType(accessToken: string, talentType: TalentType) {
  const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/onboarding`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ talentType }),
  });
  const raw = await response.text().catch(() => "");
  let result: OnboardingResult = {};
  try { result = raw ? JSON.parse(raw) as OnboardingResult : {}; } catch { result = {}; }
  return { response, result };
}

export default function TalentOnboardingScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<TalentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueOnboarding() {
    if (!selected || saving) return;
    setSaving(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.replace({ pathname: "/login", params: { next: "/onboarding" } }); return; }
      let attempt = await submitTalentType(session.access_token, selected);
      if (attempt.response.status === 401 || attempt.result.code === "UNAUTHENTICATED") {
        const { data: refreshed } = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
        if (!refreshed.session?.access_token) { router.replace({ pathname: "/login", params: { next: "/onboarding" } }); return; }
        attempt = await submitTalentType(refreshed.session.access_token, selected);
      }
      if (!attempt.response.ok || !attempt.result.ok) {
        if (attempt.response.status === 401 || attempt.result.code === "UNAUTHENTICATED") { router.replace({ pathname: "/login", params: { next: "/onboarding" } }); return; }
        setError(attempt.result.code === "ACCOUNT_TYPE_CONFLICT" ? (isArabic ? "هذا الحساب مرتبط بنوع حساب آخر." : "This account is linked to another account type.") : (isArabic ? "تعذر حفظ نوع الموهبة. حاول مرة أخرى." : "We couldn't save your talent type. Please try again."));
        return;
      }
      router.replace("/profile/journey");
    } catch { setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again."); }
    finally { setSaving(false); }
  }

  const continueLabel = isArabic ? "تأكيد المسار والمتابعة" : "Confirm path and continue";
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.scrollCompact]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={[styles.topBar, isRtl && styles.rowRtl]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => goBackOrReplace("/account-type")} style={styles.iconButton}>{isRtl ? <ArrowRight size={22} color={theme.text}/> : <ArrowLeft size={22} color={theme.text}/>}</Pressable>
          <Image source={isArabic ? LOGO_AR : LOGO_EN} resizeMode="contain" style={styles.logo}/>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "English" : "العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={[styles.localeButton, isRtl && styles.rowRtl]}><Globe2 size={16} color={theme.accent}/><Text style={styles.localeText}>{isArabic ? "EN" : "العربية"}</Text></Pressable>
        </View>

        <View style={[styles.stepChip, isRtl && styles.rowRtl]}><Sparkles size={15} color={theme.accent}/><Text style={[styles.stepText, isRtl && styles.textRtl]}>{isArabic ? "اختيار التخصص الأساسي" : "Choose your primary specialty"}</Text></View>

        <View style={[styles.header, isRtl && styles.alignEnd]}>
          <Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{isArabic ? "ملف الموهبة" : "TALENT PROFILE"}</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isRtl && styles.textRtl]}>{isArabic ? "ما هو مسارك الأساسي؟" : "What's your primary path?"}</Text>
          <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{isArabic ? "اختر مسارًا واحدًا الآن. يمكنك تطوير بقية تفاصيل ملفك في الخطوات التالية بدون شاشة طويلة أو خيارات مربكة." : "Choose one primary path now. You'll build the rest of your profile in the guided steps that follow."}</Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.options}>
          <TalentChoice type="actor" active={selected === "actor"} title={isArabic ? "ممثل / ممثلة" : "Actor"} body={isArabic ? "للتمثيل، الإعلانات، التلفزيون والسينما." : "For acting, commercials, television and film."} hint={isArabic ? "مناسب إذا كان هدفك الأساسي فرص التمثيل." : "Best when acting is your main opportunity path."} onPress={() => { setSelected("actor"); setError(null); }} isRtl={isRtl}/>
          <TalentChoice type="model" active={selected === "model"} title={isArabic ? "مودل" : "Model"} body={isArabic ? "للتصوير، الحملات، الأزياء واللايف ستايل." : "For shoots, campaigns, fashion and lifestyle work."} hint={isArabic ? "مناسب إذا كان هدفك الأساسي أعمال المودل." : "Best when modeling is your main opportunity path."} onPress={() => { setSelected("model"); setError(null); }} isRtl={isRtl}/>
        </View>

        {selected ? <View style={[styles.selectionNote, isRtl && styles.rowRtl]}><Check size={16} color={theme.accent}/><Text style={[styles.selectionText, isRtl && styles.textRtl]}>{selected === "actor" ? (isArabic ? "تم اختيار مسار التمثيل" : "Acting path selected") : (isArabic ? "تم اختيار مسار المودل" : "Modeling path selected")}</Text></View> : null}
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, isRtl && styles.textRtl]}>{error}</Text></View> : null}

        <Pressable accessibilityRole="button" accessibilityLabel={continueLabel} accessibilityState={{ disabled: !selected || saving, busy: saving }} disabled={!selected || saving} onPress={() => void continueOnboarding()} style={({ pressed }) => [styles.primaryButton, (!selected || saving) && styles.disabled, pressed && selected && !saving && styles.pressed]}>{saving ? <ActivityIndicator color={theme.background}/> : <Text style={styles.primaryText}>{continueLabel}</Text>}</Pressable>
        <Text style={[styles.nextHint, isRtl && styles.textRtl]}>{isArabic ? "التالي: بياناتك الأساسية والمهنية، ثم الخصوصية عند الحاجة، ثم الصور والمراجعة." : "Next: core and professional details, privacy when needed, photos, then review."}</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function TalentChoice({ type, active, title, body, hint, onPress, isRtl }: { type: TalentType; active: boolean; title: string; body: string; hint: string; onPress: () => void; isRtl: boolean }) {
  const Icon = type === "actor" ? Clapperboard : Camera;
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [stylesStatic.choice, active && stylesStatic.choiceActive, pressed && stylesStatic.pressed]}>
    <View style={[stylesStatic.choiceRow, isRtl && stylesStatic.rowRtl]}><View style={[stylesStatic.choiceIcon, active && stylesStatic.choiceIconActive]}>{type === "actor" ? <Drama size={24} color={active ? "#C9A962" : "#ECEAE2"}/> : <Icon size={24} color={active ? "#C9A962" : "#ECEAE2"}/>}</View><View style={stylesStatic.choiceCopy}><Text style={[stylesStatic.choiceTitle, isRtl && stylesStatic.textRtl]}>{title}</Text><Text style={[stylesStatic.choiceBody, isRtl && stylesStatic.textRtl]}>{body}</Text><Text style={[stylesStatic.choiceHint, isRtl && stylesStatic.textRtl]}>{hint}</Text></View><View style={[stylesStatic.radio, active && stylesStatic.radioActive]}>{active ? <Check size={14} color="#050505" strokeWidth={3}/> : null}</View></View>
  </Pressable>;
}

const stylesStatic = StyleSheet.create({ choice:{borderWidth:1,borderColor:"#2B2B27",borderRadius:20,backgroundColor:"#141412",padding:16},choiceActive:{borderColor:"#C9A962",backgroundColor:"#1B1811"},pressed:{opacity:.84},choiceRow:{flexDirection:"row",alignItems:"center",gap:13},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},choiceIcon:{width:48,height:48,borderRadius:15,backgroundColor:"#22221F",alignItems:"center",justifyContent:"center"},choiceIconActive:{backgroundColor:"#2A2417"},choiceCopy:{flex:1,gap:4},choiceTitle:{color:"#F5F5F0",fontSize:17,fontWeight:"900"},choiceBody:{color:"#BBB9B1",fontSize:12,lineHeight:18},choiceHint:{color:"#7F7E77",fontSize:10,lineHeight:16},radio:{width:26,height:26,borderRadius:13,borderWidth:1.5,borderColor:"#5C5C55",alignItems:"center",justifyContent:"center"},radioActive:{backgroundColor:"#C9A962",borderColor:"#C9A962"} });

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({ screen:{flex:1,backgroundColor:theme.background},scrollContent:{flexGrow:1,paddingVertical:10},scrollCompact:{paddingVertical:4},content:{width:"100%",maxWidth:560,alignSelf:"center",paddingHorizontal:20,paddingBottom:26,gap:16},topBar:{minHeight:66,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},rowRtl:{flexDirection:"row-reverse"},alignEnd:{alignItems:"flex-end"},textRtl:{textAlign:"right",writingDirection:"rtl"},iconButton:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems:"center",justifyContent:"center"},logo:{width:120,height:40},localeButton:{minWidth:56,height:40,paddingHorizontal:9,borderRadius:20,borderWidth:1,borderColor:theme.border,flexDirection:"row",gap:6,alignItems:"center",justifyContent:"center"},localeText:{color:theme.text,fontSize:11,fontWeight:"800"},stepChip:{alignSelf:"stretch",minHeight:42,borderRadius:14,borderWidth:1,borderColor:"#C9A96232",backgroundColor:"#C9A96209",paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:8},stepText:{color:theme.accent,fontSize:11,fontWeight:"800"},header:{gap:7},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.4},title:{color:theme.text,fontSize:32,lineHeight:39,fontWeight:"800"},titleCompact:{fontSize:28,lineHeight:35},subtitle:{color:theme.muted,fontSize:13,lineHeight:21},options:{gap:11},selectionNote:{minHeight:44,borderRadius:14,borderWidth:1,borderColor:"#C9A96235",backgroundColor:"#C9A96208",paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:8},selectionText:{flex:1,color:theme.text,fontSize:11,fontWeight:"800"},errorBox:{borderWidth:1,borderColor:"#C84F4F66",backgroundColor:"#C84F4F14",borderRadius:14,padding:12},error:{color:"#E59A9A",fontSize:12,lineHeight:18},primaryButton:{minHeight:56,borderRadius:15,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center",marginTop:2},primaryText:{color:theme.background,fontSize:15,fontWeight:"900"},nextHint:{color:theme.muted,fontSize:10,lineHeight:16,textAlign:"center"},disabled:{opacity:.38},pressed:{opacity:.84} }); }
