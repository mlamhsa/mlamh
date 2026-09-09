import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck, UsersRound } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { leaveAuthenticatedScreen } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type Visibility = "public" | "verified_publishers" | "private";
type PrivacyItem = {
  profileVisibility: Visibility;
  photoVisibility: Visibility;
  allowSearchIndexing: boolean;
  allowMlamhShare: boolean;
  requirePrivateShareApproval: boolean;
};

const OPTIONS: Array<{ value: Visibility; icon: "public" | "verified" | "private" }> = [
  { value: "verified_publishers", icon: "verified" },
  { value: "private", icon: "private" },
  { value: "public", icon: "public" },
];

export default function TalentPrivacyScreen() {
  const params = useLocalSearchParams<{ onboarding?: string }>();
  const onboarding = params.onboarding === "1";
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const styles = useMemo(() => createStyles(), []);
  const [selected, setSelected] = useState<Visibility>("verified_publishers");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.replace("/login"); return; }
      try {
        const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/me/privacy`, { headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` } });
        const payload = await response.json().catch(() => null) as { item?: PrivacyItem } | null;
        if (active && response.ok && payload?.item?.profileVisibility) setSelected(payload.item.profileVisibility);
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  function leavePrivacy() {
    if (onboarding) {
      router.replace("/profile/journey");
      return;
    }
    leaveAuthenticatedScreen("/profile");
  }

  async function saveAndContinue() {
    setSaving(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { router.replace("/login"); return; }
      const body: PrivacyItem = {
        profileVisibility: selected,
        photoVisibility: selected,
        allowSearchIndexing: selected === "public",
        allowMlamhShare: true,
        requirePrivateShareApproval: selected === "private",
      };
      const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/me/privacy`, {
        method: "PATCH",
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean } | null;
      if (!response.ok || !payload?.ok) {
        setError(isArabic ? "تعذر حفظ إعداد الخصوصية. حاول مرة أخرى." : "We could not save your privacy setting. Try again.");
        return;
      }
      if (onboarding) router.replace({ pathname: "/profile/media", params: { onboarding: "1" } });
      else leaveAuthenticatedScreen("/profile");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح الآن." : "We could not reach MLAMH right now.");
    } finally { setSaving(false); }
  }

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const textAlign = isRtl ? "right" : "left";

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.topRow, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={leavePrivacy} style={styles.backButton}><BackIcon size={21} color={darkTheme.text} /></Pressable>
        <Text style={styles.brand}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        <View style={styles.spacer} />
      </View>

      {onboarding ? <><View style={[styles.progressRow, isRtl && styles.rowRtl]}>{[0,1,2,3,4].map((i) => <View key={i} style={[styles.progressSegment, i <= 2 && styles.progressActive]} />)}</View><Text style={[styles.stepLabel,{textAlign}]}>{isArabic ? "الخطوة 3 من 5" : "Step 3 of 5"}</Text></> : null}

      <View style={[styles.hero, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
        <View style={styles.heroIcon}><ShieldCheck size={28} color={darkTheme.accent} /></View>
        <Text style={[styles.eyebrow,{textAlign}]}>{isArabic ? "خصوصيتك أولًا" : "PRIVACY FIRST"}</Text>
        <Text accessibilityRole="header" style={[styles.title,{textAlign}]}>{isArabic ? "أنتِ تتحكمين في ظهور ملفك" : "You control who sees your profile"}</Text>
        <Text style={[styles.subtitle,{textAlign}]}>{isArabic ? "يمكنك رفع صورك بدون إظهارها للعامة. اختاري مستوى الخصوصية المناسب قبل إضافة صورك." : "You can upload your photos without making them public. Choose the visibility level that feels right before adding photos."}</Text>
      </View>

      {loading ? <View style={styles.loadingCard}><ActivityIndicator color={darkTheme.accent} /></View> : <View accessibilityRole="radiogroup" style={styles.options}>
        {OPTIONS.map((option) => <PrivacyOption key={option.value} value={option.value} active={selected === option.value} icon={option.icon} isArabic={isArabic} isRtl={isRtl} onPress={() => setSelected(option.value)} />)}
      </View>}

      <View style={[styles.note, isRtl && styles.rowRtl]}><ShieldCheck size={18} color={darkTheme.accent} /><Text style={[styles.noteText,{textAlign}]}>{isArabic ? "الملف الخاص لا يعني ملفًا ناقصًا. الصور تحتسب ضمن جاهزية ملفك حتى لو لم تكن ظاهرة للعامة." : "A private profile is not an incomplete profile. Your uploaded photos still count toward readiness even when they are not public."}</Text></View>

      {error ? <View style={styles.errorBox}><Text style={[styles.errorText,{textAlign}]}>{error}</Text></View> : null}
      <Pressable accessibilityRole="button" disabled={saving || loading} onPress={() => void saveAndContinue()} style={({pressed}) => [styles.primaryButton,(saving||loading)&&styles.disabled,pressed&&styles.pressed]}>{saving ? <ActivityIndicator color="#10100E" /> : <Text style={styles.primaryText}>{onboarding ? (isArabic ? "حفظ ومتابعة للصور" : "Save and continue to photos") : (isArabic ? "حفظ الخصوصية" : "Save privacy")}</Text>}</Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function PrivacyOption({ value, active, icon, isArabic, isRtl, onPress }: { value: Visibility; active: boolean; icon: "public"|"verified"|"private"; isArabic: boolean; isRtl: boolean; onPress: () => void }) {
  const Icon = icon === "public" ? Eye : icon === "verified" ? UsersRound : EyeOff;
  const title = value === "public" ? (isArabic ? "عام" : "Public") : value === "verified_publishers" ? (isArabic ? "للناشرين الموثقين فقط" : "Verified publishers only") : (isArabic ? "ملف خاص" : "Private profile");
  const body = value === "public" ? (isArabic ? "يمكن أن يظهر ملفك وصورك في دليل المواهب والبحث العام." : "Your profile and photos may appear in the talent directory and public search.") : value === "verified_publishers" ? (isArabic ? "صورك لا تظهر للعامة، وتكون متاحة للجهات الموثقة داخل ملامح." : "Your photos stay off public pages and are available to verified organizations inside MLAMH.") : (isArabic ? "لا يظهر ملفك في الدليل العام، وتتم المشاركة فقط حسب إعداداتك وتفاعلك مع الفرص." : "Your profile stays out of the public directory and is shared only according to your settings and opportunity activity.");
  return <Pressable accessibilityRole="radio" accessibilityState={{selected:active}} onPress={onPress} style={[stylesStatic.option,active&&stylesStatic.optionActive]}>
    <View style={[stylesStatic.optionRow,isRtl&&stylesStatic.rowRtl]}>
      <View style={[stylesStatic.optionIcon,active&&stylesStatic.optionIconActive]}><Icon size={22} color={active?darkTheme.accent:darkTheme.text}/></View>
      <View style={stylesStatic.optionCopy}><View style={[stylesStatic.titleRow,isRtl&&stylesStatic.rowRtl]}><Text style={[stylesStatic.optionTitle,{textAlign:isRtl?"right":"left"}]}>{title}</Text>{value==="verified_publishers"?<Text style={stylesStatic.recommended}>{isArabic?"موصى به":"Recommended"}</Text>:null}</View><Text style={[stylesStatic.optionBody,{textAlign:isRtl?"right":"left"}]}>{body}</Text></View>
      <View style={[stylesStatic.radio,active&&stylesStatic.radioActive]}>{active?<Check size={13} color="#10100E" strokeWidth={3}/>:null}</View>
    </View>
  </Pressable>;
}

const stylesStatic = StyleSheet.create({option:{borderWidth:1,borderColor:"#2B2B28",borderRadius:20,backgroundColor:"#151513",padding:15},optionActive:{borderColor:"#796635",backgroundColor:"#1B1913"},optionRow:{flexDirection:"row",alignItems:"center",gap:12},rowRtl:{flexDirection:"row-reverse"},optionIcon:{width:44,height:44,borderRadius:14,backgroundColor:"#20201D",alignItems:"center",justifyContent:"center"},optionIconActive:{backgroundColor:"#292316"},optionCopy:{flex:1,gap:5},titleRow:{flexDirection:"row",alignItems:"center",gap:8},optionTitle:{color:darkTheme.text,fontSize:15,fontWeight:"800",flexShrink:1},recommended:{color:darkTheme.accent,fontSize:9,fontWeight:"800",borderWidth:1,borderColor:"#5A4B28",borderRadius:999,paddingHorizontal:7,paddingVertical:3},optionBody:{color:"#9D9C94",fontSize:12,lineHeight:18},radio:{width:22,height:22,borderRadius:11,borderWidth:1.5,borderColor:"#66665F",alignItems:"center",justifyContent:"center"},radioActive:{backgroundColor:darkTheme.accent,borderColor:darkTheme.accent}});

function createStyles(){return StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},content:{width:"100%",maxWidth:620,alignSelf:"center",paddingHorizontal:20,paddingBottom:30},topRow:{minHeight:62,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},rowRtl:{flexDirection:"row-reverse"},backButton:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#2B2B28",alignItems:"center",justifyContent:"center"},brand:{color:darkTheme.accent,fontSize:17,fontWeight:"900"},spacer:{width:42},progressRow:{flexDirection:"row",gap:6,marginTop:10},progressSegment:{height:3,flex:1,borderRadius:2,backgroundColor:"#2A2A26"},progressActive:{backgroundColor:darkTheme.accent},stepLabel:{color:"#8F8F88",fontSize:11,marginTop:8,width:"100%"},hero:{paddingTop:26,paddingBottom:20},heroIcon:{width:52,height:52,borderRadius:26,backgroundColor:"#1E1B14",borderWidth:1,borderColor:"#4D4023",alignItems:"center",justifyContent:"center",marginBottom:16},eyebrow:{color:darkTheme.accent,fontSize:11,fontWeight:"800",letterSpacing:1.1,width:"100%",marginBottom:8},title:{color:darkTheme.text,fontSize:29,lineHeight:37,fontWeight:"800",width:"100%"},subtitle:{color:"#AAA9A1",fontSize:14,lineHeight:22,marginTop:10,width:"100%"},options:{gap:11},loadingCard:{minHeight:220,borderRadius:20,borderWidth:1,borderColor:"#292925",alignItems:"center",justifyContent:"center"},note:{marginTop:14,flexDirection:"row",gap:10,alignItems:"flex-start",borderRadius:16,backgroundColor:"#11110F",padding:13},noteText:{flex:1,color:"#A5A49D",fontSize:12,lineHeight:19},errorBox:{marginTop:12,borderRadius:14,padding:12,backgroundColor:"#281718",borderWidth:1,borderColor:"#5A2C30"},errorText:{color:"#F2B8B5",fontSize:13,lineHeight:20},primaryButton:{minHeight:54,borderRadius:16,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center",marginTop:16},primaryText:{color:"#10100E",fontSize:15,fontWeight:"800"},disabled:{opacity:.45},pressed:{opacity:.82}})}