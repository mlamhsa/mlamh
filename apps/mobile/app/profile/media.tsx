import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Images, PlaySquare, ShieldCheck } from "lucide-react-native";

import { isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getTalentSpotlightStatus, type TalentSpotlightStatus } from "@/lib/spotlight-video";
import { darkTheme } from "@/lib/theme";

export default function TalentMediaHubScreen() {
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const params = useLocalSearchParams<{ onboarding?: string | string[] }>();
  const onboardingValue = Array.isArray(params.onboarding) ? params.onboarding[0] : params.onboarding;
  const onboarding = onboardingValue === "1";
  const [spotlight, setSpotlight] = useState<TalentSpotlightStatus | null>(null);

  useEffect(() => { void getTalentSpotlightStatus().then(setSpotlight); }, []);

  function openPhotos() {
    router.push({ pathname: "/profile/photos", params: onboarding ? { onboarding: "1" } : {} });
  }

  function leave() {
    if (onboarding) router.replace("/profile/journey");
    else router.back();
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={[styles.topRow, isRtl && styles.rowRtl]}>
          <Pressable onPress={leave} style={styles.iconButton}><BackIcon size={22} color={darkTheme.text} /></Pressable>
          <Text style={[styles.brand, directionText(isRtl)]}>{isArabic ? "ملامح" : "MLAMH"}</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, directionText(isRtl)]}>{isArabic ? "معرضك المهني" : "Your professional portfolio"}</Text>
          <Text style={[styles.subtitle, directionText(isRtl)]}>
            {isArabic
              ? "الصور تثبت حضورك بصريًا، وفيديو Spotlight القصير يضيف الحركة والصوت بدون تحويل ملامح إلى مخزن فيديوهات ثقيل."
              : "Photos show your visual presence, while a short Spotlight video adds motion and voice without turning MLAMH into heavy video storage."}
          </Text>
        </View>

        <Pressable onPress={openPhotos} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={[styles.cardTop, isRtl && styles.rowRtl]}><View style={styles.cardIcon}><Images size={23} color={darkTheme.accent} /></View><View style={styles.flex}><Text style={[styles.cardTitle, directionText(isRtl)]}>{isArabic ? "الصور" : "Photos"}</Text><Text style={[styles.cardBody, directionText(isRtl)]}>{isArabic ? "رتّب صورك، اختر الرئيسية، وأدر معرضك الحالي حتى 12 صورة." : "Arrange photos, choose the primary image, and manage your existing portfolio of up to 12 photos."}</Text></View></View>
          <Text style={[styles.action, directionText(isRtl)]}>{isArabic ? "إدارة الصور" : "Manage photos"}</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/profile/spotlight-video")} style={({ pressed }) => [styles.card, styles.videoCard, pressed && styles.pressed]}>
          <View style={[styles.cardTop, isRtl && styles.rowRtl]}><View style={styles.cardIcon}><PlaySquare size={23} color={darkTheme.accent} /></View><View style={styles.flex}><Text style={[styles.cardTitle, directionText(isRtl)]}>{isArabic ? "Spotlight Video" : "Spotlight Video"}</Text><Text style={[styles.cardBody, directionText(isRtl)]}>{isArabic ? "فيديو مهني واحد بحد أقصى 30 ثانية. لا تشغيل تلقائي، والبث يتم عبر مزود فيديو خارجي عند تفعيله." : "One professional video, up to 30 seconds. No autoplay; playback is delivered through a managed video provider once enabled."}</Text></View></View>
          <View style={[styles.policyRow, isRtl && styles.rowRtl]}><ShieldCheck size={15} color={darkTheme.accent} /><Text style={[styles.policyText, directionText(isRtl)]}>{spotlight?.policy.providerConfigured ? (isArabic ? "خدمة الفيديو جاهزة" : "Video service ready") : (isArabic ? "البنية جاهزة — مزود البث بانتظار التفعيل" : "Architecture ready — streaming provider awaiting activation")}</Text></View>
        </Pressable>

        {onboarding ? <Text style={[styles.onboardingHint, directionText(isRtl)]}>{isArabic ? "في التسجيل الأول يكفي أن تضيف صورة رئيسية واضحة. يمكنك إضافة الفيديو لاحقًا." : "During onboarding, one clear primary photo is enough. You can add the video later."}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

function directionText(isRtl: boolean) { return { textAlign: isRtl ? "right" as const : "left" as const, writingDirection: isRtl ? "rtl" as const : "ltr" as const }; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.background },
  content: { flex: 1, padding: 18, gap: 16 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowRtl: { flexDirection: "row-reverse" },
  iconButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface, alignItems: "center", justifyContent: "center" },
  brand: { flex: 1, color: darkTheme.accent, fontSize: 12, fontWeight: "900" },
  header: { gap: 7, marginTop: 4 },
  title: { color: darkTheme.text, fontSize: 28, lineHeight: 35, fontWeight: "900" },
  subtitle: { color: darkTheme.muted, fontSize: 12, lineHeight: 20 },
  card: { gap: 14, padding: 16, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 22, backgroundColor: darkTheme.surface },
  videoCard: { borderColor: "#C9A96244" },
  pressed: { opacity: 0.7 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIcon: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: "#C9A96244", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  cardTitle: { color: darkTheme.text, fontSize: 17, fontWeight: "900" },
  cardBody: { color: darkTheme.muted, fontSize: 11, lineHeight: 18, marginTop: 5 },
  action: { color: darkTheme.accent, fontSize: 11, fontWeight: "900" },
  policyRow: { flexDirection: "row", gap: 7, alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: darkTheme.border },
  policyText: { flex: 1, color: darkTheme.accent, fontSize: 10, lineHeight: 16 },
  onboardingHint: { color: darkTheme.muted, fontSize: 10, lineHeight: 17, paddingHorizontal: 4 },
});
