import { router } from "expo-router";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Store, UserRound } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useLocale } from "@/src/i18n/LocaleProvider";
import { useSessionContext } from "@/src/runtime/SessionContext";
import { colors, radius, spacing } from "@/src/theme/tokens";

export function PublishersLandingScreen() {
  const { locale } = useLocale();
  const session = useSessionContext();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const Arrow = isArabic ? ArrowLeft : ArrowRight;
  const isPublisher = session.status === "publisher";

  const tracks = [
    { icon: UserRound, title: isArabic ? "فرد / صاحب مشروع" : "Individual / Project Owner", text: isArabic ? "للمصورين ومنظمي الفعاليات وأصحاب المشاريع والاحتياجات الفردية." : "For photographers, event organizers, project owners, and individual needs." },
    { icon: Store, title: isArabic ? "متجر / نشاط تجاري" : "Store / Business", text: isArabic ? "للمتاجر والصالونات والمشاريع التجارية التي تحتاج مودلز أو ممثلين للتصوير والمحتوى." : "For stores, salons, and businesses that need models or actors for shoots and content." },
    { icon: Building2, title: isArabic ? "شركة / مؤسسة / جهة" : "Company / Organization", text: isArabic ? "للشركات والوكالات والعلامات التجارية وشركات الإنتاج والمحتوى." : "For companies, agencies, brands, production, and content companies." },
  ];
  const primaryHref = isPublisher ? "/publisher-home" : "/account-type";
  const primaryLabel = isPublisher
    ? (isArabic ? "لوحة الناشر" : "Publisher Dashboard")
    : (isArabic ? "ابدأ كناشر" : "Start as a Publisher");

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.eyebrowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <BriefcaseBusiness size={15} color={colors.gold} />
            <Text style={styles.eyebrow}>{isArabic ? "ملامح للناشرين" : "MLAMH FOR PUBLISHERS"}</Text>
          </View>
          <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "تحتاج ممثلًا أو مودل؟ انشر احتياجك وابدأ من هنا." : "Need an actor or model? Post what you need and start here."}</Text>
          <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "ملامح تربط الأفراد وأصحاب المشاريع والمتاجر والشركات والوكالات والعلامات التجارية بالمواهب المناسبة في تجربة واحدة منظمة." : "MLAMH connects individuals, businesses, companies, agencies, and brands with the right talent in one organized experience."}</Text>
          <Pressable onPress={() => router.push(primaryHref as never)} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
            <Arrow size={17} color="#080808" />
          </Pressable>
        </View>

        <View style={styles.trackList}>
          {tracks.map(({ icon: Icon, title, text }) => (
            <View key={title} style={styles.trackCard}>
              <View style={[styles.trackTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
                <View style={styles.iconBox}><Icon size={21} color={colors.goldSoft} /></View>
                <Text style={[styles.trackTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{title}</Text>
              </View>
              <Text style={[styles.trackText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.stepsCard}>
          <Text style={[styles.stepsEyebrow, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "كيف تعمل ملامح؟" : "HOW MLAMH WORKS"}</Text>
          {[isArabic ? "أنشئ حساب الناشر" : "Create your publisher account", isArabic ? "انشر احتياجك" : "Post what you need", isArabic ? "اكتشف المواهب" : "Discover talent", isArabic ? "ابدأ التواصل" : "Start the conversation"].map((step, index) => (
            <View key={step} style={[styles.stepRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <Text style={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={[styles.stepText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center" }, rowLtr: { flexDirection: "row", alignItems: "center" },
  hero: { borderWidth: 1, borderColor: "rgba(201,169,98,0.20)", backgroundColor: "rgba(201,169,98,0.045)", borderRadius: 30, padding: spacing.xl },
  eyebrowRow: { gap: 7 }, eyebrow: { color: colors.gold, fontSize: 11, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 38, fontWeight: "700", marginTop: spacing.lg },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 23, marginTop: spacing.md },
  primary: { minHeight: 54, marginTop: spacing.xl, borderRadius: radius.pill, backgroundColor: colors.goldSoft, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryText: { color: "#080808", fontSize: 14, fontWeight: "700" }, pressed: { opacity: 0.82 },
  trackList: { gap: spacing.md, marginTop: spacing.lg }, trackCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 24, padding: spacing.lg },
  trackTop: { gap: spacing.md }, iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.20)", backgroundColor: "rgba(201,169,98,0.06)" },
  trackTitle: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: "700" }, trackText: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: spacing.md },
  stepsCard: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: 24, padding: spacing.lg }, stepsEyebrow: { color: colors.gold, fontSize: 11, marginBottom: spacing.sm },
  stepRow: { gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }, stepNumber: { color: colors.gold, fontSize: 12 }, stepText: { flex: 1, color: colors.textPrimary, fontSize: 14 },
});
