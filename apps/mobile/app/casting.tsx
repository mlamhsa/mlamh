import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

const SITE = "https://mlamh.net";

export default function CastingScreen() {
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = createStyles(theme);

  const briefUrl = `${SITE}/${locale}/casting#casting-brief`;
  const castingUrl = `${SITE}/${locale}/casting`;

  async function openUrl(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]}>
    <View style={[styles.top, isRtl && styles.rowRtl]}>
      <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>{isRtl ? "›" : "‹"}</Text></Pressable>
      <Text style={styles.brand}>MLAMH CASTING</Text>
    </View>

    <View style={styles.hero}>
      <Text style={styles.eyebrow}>MLAMH CASTING</Text>
      <Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "عندك مشروع وتحتاج ممثلين أو مودلز؟" : "Need actors or models for a project?"}</Text>
      <Text style={[styles.subtitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "أرسل احتياجك حتى لو لم يكن إعلان الكاستينغ مكتملًا. ملامح تساعدك في تنظيم الـBrief والوصول إلى مواهب مناسبة للمراجعة." : "Send your requirements even if the casting notice is not finished. MLAMH helps organize the brief and connect you with suitable talent for review."}</Text>
    </View>

    <View style={styles.processCard}>
      <Text style={styles.cardEyebrow}>{isArabic ? "كيف تعمل" : "HOW IT WORKS"}</Text>
      <Step number="01" title={isArabic ? "أرسل الـBrief" : "Send the brief"} body={isArabic ? "حدد نوع المشروع والمدينة والموهبة المطلوبة وأي تفاصيل متاحة." : "Share the project, city, talent type and any requirements you already know."} styles={styles} isRtl={isRtl} />
      <Step number="02" title={isArabic ? "ننظم احتياجك" : "We structure the casting"} body={isArabic ? "يتم تحويل الاحتياج إلى مسار كاستينغ واضح وقابل للمراجعة." : "The requirements are shaped into a clear, review-ready casting flow."} styles={styles} isRtl={isRtl} />
      <Step number="03" title={isArabic ? "راجع المواهب" : "Review talent"} body={isArabic ? "راجع المتقدمين واتخذ القرار من خلال ملامح وفق صلاحيات الخصوصية والقبول." : "Review applicants and make decisions through MLAMH under the platform's privacy and acceptance rules."} styles={styles} isRtl={isRtl} last />
    </View>

    <View style={styles.audienceCard}>
      <Text style={[styles.audienceTitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "للشركات والوكالات والإنتاج والعلامات" : "For companies, agencies, production teams and brands"}</Text>
      <Text style={[styles.audienceBody, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "لا تحتاج تجهيز إعلان كامل قبل التواصل. ابدأ بالمعلومات المتوفرة لديك، ثم أكمل التفاصيل داخل مسار ملامح." : "You do not need a finished casting notice before reaching out. Start with what you know and complete the details through the MLAMH flow."}</Text>
    </View>

    <Pressable accessibilityRole="link" accessibilityLabel={isArabic ? "إرسال بريف الكاستينغ" : "Send casting brief"} onPress={() => void openUrl(briefUrl)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{isArabic ? "أرسل الـBrief" : "Send the brief"}</Text></Pressable>
    <Pressable accessibilityRole="link" onPress={() => void openUrl(castingUrl)} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>{isArabic ? "اعرف أكثر عن MLAMH Casting" : "Learn more about MLAMH Casting"}</Text></Pressable>

    <Text style={[styles.note, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "يُفتح نموذج الـBrief الرسمي على mlamh.net حتى يبقى التطبيق والويب على نفس المسار والبيانات بدون ازدواجية." : "The official brief opens on mlamh.net so mobile and web stay on one canonical workflow and data source."}</Text>
  </ScrollView>;
}

function Step({ number, title, body, styles, isRtl, last = false }: { number: string; title: string; body: string; styles: ReturnType<typeof createStyles>; isRtl: boolean; last?: boolean }) {
  return <View style={[styles.step, last && styles.stepLast, isRtl && styles.rowRtl]}><Text style={styles.stepNumber}>{number}</Text><View style={styles.stepCopy}><Text style={[styles.stepTitle, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text><Text style={[styles.stepBody, { textAlign: isRtl ? "right" : "left" }]}>{body}</Text></View></View>;
}

function createStyles(theme: typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { paddingHorizontal: 20, paddingTop: 42, paddingBottom: 54, gap: 18, width: "100%", maxWidth: 700, alignSelf: "center" },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    rowRtl: { flexDirection: "row-reverse" },
    back: { color: theme.text, fontSize: 31, lineHeight: 34 },
    brand: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
    hero: { paddingTop: 18, paddingBottom: 10, gap: 9 },
    eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: theme.text, fontSize: 34, lineHeight: 43, fontWeight: "700", maxWidth: 620 },
    subtitle: { color: theme.muted, fontSize: 14, lineHeight: 23, maxWidth: 620 },
    processCard: { borderWidth: 1, borderColor: "#C9A96233", borderRadius: 24, backgroundColor: "#C9A96208", padding: 17 },
    cardEyebrow: { color: theme.accent, fontSize: 8, fontWeight: "900", letterSpacing: 1.4, marginBottom: 4 },
    step: { flexDirection: "row", gap: 13, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.border },
    stepLast: { borderBottomWidth: 0, paddingBottom: 5 },
    stepNumber: { width: 32, color: theme.accent, fontSize: 11, fontWeight: "900" },
    stepCopy: { flex: 1, gap: 4 },
    stepTitle: { color: theme.text, fontSize: 14, fontWeight: "800" },
    stepBody: { color: theme.muted, fontSize: 11, lineHeight: 18 },
    audienceCard: { borderWidth: 1, borderColor: theme.border, borderRadius: 18, backgroundColor: theme.surface, padding: 16, gap: 7 },
    audienceTitle: { color: theme.text, fontSize: 15, fontWeight: "800" },
    audienceBody: { color: theme.muted, fontSize: 12, lineHeight: 20 },
    primary: { minHeight: 54, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
    primaryText: { color: theme.background, fontSize: 13, fontWeight: "900" },
    secondary: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
    secondaryText: { color: theme.text, fontSize: 12, fontWeight: "800" },
    pressed: { opacity: 0.7 },
    note: { color: theme.grayMuted, fontSize: 10, lineHeight: 17 },
  });
}
