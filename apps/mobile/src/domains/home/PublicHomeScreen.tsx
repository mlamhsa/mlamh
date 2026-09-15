import { router, type Href } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react-native";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeHowItWorksSection } from "@/src/domains/home/HomeHowItWorksSection";
import { HomeValuePropsSection } from "@/src/domains/home/HomeValuePropsSection";
import { useHomeContent } from "@/src/domains/home/useHomeContent";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

const IMAGE_BASE = "https://mlamh.net/images/home";

function go(href: string) {
  router.push(href as Href);
}

function nativeHref(href: string | null | undefined, fallback: string) {
  if (!href) return fallback;
  const clean = href.split("#")[0].split("?")[0].replace(/^https?:\/\/[^/]+/i, "");
  const withoutLocale = clean.replace(/^\/(ar|en)(?=\/|$)/, "");
  if (withoutLocale === "/talent" || withoutLocale.startsWith("/talent/")) return "/talents";
  if (withoutLocale.startsWith("/opportunities")) return "/opportunities";
  if (withoutLocale.startsWith("/publishers")) return "/publishers";
  if (withoutLocale.startsWith("/casting")) return "/casting";
  if (withoutLocale.startsWith("/join")) return "/account-type";
  return fallback;
}

export function PublicHomeScreen() {
  const { locale } = useLocale();
  const { hero, valueProps } = useHomeContent(locale);
  const isArabic = locale === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;
  const align = isArabic ? "right" : "left";

  const heroEyebrow = hero?.eyebrow || (isArabic ? "منصة المواهب الإبداعية" : "Creative talent platform");
  const heroTitle = hero?.titleLine1 || (isArabic ? "اكتشف فرصتك القادمة" : "Discover your next opportunity");
  const heroTitle2 = hero?.titleLine2 || "";
  const heroDescription = hero?.description || (isArabic
    ? "اكتشف المواهب والفرص والجهات الإبداعية من مكان واحد."
    : "Discover talents, opportunities, and creative organizations in one place.");
  const primaryLabel = hero?.primaryCtaLabel || (isArabic ? "اكتشف المواهب" : "Discover talent");
  const secondaryLabel = hero?.secondaryCtaLabel || (isArabic ? "تصفح الفرص" : "Browse opportunities");
  const primaryHref = nativeHref(hero?.primaryCtaHref, "/talents");
  const secondaryHref = nativeHref(hero?.secondaryCtaHref, "/opportunities");

  const quickItems = [
    {
      key: "talents",
      eyebrow: isArabic ? "اكتشف" : "DISCOVER",
      title: isArabic ? "استكشف المواهب" : "Explore talents",
      description: isArabic
        ? "اكتشف الوجوه والخبرات المناسبة لمشروعك."
        : "Discover the right faces and expertise for your project.",
      href: "/talents",
      icon: UsersRound,
    },
    {
      key: "opportunities",
      eyebrow: isArabic ? "تقدّم" : "APPLY",
      title: isArabic ? "تصفح الفرص" : "Browse opportunities",
      description: isArabic
        ? "اعثر على فرص جديدة تناسب ملفك وطموحك."
        : "Find new opportunities that match your profile and ambition.",
      href: "/opportunities",
      icon: BriefcaseBusiness,
    },
    {
      key: "organizations",
      eyebrow: isArabic ? "تواصل" : "CONNECT",
      title: isArabic ? "اكتشف الجهات" : "Explore organizations",
      description: isArabic
        ? "وكالات وشركات إنتاج وجهات تبحث عن مواهب."
        : "Agencies, production companies, and organizations seeking talent.",
      href: "/publishers",
      icon: Building2,
    },
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={[styles.eyebrowPill, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Sparkles size={14} color={colors.gold} />
            <Text style={styles.eyebrowText}>{heroEyebrow}</Text>
          </View>

          <Text style={[styles.heroTitle, { textAlign: align }]}>{heroTitle}</Text>
          {heroTitle2 ? (
            <Text style={[styles.heroTitleGold, { textAlign: align }]}>{heroTitle2}</Text>
          ) : null}
          <Text style={[styles.heroDescription, { textAlign: align }]}>{heroDescription}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => go("/talents")}
            style={({ pressed }) => [styles.searchCard, pressed && styles.pressed]}
          >
            <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
              <Search size={20} color={colors.gold} />
              <Text style={[styles.searchText, { textAlign: align }]}>
                {isArabic ? "ابحث عن موهبة أو تخصص..." : "Search for talent or expertise..."}
              </Text>
              <View style={styles.arrowCircle}>
                <DirectionArrow size={15} color={colors.textMuted} />
              </View>
            </View>
          </Pressable>

          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => go(primaryHref)}
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.primaryActionText}>{primaryLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => go(secondaryHref)}
              style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryActionText}>{secondaryLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.heroGallery}>
            <Pressable accessibilityRole="button" onPress={() => go("/talents")} style={[styles.heroLargeImage, styles.imageCard]}>
              <Image source={{ uri: `${IMAGE_BASE}/hero-actor.webp` }} style={styles.imageFill} resizeMode="cover" />
              <View style={styles.imageShade} />
              <View style={styles.imageCaption}>
                <Text style={styles.imageBadge}>{isArabic ? "ممثل" : "Actor"}</Text>
                <Text style={[styles.imageTitle, { textAlign: align }]}>
                  {isArabic ? "وجوه جديدة تستحق فرصتها" : "New faces deserve a chance"}
                </Text>
              </View>
            </Pressable>

            <View style={styles.heroSmallColumn}>
              <Pressable onPress={() => go("/talents")} style={[styles.heroSmallImage, styles.imageCard]}>
                <Image source={{ uri: `${IMAGE_BASE}/hero-model.webp` }} style={styles.imageFill} resizeMode="cover" />
                <View style={styles.imageShadeSoft} />
                <Text style={styles.smallImageBadge}>{isArabic ? "مودل" : "Model"}</Text>
              </Pressable>
              <Pressable onPress={() => go("/talents")} style={[styles.heroSmallImage, styles.imageCard]}>
                <Image source={{ uri: `${IMAGE_BASE}/55.jpg` }} style={styles.imageFill} resizeMode="cover" />
                <View style={styles.imageShadeSoft} />
                <Text style={styles.smallImageGoldBadge}>{isArabic ? "مواهب من المنطقة" : "Regional talent"}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.heroFooter, isArabic ? styles.rowRtl : styles.rowLtr]}>
            <Text style={styles.heroFooterText}>{isArabic ? "مواهب • فرص • جهات" : "Talent • Opportunities • Organizations"}</Text>
            <Text style={styles.heroFooterBrand}>MLAMH</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => go("/casting")} style={({ pressed }) => [styles.castingCard, pressed && styles.pressed]}>
          <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
            <View style={styles.castingIcon}><ClipboardList size={22} color={colors.gold} /></View>
            <View style={styles.flexOne}>
              <Text style={[styles.castingEyebrow, { textAlign: align }]}>{isArabic ? "للشركات والوكالات وجهات الإنتاج" : "FOR COMPANIES, AGENCIES & PRODUCTIONS"}</Text>
              <Text style={[styles.castingTitle, { textAlign: align }]}>{isArabic ? "عندك مشروع وتحتاج ممثلين أو مودلز؟ أرسل الـ Brief" : "Need actors or models for a project? Send the brief"}</Text>
              <Text style={[styles.castingText, { textAlign: align }]}>{isArabic ? "أرسل احتياج الكاستينغ مباشرة إلى فريق ملامح." : "Send your casting requirements directly to the MLAMH team."}</Text>
            </View>
            <DirectionArrow size={17} color={colors.gold} />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { textAlign: align }]}>{isArabic ? "وصول سريع" : "QUICK ACCESS"}</Text>
            <Text style={[styles.sectionTitle, { textAlign: align }]}>{isArabic ? "ابدأ من هنا" : "Start here"}</Text>
          </View>
          <Text style={styles.sectionBrand}>MLAMH</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={() => go(quickItems[0].href)} style={({ pressed }) => [styles.quickPrimary, pressed && styles.pressed]}>
          <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
            <View style={styles.quickPrimaryIcon}><UsersRound size={25} color={colors.gold} /></View>
            <View style={styles.flexOne}>
              <Text style={[styles.quickEyebrow, { textAlign: align }]}>{quickItems[0].eyebrow}</Text>
              <Text style={[styles.quickTitle, { textAlign: align }]}>{quickItems[0].title}</Text>
              <Text style={[styles.quickText, { textAlign: align }]}>{quickItems[0].description}</Text>
            </View>
            <DirectionArrow size={18} color={colors.textMuted} />
          </View>
        </Pressable>

        <View style={styles.quickGrid}>
          {quickItems.slice(1).map((item) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.key} accessibilityRole="button" onPress={() => go(item.href)} style={({ pressed }) => [styles.quickSmall, pressed && styles.pressed]}>
                <View style={[styles.quickSmallTop, isArabic ? styles.rowRtl : styles.rowLtr]}>
                  <View style={styles.quickSmallIcon}><Icon size={21} color={colors.goldSoft} /></View>
                  <DirectionArrow size={16} color={colors.textMuted} />
                </View>
                <View style={styles.quickSmallBottom}>
                  <Text style={[styles.quickEyebrow, { textAlign: align }]}>{item.eyebrow}</Text>
                  <Text style={[styles.quickSmallTitle, { textAlign: align }]}>{item.title}</Text>
                  <Text numberOfLines={2} style={[styles.quickSmallText, { textAlign: align }]}>{item.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <HomeValuePropsSection isArabic={isArabic} items={valueProps} />
        <HomeHowItWorksSection isArabic={isArabic} />

        <View style={styles.nextMarker}>
          <Text style={styles.nextMarkerText}>
            {isArabic ? "التالي: المواهب، الفرص، الجهات، مشهد ملامح والدعوة الختامية." : "Next: talents, opportunities, organizations, MLAMH Scene and the final call to action."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const absoluteFill = { position: "absolute" as const, top: 0, right: 0, bottom: 0, left: 0 };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 48 },
  flexOne: { flex: 1 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.md },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  heroCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 32, padding: spacing.xl },
  eyebrowPill: { alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(201,169,98,0.28)", backgroundColor: "rgba(201,169,98,0.08)", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  eyebrowText: { color: colors.gold, fontSize: 12 },
  heroTitle: { color: colors.textPrimary, fontSize: 34, lineHeight: 40, fontWeight: "700", marginTop: spacing.md },
  heroTitleGold: { color: colors.goldSoft, fontSize: 34, lineHeight: 40, fontWeight: "700", marginTop: 3 },
  heroDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 25, marginTop: spacing.md },
  searchCard: { minHeight: 58, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(0,0,0,0.28)", borderRadius: radius.lg, paddingHorizontal: spacing.lg, justifyContent: "center", marginTop: spacing.xl },
  searchText: { flex: 1, color: "rgba(255,255,255,0.45)", fontSize: 14 },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)" },
  heroActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  primaryAction: { flex: 1, minHeight: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldSoft, paddingHorizontal: spacing.md },
  primaryActionText: { color: "#090909", fontSize: 15, fontWeight: "700", textAlign: "center" },
  secondaryAction: { flex: 1, minHeight: 68, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", backgroundColor: "rgba(255,255,255,0.035)", paddingHorizontal: spacing.md },
  secondaryActionText: { color: "rgba(255,255,255,0.82)", fontSize: 15, fontWeight: "600", textAlign: "center" },
  heroGallery: { height: 285, flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  imageCard: { overflow: "hidden", backgroundColor: "#0A0A0A" },
  heroLargeImage: { flex: 1.15, borderRadius: 28 },
  heroSmallColumn: { flex: 0.85, gap: spacing.md },
  heroSmallImage: { flex: 1, borderRadius: 22 },
  imageFill: { ...absoluteFill, width: "100%", height: "100%" },
  imageShade: { ...absoluteFill, backgroundColor: "rgba(0,0,0,0.24)" },
  imageShadeSoft: { ...absoluteFill, backgroundColor: "rgba(0,0,0,0.18)" },
  imageCaption: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  imageBadge: { alignSelf: "flex-start", color: "rgba(255,255,255,0.76)", fontSize: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  imageTitle: { color: colors.textPrimary, fontSize: 18, lineHeight: 24, fontWeight: "700", marginTop: spacing.sm },
  smallImageBadge: { position: "absolute", right: spacing.md, bottom: spacing.md, color: "rgba(255,255,255,0.76)", fontSize: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  smallImageGoldBadge: { position: "absolute", right: spacing.md, bottom: spacing.md, color: colors.gold, fontSize: 9, borderWidth: 1, borderColor: "rgba(201,169,98,0.28)", backgroundColor: "rgba(0,0,0,0.55)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  heroFooter: { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingTop: spacing.lg, marginTop: spacing.lg },
  heroFooterText: { color: "rgba(255,255,255,0.36)", fontSize: 11 },
  heroFooterBrand: { color: "rgba(201,169,98,0.72)", fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  castingCard: { marginTop: spacing.xl, borderWidth: 1, borderColor: "rgba(201,169,98,0.28)", backgroundColor: "rgba(201,169,98,0.065)", borderRadius: 28, padding: spacing.xl },
  castingIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.26)", backgroundColor: "rgba(0,0,0,0.22)" },
  castingEyebrow: { color: "rgba(201,169,98,0.74)", fontSize: 10, fontWeight: "600" },
  castingTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: 4 },
  castingText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 6 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 36, marginBottom: spacing.lg },
  sectionEyebrow: { color: "rgba(201,169,98,0.82)", fontSize: 11, fontWeight: "600" },
  sectionTitle: { color: colors.textPrimary, fontSize: 27, lineHeight: 32, fontWeight: "700", marginTop: 6 },
  sectionBrand: { color: "rgba(255,255,255,0.20)", fontSize: 10, letterSpacing: 1.6, paddingBottom: 4 },
  quickPrimary: { borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.045)", borderRadius: 28, padding: spacing.xl },
  quickPrimaryIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.08)" },
  quickEyebrow: { color: "rgba(201,169,98,0.68)", fontSize: 10, fontWeight: "600" },
  quickTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 4 },
  quickText: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginTop: 7 },
  quickGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  quickSmall: { flex: 1, minHeight: 172, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: 25, padding: spacing.lg },
  quickSmallTop: { justifyContent: "space-between" },
  quickSmallIcon: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" },
  quickSmallBottom: { marginTop: "auto", paddingTop: spacing.xl },
  quickSmallTitle: { color: colors.textPrimary, fontSize: 15, lineHeight: 22, fontWeight: "700", marginTop: 4 },
  quickSmallText: { color: "rgba(255,255,255,0.35)", fontSize: 11, lineHeight: 18, marginTop: 6 },
  nextMarker: { marginTop: 36, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.10)", borderRadius: radius.xl, padding: spacing.xl },
  nextMarkerText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center" },
});
