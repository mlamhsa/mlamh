import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Camera, Check, Circle, FileCheck2, Sparkles, UserRound } from "lucide-react-native";

import { getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getMobileTalentReviewReadiness } from "@/lib/profile-review-readiness";
import { darkTheme } from "@/lib/theme";

type StepState = "done" | "current" | "next";

const BRAND_AR = require("../../assets/logo.ar.png");
const BRAND_EN = require("../../assets/logo.en.png");

function reviewSubmitted(profile: MobileTalentProfile) {
  return ["submitted", "pending", "approved"].includes(profile.approvalStatus ?? "");
}

export default function TalentProfileJourneyScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [profile, setProfile] = useState<MobileTalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await getTalentProfile(locale);
      if (!result.ok) {
        if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/journey" } });
        else setError(isArabic ? "تعذر تحميل تقدم ملفك." : "Unable to load your profile progress.");
        return;
      }
      setProfile(result.item);
    } catch {
      setError(isArabic ? "تعذر تحميل تقدم ملفك. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your profile progress. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale]);

  useEffect(() => { void load(); }, [load]);

  const readiness = profile ? getMobileTalentReviewReadiness(profile) : null;
  const hasPhoto = readiness?.requirements.find((requirement) => requirement.key === "profile_image")?.completed ?? false;
  const hasCore = readiness ? readiness.requirements.filter((requirement) => requirement.key !== "profile_image").every((requirement) => requirement.completed) : false;
  const reviewReady = readiness?.isReady ?? false;
  const submitted = profile ? reviewSubmitted(profile) : false;
  const approved = profile?.approvalStatus === "approved";
  const approvedNeedsCompletion = approved && !reviewReady;
  const completedJourneySteps = 1 + (hasCore ? 1 : 0) + (hasPhoto ? 1 : 0) + (submitted ? 1 : 0);
  const progress = completedJourneySteps * 25;
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (loading) return <SafeAreaView style={styles.screen}><View style={styles.center}><ActivityIndicator color={theme.accent}/><Text style={styles.loadingText}>{isArabic ? "نجهز رحلتك" : "Preparing your journey"}</Text></View></SafeAreaView>;

  const reviewState: StepState = submitted ? "done" : reviewReady ? "current" : "next";
  const reviewBody = approvedNeedsCompletion
    ? (isArabic ? "اعتمادك محفوظ. أكمل المتطلبات الناقصة حتى يصبح ملفك جاهزًا للتقديم على الفرص." : "Your approval is preserved. Complete the missing requirements to make your profile ready to apply.")
    : approved
      ? (isArabic ? "ملفك معتمد وجاهز للظهور والتقديم حسب إعداداتك." : "Your profile is approved and ready to appear and apply according to your settings.")
      : submitted
        ? (isArabic ? "تم إرسال ملفك للمراجعة. راقب التنبيهات لأي تحديث." : "Your profile is under review. Watch notifications for updates.")
        : reviewReady
          ? (isArabic ? "كل متطلبات المراجعة جاهزة. راجع ملفك ثم أرسله." : "All review requirements are ready. Review your profile, then submit it.")
          : (isArabic ? "تفتح هذه الخطوة بعد اكتمال المتطلبات الأساسية والصورة الرئيسية." : "This step unlocks once the required profile details and primary photo are complete.");

  const title = approvedNeedsCompletion
    ? (isArabic ? "اعتمادك محفوظ — أكمل ملفك" : "Approval preserved — complete your profile")
    : approved
      ? (isArabic ? "ملفك جاهز للفرص" : "Your profile is opportunity-ready")
      : submitted
        ? (isArabic ? "ملفك وصل للمراجعة" : "Your profile is in review")
        : (isArabic ? "خلّ ملفك جاهز للفرص" : "Get your profile opportunity-ready");

  const subtitle = approvedNeedsCompletion
    ? (isArabic ? "لا تحتاج لإعادة المراجعة. أكمل البيانات أو الصورة الناقصة، وبعدها ارجع للفرص وابدأ التقديم." : "You do not need another review. Complete the missing details or photo, then return to opportunities and apply.")
    : approved
      ? (isArabic ? "استمر في تطوير معرضك وبياناتك، واستكشف الفرص المناسبة لك." : "Keep your portfolio fresh and explore opportunities that fit you.")
      : submitted
        ? (isArabic ? "أنجزت المطلوب حاليًا. لا تحتاج لإعادة الإرسال؛ سنحدث الحالة هنا عند اتخاذ قرار المراجعة." : "You’ve completed the current setup. No need to resubmit; this screen updates when review status changes.")
        : (isArabic ? "نمشي معك خطوة بخطوة. ركّز على البيانات المطلوبة أولًا، ثم الصور، وبعدها أرسل ملفك للمراجعة." : "We’ll guide you step by step: required details first, then your portfolio, then review submission.");

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent}/>}>
      <View style={[styles.topBar, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.replace("/profile")} style={styles.backButton}><BackIcon size={21} color={theme.text}/></Pressable>
        <Image source={isArabic ? BRAND_AR : BRAND_EN} resizeMode="contain" style={styles.brandLogo}/>
      </View>

      <View style={[styles.eyebrowRow, isRtl && styles.rowRtl]}><Sparkles size={14} color={theme.accent}/><Text style={[styles.eyebrow, isRtl && styles.textRtl]}>{isArabic ? "بناء الملف المهني" : "PROFESSIONAL PROFILE JOURNEY"}</Text></View>
      <Text accessibilityRole="header" style={[styles.title, isRtl && styles.textRtl]}>{title}</Text>
      <Text style={[styles.subtitle, isRtl && styles.textRtl]}>{subtitle}</Text>

      <View style={styles.progressCard}>
        <View style={[styles.progressCopy, isRtl && styles.rowRtl]}><Text style={[styles.progressLabel, isRtl && styles.textRtl]}>{isArabic ? "تقدم رحلة الإعداد" : "Setup journey progress"}</Text><Text style={styles.progressValue}>{progress}%</Text></View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
        <Text style={[styles.progressHint, isRtl && styles.textRtl]}>{approvedNeedsCompletion ? (isArabic ? "الاعتماد محفوظ — توجد متطلبات حالية تحتاج إكمالًا" : "Approval preserved — current requirements still need completion") : approved ? (isArabic ? "معتمد وجاهز" : "Approved and ready") : submitted ? (isArabic ? "تمت خطوات الإعداد والملف قيد المراجعة" : "Setup complete and profile is under review") : reviewReady ? (isArabic ? "3 من 4 خطوات مكتملة — جاهز للإرسال" : "3 of 4 steps complete — ready to submit") : (isArabic ? "هذه نسبة خطوات الإعداد وليست نسبة اكتمال الملف" : "This tracks setup steps, not profile completion")}</Text>
      </View>

      {error ? <View style={styles.errorCard}><Text style={[styles.errorText, isRtl && styles.textRtl]}>{error}</Text><Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View> : null}

      <JourneyStep index="1" state="done" icon={<Check size={17} color={theme.background} strokeWidth={3}/>} title={isArabic ? "اختيار المسار" : "Choose your path"} body={isArabic ? "تم تحديد نوع الموهبة." : "Your talent type is selected."} styles={styles} isRtl={isRtl}/>
      <JourneyStep index="2" state={hasCore ? "done" : "current"} icon={hasCore ? <Check size={17} color={theme.background} strokeWidth={3}/> : <UserRound size={18} color={theme.accent}/>} title={isArabic ? "البيانات الأساسية" : "Core details"} body={hasCore ? (isArabic ? "متطلبات البيانات الأساسية مكتملة. تقدر تعدلها في أي وقت." : "Your required profile details are complete.") : (isArabic ? "أكمل الاسم، المدينة، الجنس، الجنسية وتاريخ الميلاد." : "Complete your name, city, gender, nationality and date of birth.")} action={hasCore ? (isArabic ? "مراجعة البيانات" : "Review details") : (isArabic ? "أكمل البيانات" : "Complete details")} onPress={() => router.push({ pathname: "/profile/edit", params: { onboarding: "1" } })} styles={styles} isRtl={isRtl}/>
      <JourneyStep index="3" state={hasPhoto ? "done" : hasCore ? "current" : "next"} icon={hasPhoto ? <Check size={17} color={theme.background} strokeWidth={3}/> : <Camera size={18} color={hasCore ? theme.accent : theme.muted}/>} title={isArabic ? "الصور والمعرض" : "Photos & portfolio"} body={hasPhoto ? (isArabic ? "لديك صورة رئيسية. أضف أفضل أعمالك لملف أقوى." : "Your primary photo is set. Add your strongest work.") : (isArabic ? "أضف صورة رئيسية واضحة ثم ابنِ معرضك." : "Add a clear primary photo, then build your portfolio.")} action={hasCore || hasPhoto ? (isArabic ? "إدارة الصور" : "Manage photos") : undefined} onPress={hasCore || hasPhoto ? () => router.push({ pathname: "/profile/media", params: { onboarding: "1" } }) : undefined} styles={styles} isRtl={isRtl}/>
      <JourneyStep index="4" state={reviewState} icon={submitted ? <Check size={17} color={theme.background} strokeWidth={3}/> : <FileCheck2 size={18} color={reviewReady ? theme.accent : theme.muted}/>} title={isArabic ? "الجاهزية والمراجعة" : "Readiness & review"} body={reviewBody} action={approvedNeedsCompletion ? (isArabic ? "إكمال المتطلبات" : "Complete requirements") : submitted ? (isArabic ? "عرض حالة الملف" : "View profile status") : reviewReady ? (isArabic ? "مراجعة الجاهزية" : "Review readiness") : undefined} onPress={approvedNeedsCompletion ? () => router.push(hasPhoto ? "/profile/edit" : "/profile/media") : submitted ? () => router.replace("/profile") : reviewReady ? () => router.push({ pathname: "/profile/review", params: { onboarding: "1" } }) : undefined} styles={styles} isRtl={isRtl}/>

      <View style={styles.noteCard}><Circle size={10} color={theme.accent} fill={theme.accent}/><Text style={[styles.noteText, isRtl && styles.textRtl]}>{isArabic ? "تقدر ترجع لأي خطوة لاحقًا. الهدف الآن أن نجهز ملفًا واضحًا وقابلًا للمراجعة، وليس أن تملأ كل شيء من أول مرة." : "You can refine any step later. The goal now is a clear, review-ready profile — not filling every field at once."}</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

function JourneyStep({ index, state, icon, title, body, action, onPress, styles, isRtl }: { index: string; state: StepState; icon: React.ReactNode; title: string; body: string; action?: string; onPress?: () => void; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  const active = state === "current";
  const done = state === "done";
  return <View style={[styles.stepCard, active && styles.stepCardActive, done && styles.stepCardDone]}>
    <View style={[styles.stepTop, isRtl && styles.rowRtl]}><View style={[styles.stepBadge, done && styles.stepBadgeDone, active && styles.stepBadgeActive]}>{icon}</View><View style={styles.stepCopy}><Text style={[styles.stepIndex, isRtl && styles.textRtl]}>{index.padStart(2, "0")}</Text><Text style={[styles.stepTitle, isRtl && styles.textRtl]}>{title}</Text><Text style={[styles.stepBody, isRtl && styles.textRtl]}>{body}</Text></View></View>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [active ? styles.primaryAction : styles.secondaryAction, pressed && styles.pressed]}><Text style={active ? styles.primaryActionText : styles.secondaryActionText}>{action}</Text></Pressable> : null}
  </View>;
}

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background},content:{width:"100%",maxWidth:620,alignSelf:"center",paddingHorizontal:20,paddingTop:8,paddingBottom:34,gap:14},center:{flex:1,alignItems:"center",justifyContent:"center",gap:12},loadingText:{color:theme.muted,fontSize:13},rowRtl:{flexDirection:"row-reverse"},textRtl:{textAlign:"right",writingDirection:"rtl"},topBar:{minHeight:54,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},backButton:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:theme.surface},brandLogo:{width:92,height:34},eyebrowRow:{flexDirection:"row",alignItems:"center",gap:7,marginTop:6},eyebrow:{color:theme.accent,fontSize:10,fontWeight:"900",letterSpacing:1.6},title:{color:theme.text,fontSize:34,lineHeight:41,fontWeight:"800",marginTop:2},subtitle:{color:theme.muted,fontSize:14,lineHeight:22,maxWidth:540},progressCard:{borderWidth:1,borderColor:"#C9A96233",borderRadius:18,backgroundColor:"#C9A96208",padding:14,gap:10,marginTop:4},progressCopy:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},progressLabel:{color:theme.text,fontSize:12,fontWeight:"800"},progressValue:{color:theme.accent,fontSize:12,fontWeight:"900"},progressHint:{color:theme.muted,fontSize:10,lineHeight:15},track:{height:5,borderRadius:3,backgroundColor:"#FFFFFF12",overflow:"hidden"},fill:{height:"100%",backgroundColor:theme.accent,borderRadius:3},errorCard:{borderWidth:1,borderColor:"#C84F4F55",backgroundColor:"#C84F4F12",borderRadius:16,padding:13,gap:10},errorText:{color:"#E59A9A",fontSize:12,lineHeight:18},retry:{alignSelf:"flex-start",paddingVertical:4},retryText:{color:theme.accent,fontSize:12,fontWeight:"800"},stepCard:{borderWidth:1,borderColor:theme.border,borderRadius:20,backgroundColor:theme.surface,padding:15,gap:13},stepCardActive:{borderColor:theme.accent,backgroundColor:"#C9A96209"},stepCardDone:{borderColor:"#49C99133"},stepTop:{flexDirection:"row",alignItems:"flex-start",gap:12},stepBadge:{width:38,height:38,borderRadius:19,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:"#090909"},stepBadgeActive:{borderColor:theme.accent,backgroundColor:"#C9A96212"},stepBadgeDone:{borderColor:"#49C991",backgroundColor:"#49C991"},stepCopy:{flex:1,gap:3},stepIndex:{color:theme.accent,fontSize:9,fontWeight:"900",letterSpacing:1.4},stepTitle:{color:theme.text,fontSize:16,fontWeight:"900"},stepBody:{color:theme.muted,fontSize:11,lineHeight:17},primaryAction:{minHeight:50,borderRadius:14,backgroundColor:theme.accent,alignItems:"center",justifyContent:"center"},primaryActionText:{color:theme.background,fontSize:14,fontWeight:"900"},secondaryAction:{minHeight:46,borderRadius:14,borderWidth:1,borderColor:theme.border,alignItems:"center",justifyContent:"center",backgroundColor:"#090909"},secondaryActionText:{color:theme.text,fontSize:13,fontWeight:"800"},pressed:{opacity:.82},noteCard:{flexDirection:"row",alignItems:"flex-start",gap:9,paddingHorizontal:3,paddingTop:4},noteText:{flex:1,color:"#777771",fontSize:10,lineHeight:16}
}); }
