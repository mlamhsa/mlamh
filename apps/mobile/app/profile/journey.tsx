import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CheckCircle2, FileCheck2, ShieldCheck } from "lucide-react-native";

import { getTalentProfile, type MobileTalentProfile } from "@/lib/api";
import { MOBILE_API_BASE_URL } from "@/lib/api-config";
import { useAppLocale } from "@/lib/locale-context";
import { getMobileTalentReviewReadiness } from "@/lib/profile-review-readiness";
import { supabase } from "@/lib/supabase";
import { darkTheme } from "@/lib/theme";

function reviewSubmitted(profile: MobileTalentProfile) {
  return ["submitted", "pending", "approved"].includes(profile.approvalStatus ?? "");
}

async function getPrivacyConfigured() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;
  try {
    const response = await fetch(`${MOBILE_API_BASE_URL}/api/talent/me/privacy`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${session.access_token}` },
    });
    const payload = await response.json().catch(() => null) as { configured?: boolean } | null;
    return response.ok && payload?.configured === true;
  } catch { return false; }
}

export default function TalentProfileJourneyScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const styles = useMemo(() => createStyles(), []);
  const [profile, setProfile] = useState<MobileTalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAndRoute() {
      setLoading(true); setError(null);
      try {
        const result = await getTalentProfile(locale);
        if (!active) return;
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") router.replace({ pathname: "/login", params: { next: "/profile/journey" } });
          else setError(isArabic ? "تعذر تحميل رحلة ملفك." : "Unable to load your profile journey.");
          return;
        }

        const item = result.item;
        setProfile(item);
        const readiness = getMobileTalentReviewReadiness(item);
        const hasPhoto = readiness.requirements.find((requirement) => requirement.key === "profile_image")?.completed ?? false;
        const hasCore = readiness.requirements.filter((requirement) => requirement.key !== "profile_image").every((requirement) => requirement.completed);
        const submitted = reviewSubmitted(item);
        const approved = item.approvalStatus === "approved";

        if (submitted || approved) return;

        setRouting(true);
        if (!hasCore) {
          router.replace({ pathname: "/profile/edit", params: { onboarding: "1" } });
          return;
        }

        if (item.gender === "female") {
          const privacyConfigured = await getPrivacyConfigured();
          if (!active) return;
          if (!privacyConfigured) {
            router.replace({ pathname: "/profile/privacy", params: { onboarding: "1" } });
            return;
          }
        }

        if (!hasPhoto) {
          router.replace({ pathname: "/profile/media", params: { onboarding: "1" } });
          return;
        }

        if (readiness.isReady) {
          router.replace({ pathname: "/profile/review", params: { onboarding: "1" } });
          return;
        }

        router.replace({ pathname: "/profile/edit", params: { onboarding: "1" } });
      } catch {
        if (active) setError(isArabic ? "تعذر تحميل رحلة ملفك. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load your profile journey. Check your connection and try again.");
      } finally {
        if (active) { setLoading(false); setRouting(false); }
      }
    }
    void loadAndRoute();
    return () => { active = false; };
  }, [isArabic, locale]);

  if (loading || routing || !profile) return <SafeAreaView style={styles.screen}><View style={styles.center}><ActivityIndicator color={darkTheme.accent}/><Text style={styles.loadingText}>{isArabic ? "نجهز خطوتك التالية…" : "Preparing your next step…"}</Text></View></SafeAreaView>;

  const readiness = getMobileTalentReviewReadiness(profile);
  const hasPhoto = readiness.requirements.find((requirement) => requirement.key === "profile_image")?.completed ?? false;
  const hasCore = readiness.requirements.filter((requirement) => requirement.key !== "profile_image").every((requirement) => requirement.completed);
  const submitted = reviewSubmitted(profile);
  const approved = profile.approvalStatus === "approved";
  const completedSteps = 1 + (hasCore ? 1 : 0) + (hasPhoto ? 1 : 0) + (submitted ? 1 : 0);
  const progress = Math.min(100, completedSteps * 25);

  if (error) return <SafeAreaView style={styles.screen}><View style={styles.center}><Text style={styles.errorText}>{error}</Text><Pressable onPress={()=>router.replace("/profile")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic?"العودة للملف":"Back to profile"}</Text></Pressable></View></SafeAreaView>;

  const title = approved
    ? (readiness.isReady ? (isArabic ? "ملفك جاهز للفرص" : "Your profile is opportunity-ready") : (isArabic ? "اعتمادك محفوظ" : "Your approval is preserved"))
    : submitted
      ? (isArabic ? "ملفك وصل للمراجعة" : "Your profile is under review")
      : (isArabic ? "ملفك جاهز للإرسال" : "Your profile is ready to submit");

  const body = approved
    ? (readiness.isReady ? (isArabic ? "يمكنك استكشاف الفرص والتقديم حسب إعدادات ملفك." : "You can explore and apply to opportunities according to your profile settings.") : (isArabic ? "لا تحتاج لإعادة المراجعة. أكمل المتطلبات الحالية ثم عد للفرص." : "No new review is needed. Complete the current requirements, then return to opportunities."))
    : submitted
      ? (isArabic ? "تم إرسال ملفك بنجاح. سنحدث حالته هنا عند انتهاء المراجعة." : "Your profile was submitted successfully. We'll update its status here when review is complete.")
      : (isArabic ? "راجع ملفك ثم أرسله للمراجعة." : "Review your profile, then submit it for review.");

  return <SafeAreaView style={styles.screen} edges={["top","bottom"]}>
    <View style={styles.content}>
      <View style={styles.statusIcon}>{approved ? <CheckCircle2 size={30} color={darkTheme.accent}/> : submitted ? <ShieldCheck size={30} color={darkTheme.accent}/> : <FileCheck2 size={30} color={darkTheme.accent}/>}</View>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.progressCard}><View style={styles.progressRow}><Text style={styles.progressLabel}>{isArabic?"تقدم رحلة الإعداد":"Setup journey progress"}</Text><Text style={styles.progressValue}>{progress}%</Text></View><View style={styles.track}><View style={[styles.fill,{width:`${progress}%`}]} /></View><Text style={styles.progressHint}>{isArabic?"هذه نسبة رحلة الإعداد وليست نسبة اكتمال الملف.":"This is setup journey progress, not profile completion."}</Text></View>
      {approved && !readiness.isReady ? <Pressable onPress={()=>router.replace(hasPhoto?"/profile/edit":"/profile/media")} style={styles.primaryButton}><Text style={styles.primaryText}>{isArabic?"إكمال المتطلبات":"Complete requirements"}</Text></Pressable> : !submitted ? <Pressable onPress={()=>router.replace({pathname:"/profile/review",params:{onboarding:"1"}})} style={styles.primaryButton}><Text style={styles.primaryText}>{isArabic?"مراجعة الملف والإرسال":"Review and submit"}</Text></Pressable> : <Pressable onPress={()=>router.replace("/opportunities")} style={styles.primaryButton}><Text style={styles.primaryText}>{isArabic?"استكشف الفرص":"Explore opportunities"}</Text></Pressable>}
      <Pressable onPress={()=>router.replace("/profile")} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic?"عرض ملفي":"View my profile"}</Text></Pressable>
    </View>
  </SafeAreaView>;
}

function createStyles(){return StyleSheet.create({screen:{flex:1,backgroundColor:darkTheme.background},center:{flex:1,alignItems:"center",justifyContent:"center",paddingHorizontal:28,gap:14},loadingText:{color:darkTheme.muted,fontSize:14},content:{flex:1,width:"100%",maxWidth:560,alignSelf:"center",paddingHorizontal:22,justifyContent:"center",gap:18},statusIcon:{width:66,height:66,borderRadius:33,borderWidth:1,borderColor:"#4D4023",backgroundColor:"#1E1B14",alignItems:"center",justifyContent:"center",alignSelf:"center"},title:{color:darkTheme.text,fontSize:30,lineHeight:38,fontWeight:"800",textAlign:"center"},body:{color:"#AAA9A1",fontSize:14,lineHeight:22,textAlign:"center"},progressCard:{borderRadius:18,borderWidth:1,borderColor:"#292925",backgroundColor:"#151513",padding:16,gap:10},progressRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},progressLabel:{color:darkTheme.text,fontSize:12,fontWeight:"700"},progressValue:{color:darkTheme.accent,fontSize:14,fontWeight:"900"},track:{height:4,borderRadius:2,backgroundColor:"#2A2A26",overflow:"hidden"},fill:{height:"100%",backgroundColor:darkTheme.accent},progressHint:{color:"#85857E",fontSize:10,lineHeight:16},primaryButton:{minHeight:54,borderRadius:16,backgroundColor:darkTheme.accent,alignItems:"center",justifyContent:"center"},primaryText:{color:"#10100E",fontSize:15,fontWeight:"800"},secondaryButton:{minHeight:46,borderRadius:14,borderWidth:1,borderColor:"#343430",alignItems:"center",justifyContent:"center"},secondaryText:{color:darkTheme.text,fontSize:13,fontWeight:"700"},errorText:{color:"#F2B8B5",fontSize:13,lineHeight:20,textAlign:"center"}})}
