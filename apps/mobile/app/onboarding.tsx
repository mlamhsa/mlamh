import { useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Camera, Check, Clapperboard, Drama, Globe2, Megaphone, Star, Video } from "lucide-react-native";

import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

type TalentType = "actor" | "model";
type OnboardingResult = { ok?: boolean; code?: string };

const ACTOR_IMAGE = { uri: "https://mlamh.net/images/home/hero-actor.webp" };
const MODEL_IMAGE = { uri: "https://mlamh.net/images/home/hero-model.webp" };

async function submitTalentType(accessToken: string, talentType: TalentType) {
  const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/onboarding`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ talentType }) });
  const raw = await response.text().catch(() => "");
  let result: OnboardingResult = {};
  try { result = raw ? JSON.parse(raw) as OnboardingResult : {}; } catch { result = {}; }
  return { response, result };
}

export default function TalentOnboardingScreen() {
  const { locale, changeLocale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 720;
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
      router.replace("/profile");
    } catch {
      setError(isArabic ? "تعذر الاتصال بملامح الآن. تحقق من الإنترنت وحاول مرة أخرى." : "We couldn't reach MLAMH. Check your connection and try again.");
    } finally { setSaving(false); }
  }

  const continueLabel = isArabic ? "متابعة إلى ملفي" : "Continue to my profile";

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.topBar, compact && styles.topBarCompact, isRtl && styles.rowReverse]}>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={styles.iconButton}>{isRtl ? <ArrowRight size={23} color={theme.text} strokeWidth={1.8} /> : <ArrowLeft size={23} color={theme.text} strokeWidth={1.8} />}</Pressable>
          <View style={styles.brandLockup}><Text style={styles.brandWordmark}>MLAMH</Text><Text style={[styles.brandTagline, isArabic && styles.arabicText]}>{isArabic ? "المواهب والفرص" : "Talent & Opportunities"}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "Switch to English" : "التبديل إلى العربية"} onPress={() => changeLocale(isArabic ? "en" : "ar")} style={[styles.localeBadge, isRtl && styles.rowReverse]}><Globe2 size={18} color={theme.accent} strokeWidth={1.8} /><Text style={[styles.localeText, !isArabic && styles.arabicText]}>{isArabic ? "EN" : "ع"}</Text></Pressable>
        </View>

        <View style={[styles.header, { alignItems: isRtl ? "flex-end" : "flex-start" }]}>
          <Text style={[styles.eyebrow, isArabic && styles.arabicEyebrow, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "ملف الموهبة" : "TALENT PROFILE"}</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "اختر مسارك" : "Choose your path"}</Text>
          <Text style={[styles.subtitle, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "اختر تخصصك الأساسي الآن. سنستخدمه لبناء ملفك واقتراح الفرص الأقرب لك، ويمكنك تطوير ملفك لاحقًا." : "Choose your primary talent type. We'll use it to shape your profile and surface more relevant opportunities."}</Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.options}>
          <TalentChoice type="actor" active={selected === "actor"} title={isArabic ? "ممثل" : "Actor"} body={isArabic ? "للتمثيل، الإعلانات والمشاريع المرئية." : "For acting, commercials and screen projects."} bullets={isArabic ? ["التلفزيون والسينما", "الإعلانات", "المسرح"] : ["TV & Film", "Commercials", "Theatre"]} onPress={() => setSelected("actor")} styles={styles} isArabic={isArabic} isRtl={isRtl} compact={compact} />
          <TalentChoice type="model" active={selected === "model"} title={isArabic ? "مودل" : "Model"} body={isArabic ? "للتصوير، الحملات وأعمال المودل." : "For shoots, campaigns and modeling work."} bullets={isArabic ? ["جلسات التصوير", "الحملات", "الأزياء واللايف ستايل"] : ["Photoshoots", "Campaigns", "Fashion & Lifestyle"]} onPress={() => setSelected("model")} styles={styles} isArabic={isArabic} isRtl={isRtl} compact={compact} />
        </View>

        <Text style={[styles.selectionHint, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{selected ? (isArabic ? "ممتاز. يمكنك تعديل تخصصك من ملفك لاحقًا." : "Great. You can refine your talent profile later.") : (isArabic ? "اختر ممثل أو مودل للمتابعة." : "Choose Actor or Model to continue.")}</Text>
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{error}</Text></View> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={continueLabel} accessibilityState={{ disabled: !selected || saving, busy: saving }} disabled={!selected || saving} onPress={() => void continueOnboarding()} style={({ pressed }) => [styles.primaryButton, compact && styles.primaryButtonCompact, (!selected || saving) && styles.disabled, pressed && selected && !saving && styles.pressed]}>
          {saving ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ حفظ الاختيار" : "Saving selection"} color={theme.background} /> : <View style={[styles.primaryButtonRow, isRtl && styles.rowReverse]}><Text style={[styles.primaryText, isArabic && styles.arabicText]}>{continueLabel}</Text>{isRtl ? <ArrowLeft size={22} color={theme.background} strokeWidth={2} /> : <ArrowRight size={22} color={theme.background} strokeWidth={2} />}</View>}
        </Pressable>
        <View style={styles.footerDividerRow}><View style={styles.footerLine} /><Text style={[styles.footnote, isArabic && styles.arabicFootnote]}>{isArabic ? "موهبة حقيقية. فرص أكثر." : "REAL TALENT. MORE OPPORTUNITIES."}</Text><View style={styles.footerLine} /></View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function TalentChoice({ type, active, title, body, bullets, onPress, styles, isArabic, isRtl, compact }: { type: TalentType; active: boolean; title: string; body: string; bullets: string[]; onPress: () => void; styles: ReturnType<typeof createStyles>; isArabic: boolean; isRtl: boolean; compact: boolean }) {
  const image = type === "actor" ? ACTOR_IMAGE : MODEL_IMAGE;
  const bulletIcons = type === "actor" ? [Clapperboard, Video, Drama] : [Camera, Megaphone, Star];
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityHint={body} accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.choice, compact && styles.choiceCompact, active && styles.choiceActive, pressed && styles.choicePressed]}>
    <ImageBackground source={image} resizeMode="cover" style={styles.choiceImage} imageStyle={styles.choiceImageRadius}>
      <View style={styles.choiceOverlay} />
      <View style={[styles.choiceContent, compact && styles.choiceContentCompact, isRtl && styles.choiceContentRtl]}><View style={[styles.radio, active && styles.radioActive]}>{active ? <Check size={15} color={themeGold} strokeWidth={3} /> : null}</View><View style={[styles.choiceCopy, compact && styles.choiceCopyCompact]}><Text style={[styles.choiceTitle, compact && styles.choiceTitleCompact, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text><View style={[styles.goldRule, isRtl && styles.goldRuleRtl]} /><Text style={[styles.choiceBody, isArabic && styles.arabicText, { textAlign: isRtl ? "right" : "left" }]}>{body}</Text><View style={styles.bulletList}>{bullets.map((item, index) => { const Icon = bulletIcons[index]; return <View key={item} style={[styles.bulletRow, isRtl && styles.rowReverse]}><Icon size={compact ? 15 : 17} color="#D4AF6A" strokeWidth={1.6} /><Text style={[styles.bulletText, isArabic && styles.arabicText]}>{item}</Text></View>; })}</View></View></View>
    </ImageBackground>
  </Pressable>;
}

const themeGold = "#C9A962";

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, scrollContent: { flexGrow: 1, paddingVertical: Platform.OS === "ios" ? 10 : 8 }, scrollContentCompact:{paddingVertical:4}, content: { width: "100%", maxWidth: 560, alignSelf: "center", paddingHorizontal: 22, paddingTop: 8, paddingBottom: 26, gap: 18 }, contentCompact:{paddingHorizontal:14,paddingTop:4,paddingBottom:16,gap:13}, topBar: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, topBarCompact:{minHeight:62,gap:8}, rowReverse: { flexDirection: "row-reverse" }, iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth:1,borderColor:theme.border,backgroundColor:theme.surface,alignItems: "center", justifyContent: "center" }, brandLockup: { alignItems: "center", flex: 1 }, brandWordmark:{color:theme.accent,fontSize:19,lineHeight:23,fontWeight:"900",letterSpacing:3.4}, brandTagline: { color: theme.muted, fontSize: 9, lineHeight: 14, marginTop: 2 }, localeBadge: { minWidth: 52, height: 42, paddingHorizontal:10,borderWidth:1,borderColor:theme.border,borderRadius:21,backgroundColor:theme.surface,flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, localeText: { color: theme.text, fontSize: 13, fontWeight: "700" }, header: { gap: 8, marginTop: 4 }, eyebrow: { color: theme.accent, fontSize: 11, lineHeight: 16, fontWeight: "800", letterSpacing: 4 }, arabicEyebrow:{letterSpacing:0,writingDirection:"rtl"}, title: { color: theme.text, fontSize: 40, lineHeight: 47, fontWeight: "500", letterSpacing: -1 }, titleCompact:{fontSize:31,lineHeight:37}, subtitle: { color: theme.muted, fontSize: 15, lineHeight: 23, maxWidth: 480 }, options: { gap: 14 }, choice: { height: 236, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#FFFFFF26", backgroundColor: theme.surface }, choiceCompact:{height:204,borderRadius:18}, choiceActive: { borderColor: theme.accent, borderWidth: 1.7 }, choicePressed: { opacity: 0.9 }, choiceImage: { flex: 1 }, choiceImageRadius: { borderRadius: 19 }, choiceOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(3,3,3,0.46)" }, choiceContent: { flex: 1, padding: 18, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }, choiceContentCompact:{padding:14}, choiceContentRtl: { flexDirection: "row" }, choiceCopy: { width: "54%", paddingTop: 2 }, choiceCopyCompact:{width:"64%"}, choiceTitle: { color: theme.text, fontSize: 31, lineHeight: 36, fontWeight: "500" }, choiceTitleCompact:{fontSize:25,lineHeight:30}, goldRule: { width: 34, height: 2, backgroundColor: theme.accent, marginTop: 10, marginBottom: 12 }, goldRuleRtl:{alignSelf:"flex-end"}, choiceBody: { color: "#DDD9D0", fontSize: 13, lineHeight: 18 }, bulletList: { gap: 6, marginTop: 12 }, bulletRow: { flexDirection: "row", alignItems: "center", gap: 8 }, bulletText: { color: "#E6E0D5", fontSize: 12, lineHeight: 16, flexShrink:1 }, radio: { width: 29, height: 29, borderRadius: 15, borderWidth: 1.5, borderColor: "#FFFFFF66", backgroundColor: "#050505B8", alignItems: "center", justifyContent: "center" }, radioActive: { borderColor: theme.accent, backgroundColor: "#15120BEE" }, selectionHint:{color:theme.muted,fontSize:11,lineHeight:17,marginTop:-4}, errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 16, minHeight: 60, paddingHorizontal: 22, alignItems: "center", justifyContent: "center", marginTop: 2 }, primaryButtonCompact:{minHeight:54,paddingHorizontal:16}, primaryButtonRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, primaryText: { color: theme.background, fontSize: 17, lineHeight: 22, fontWeight: "800", flex: 1, textAlign: "center" }, disabled: { opacity: 0.38 }, pressed: { opacity: 0.84 }, footerDividerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 4 }, footerLine: { width: 40, height: 1, backgroundColor: "#C9A96255" }, footnote: { color: "#7F7B73", fontSize: 9, lineHeight: 14, textAlign: "center", letterSpacing: 2.8 }, arabicFootnote:{letterSpacing:0,writingDirection:"rtl"}, arabicText: { letterSpacing: 0, writingDirection:"rtl" },
}); }
