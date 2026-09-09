import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Clock3, PlaySquare, ShieldCheck } from "lucide-react-native";

import { formatLatinNumber, isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getTalentSpotlightStatus, type TalentSpotlightStatus } from "@/lib/spotlight-video";
import { darkTheme } from "@/lib/theme";

export default function TalentSpotlightVideoScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const [status, setStatus] = useState<TalentSpotlightStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getTalentSpotlightStatus().then((result) => { if (active) { setStatus(result); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const maxSeconds = status?.policy.maxDurationSeconds ?? 30;
  const providerReady = status?.policy.providerConfigured === true;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}><BackIcon size={22} color={darkTheme.text} /></Pressable>
          <Text style={[styles.brand, directionText(isRtl)]}>MLAMH</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.heroIcon}><PlaySquare size={28} color={darkTheme.accent} /></View>
          <Text style={[styles.title, directionText(isRtl)]}>{isArabic ? "Spotlight Video" : "Spotlight Video"}</Text>
          <Text style={[styles.subtitle, directionText(isRtl)]}>{isArabic ? "مقطع قصير يعرّف بحضورك، صوتك وحركتك بدون تحميل ثقيل على منصة ملامح." : "A short clip that shows your presence, voice and movement without heavy video storage inside MLAMH."}</Text>
        </View>

        <View style={styles.card}>
          <PolicyRow icon={Clock3} text={isArabic ? `الحد الأقصى ${formatLatinNumber(maxSeconds, "ar")} ثانية` : `Maximum ${formatLatinNumber(maxSeconds, "en")} seconds`} isRtl={isRtl} />
          <PolicyRow icon={ShieldCheck} text={isArabic ? "لا تشغيل تلقائي في نتائج البحث" : "No autoplay in discovery results"} isRtl={isRtl} />
          <PolicyRow icon={ShieldCheck} text={isArabic ? "لا رابط خام دائم للفيديو؛ المشاهدة عبر بث مُدار" : "No permanent raw video URL; playback uses managed streaming"} isRtl={isRtl} />
        </View>

        {loading ? <View style={styles.state}><ActivityIndicator color={darkTheme.accent} /><Text style={styles.stateText}>{isArabic ? "جارٍ فحص خدمة الفيديو…" : "Checking video service…"}</Text></View> : providerReady ? (
          <View style={styles.state}><Text style={[styles.readyTitle, directionText(isRtl)]}>{isArabic ? "خدمة البث جاهزة" : "Streaming service ready"}</Text><Text style={[styles.stateText, directionText(isRtl)]}>{isArabic ? "سيظهر زر اختيار الفيديو هنا بعد تفعيل محول الرفع المباشر للمزود المحدد." : "The direct-upload control will appear here once the selected provider adapter is enabled."}</Text></View>
        ) : (
          <View style={styles.state}><Text style={[styles.pendingTitle, directionText(isRtl)]}>{isArabic ? "ميزة الفيديو قيد التفعيل التشغيلي" : "Video is awaiting provider activation"}</Text><Text style={[styles.stateText, directionText(isRtl)]}>{isArabic ? "البنية والسياسة جاهزتان، لكننا لن نرفع فيديوهات إلى Vercel أو داخل المشروع. نحتاج تفعيل مزود بث خارجي مُدار أولًا." : "The architecture and policy are ready, but MLAMH will not upload videos into Vercel or the repository. A managed external video provider must be activated first."}</Text></View>
        )}
      </View>
    </SafeAreaView>
  );
}

function PolicyRow({ icon: Icon, text, isRtl }: { icon: typeof ShieldCheck; text: string; isRtl: boolean }) {
  return <View style={[styles.policyRow, isRtl && styles.rowRtl]}><Icon size={17} color={darkTheme.accent} /><Text style={[styles.policyText, directionText(isRtl)]}>{text}</Text></View>;
}
function directionText(isRtl: boolean) { return { textAlign: isRtl ? "right" as const : "left" as const, writingDirection: isRtl ? "rtl" as const : "ltr" as const }; }
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { flex: 1, padding: 18, gap: 16 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowRtl: { flexDirection: "row-reverse" },
  iconButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface, alignItems: "center", justifyContent: "center" },
  brand: { flex: 1, color: darkTheme.accent, fontSize: 12, fontWeight: "900" },
  header: { gap: 8, marginTop: 8 },
  heroIcon: { width: 58, height: 58, borderRadius: 20, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" },
  title: { color: darkTheme.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: darkTheme.muted, fontSize: 12, lineHeight: 20 },
  card: { gap: 0, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 20, backgroundColor: darkTheme.surface, overflow: "hidden" },
  policyRow: { minHeight: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: darkTheme.border },
  policyText: { flex: 1, color: darkTheme.text, fontSize: 11, lineHeight: 17 },
  state: { gap: 9, padding: 16, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 18, backgroundColor: darkTheme.surface, alignItems: "center" },
  stateText: { color: darkTheme.muted, fontSize: 11, lineHeight: 18 },
  readyTitle: { width: "100%", color: "#55CF98", fontSize: 15, fontWeight: "900" },
  pendingTitle: { width: "100%", color: darkTheme.accent, fontSize: 15, fontWeight: "900" },
});
