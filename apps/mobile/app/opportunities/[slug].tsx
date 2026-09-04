import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { resolveMobileMarket } from "@/lib/account";
import { applyToOpportunity, getPublicOpportunity, type ApplyResult, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function OpportunityDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [item, setItem] = useState<MobileOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!slug) { setError(true); setLoading(false); return; }
      try {
        const market = await resolveMobileMarket();
        const response = await getPublicOpportunity(slug, locale, market);
        if (active) { setItem(response.item); setError(false); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [locale, slug]);

  async function apply() {
    if (!item || applyLoading) return;
    setApplyLoading(true); setApplyResult(null); setApplyError(null);
    try {
      const result = await applyToOpportunity(item.id);
      if (!result.ok && result.code === "UNAUTHENTICATED") {
        router.push({ pathname: "/login", params: { next: `/opportunities/${item.slug}` } });
        return;
      }
      setApplyResult(result);
    } catch {
      setApplyError(isArabic ? "تعذر التقديم الآن. تحقق من الاتصال وحاول مرة أخرى." : "Unable to apply right now. Check your connection and try again.");
    } finally { setApplyLoading(false); }
  }

  async function shareOpportunity() {
    if (!item) return;
    const url = `https://mlamh.net/${locale}/opportunities/${encodeURIComponent(item.slug)}`;
    await Share.share({
      title: item.title,
      message: isArabic ? `${item.title}\n${url}` : `${item.title}\n${url}`,
      url,
    });
  }

  function getApplyMessage(result: ApplyResult | null) {
    if (!result) return null;
    if (result.ok) return isArabic ? "تم تقديم طلبك بنجاح." : "Your application was submitted successfully.";
    const messages: Record<string, { ar: string; en: string }> = {
      ALREADY_APPLIED: { ar: "سبق أن تقدمت على هذه الفرصة.", en: "You already applied to this opportunity." },
      PROFILE_INCOMPLETE: { ar: "أكمل ملف الموهبة قبل التقديم.", en: "Complete your talent profile before applying." },
      TALENT_NOT_APPROVED: { ar: "يجب اعتماد ملف الموهبة قبل التقديم.", en: "Your talent profile must be approved before applying." },
      NOT_TALENT: { ar: "أنشئ ملف موهبة أولًا للتقديم.", en: "Create a talent profile before applying." },
      ACCOUNT_RESTRICTED: { ar: "الحساب غير متاح للتقديم حاليًا.", en: "This account cannot apply right now." },
      APPLICATION_WINDOW_CLOSED: { ar: "انتهت مدة استقبال الطلبات.", en: "The application window has closed." },
      OPPORTUNITY_NOT_AVAILABLE: { ar: "الفرصة غير متاحة للتقديم حاليًا.", en: "This opportunity is not currently available." },
    };
    const message = messages[result.code] ?? { ar: "تعذر إكمال التقديم. حاول مرة أخرى.", en: "Unable to complete your application. Please try again." };
    return isArabic ? message.ar : message.en;
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  if (error || !item) return <View style={styles.centered}><Text accessibilityRole="alert" style={styles.errorText}>{isArabic ? "تعذر فتح هذه الفرصة." : "Unable to open this opportunity."}</Text><Pressable accessibilityRole="button" style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryButtonText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  const compensation = item.compensationType === "unpaid"
    ? (isArabic ? "غير مدفوعة" : "Unpaid")
    : item.budget && item.currency ? `${item.budget} ${item.currency}` : item.compensationType === "negotiable" ? (isArabic ? "حسب الاتفاق" : "Negotiable") : item.compensationType ?? null;
  const applyMessage = applyError ?? getApplyMessage(applyResult);
  const applied = applyResult?.ok === true || (!applyResult?.ok && applyResult?.code === "ALREADY_APPLIED");
  const publishedLabel = item.createdAt ? new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : null;
  const deadlineLabel = item.expiresAt ? new Date(item.expiresAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US") : null;

  return <View style={styles.screen}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={[styles.topBar, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.roundAction}><Text style={styles.topIcon}>‹</Text></Pressable>
        <View style={styles.topIdentity}><Text style={styles.topBrand}>MLAMH</Text><View style={styles.topBrandDot} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "مشاركة الفرصة" : "Share opportunity"} onPress={() => void shareOpportunity()} hitSlop={10} style={styles.roundAction}><Text style={styles.shareIcon}>↗</Text></Pressable>
      </View>

      <View style={styles.coverCard}>
        <View style={styles.coverGlowLarge} />
        <View style={styles.coverGlowSmall} />
        <View style={styles.coverTopRow}><Text style={styles.featuredBadge}>{item.featured ? (isArabic ? "فرصة مميزة" : "Featured") : (isArabic ? "فرصة" : "Opportunity")}</Text><Text style={styles.coverType}>{item.opportunityType.replaceAll("_", " ")}</Text></View>
        <View style={styles.coverContent}><Text style={styles.coverBrand}>MLAMH / OPPORTUNITIES</Text><Text numberOfLines={3} style={styles.coverTitle}>{item.title}</Text><View style={styles.coverMetaRow}><Text style={styles.coverMeta}>{item.companyName}</Text><Text style={styles.coverMetaDot}>•</Text><Text style={styles.coverMeta}>{[item.city, item.countryCode].filter(Boolean).join(" · ") || item.countryCode || "MLAMH"}</Text></View></View>
      </View>

      <View style={[styles.mainCard, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <View style={styles.headingBlock}>
          <Text accessibilityRole="header" style={styles.title}>{item.title}</Text>
          <View style={styles.companyRow}><View style={styles.companyAvatar}><Text style={styles.companyAvatarText}>{item.companyName.slice(0, 1).toUpperCase()}</Text></View><View style={styles.companyText}><View style={styles.companyNameRow}><Text style={styles.company}>{item.companyName}</Text>{item.managedByMlamh ? <Text accessibilityLabel={isArabic ? "مدار بواسطة ملامح" : "Managed by MLAMH"} style={styles.verifiedDot}>✓</Text> : null}</View><Text style={styles.locationLine}>{[item.city, item.countryCode].filter(Boolean).join(" · ")}</Text></View></View>
        </View>

        <View style={styles.quickFacts}>
          <Fact value={compensation ?? (isArabic ? "غير محدد" : "Not specified")} label={isArabic ? "المقابل" : "Compensation"} styles={styles} />
          <Fact value={item.city ?? item.countryCode ?? "—"} label={isArabic ? "الموقع" : "Location"} styles={styles} />
          <Fact value={deadlineLabel ?? (isArabic ? "مفتوح" : "Open")} label={isArabic ? "آخر موعد" : "Deadline"} styles={styles} />
        </View>

        <View style={styles.sectionDivider} />
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>{isArabic ? "التفاصيل" : "DETAILS"}</Text>
          <Text style={styles.sectionTitle}>{isArabic ? "عن الفرصة" : "About the opportunity"}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.metaGrid}>
          <Meta label={isArabic ? "النوع" : "Type"} value={item.opportunityType.replaceAll("_", " ")} styles={styles} />
          {item.city ? <Meta label={isArabic ? "المدينة" : "City"} value={item.city} styles={styles} /> : null}
          {publishedLabel ? <Meta label={isArabic ? "تاريخ النشر" : "Published"} value={publishedLabel} styles={styles} /> : null}
          {deadlineLabel ? <Meta label={isArabic ? "آخر موعد" : "Deadline"} value={deadlineLabel} styles={styles} /> : null}
        </View>

        {item.managedByMlamh ? <View style={styles.trustCard}><View style={styles.trustMark}><Text style={styles.trustMarkText}>M</Text></View><View style={styles.trustText}><Text style={styles.trustTitle}>{isArabic ? "هذه الفرصة مُدارة عبر ملامح" : "Managed through MLAMH"}</Text><Text style={styles.trustBody}>{isArabic ? "يتم استقبال الطلبات ومتابعة مراحل الاختيار من خلال المنصة." : "Applications and selection updates are handled through the platform."}</Text></View></View> : null}
      </View>
    </ScrollView>

    <View style={styles.ctaBar}>
      {applyMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.applyMessage, applied && styles.applySuccess]}>{applyMessage}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: applyLoading || applied, busy: applyLoading }} disabled={applyLoading || applied} style={({ pressed }) => [styles.primaryButton, (pressed || applyLoading || applied) && styles.buttonDisabled]} onPress={() => void apply()}>
        <Text style={styles.primaryButtonText}>{applyLoading ? (isArabic ? "جارٍ التقديم..." : "Applying...") : applied ? (isArabic ? "تم التقديم" : "Applied") : (isArabic ? "تقدم على الفرصة" : "Apply to opportunity")}</Text>
        {!applied ? <Text style={styles.primaryArrow}>›</Text> : null}
      </Pressable>
    </View>
  </View>;
}

function Fact({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.fact}><Text numberOfLines={1} style={styles.factValue}>{value}</Text><Text style={styles.factLabel}>{label}</Text></View>;
}

function Meta({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.metaItem}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background },
    content: { paddingHorizontal: 12, paddingTop: 46, paddingBottom: 138, gap: 12 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
    roundAction: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
    topIcon: { color: theme.text, fontSize: 30, lineHeight: 32 }, shareIcon: { color: theme.text, fontSize: 21, lineHeight: 24 },
    topIdentity: { flexDirection: "row", alignItems: "center", gap: 7 }, topBrand: { color: theme.text, fontSize: 11, fontWeight: "900", letterSpacing: 2.4 }, topBrandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent },
    coverCard: { minHeight: 286, borderRadius: 30, overflow: "hidden", backgroundColor: theme.charcoal, borderWidth: 1, borderColor: theme.bronze, padding: 20, justifyContent: "space-between" },
    coverGlowLarge: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: theme.accent, opacity: 0.15, right: -70, top: -72 },
    coverGlowSmall: { position: "absolute", width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: theme.bronze, left: -22, bottom: -28, opacity: 0.7 },
    coverTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    featuredBadge: { color: theme.charcoal, backgroundColor: theme.accent, borderRadius: 14, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 6, fontSize: 10, fontWeight: "900" },
    coverType: { color: theme.ivory, opacity: 0.72, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
    coverContent: { gap: 9 }, coverBrand: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2.2 },
    coverTitle: { color: theme.ivory, fontSize: 30, lineHeight: 37, fontWeight: "700", maxWidth: "92%" },
    coverMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }, coverMeta: { color: theme.ivory, opacity: 0.78, fontSize: 11 }, coverMetaDot: { color: theme.accent, fontSize: 10 },
    mainCard: { borderRadius: 30, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 20, gap: 18 },
    headingBlock: { gap: 15 }, title: { color: theme.text, fontSize: 29, lineHeight: 37, fontWeight: "800" }, companyRow: { flexDirection: "row", alignItems: "center", gap: 11 },
    companyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }, companyAvatarText: { color: theme.accent, fontSize: 17, fontWeight: "900" },
    companyText: { flex: 1, gap: 3 }, companyNameRow: { flexDirection: "row", alignItems: "center", gap: 6 }, company: { color: theme.text, fontSize: 14, fontWeight: "800" },
    verifiedDot: { width: 20, height: 20, borderRadius: 10, overflow: "hidden", textAlign: "center", lineHeight: 20, backgroundColor: theme.accent, color: theme.charcoal, fontSize: 12, fontWeight: "900" }, locationLine: { color: theme.muted, fontSize: 12 },
    quickFacts: { flexDirection: "row", gap: 8 }, fact: { flex: 1, minHeight: 74, borderRadius: 18, backgroundColor: theme.input, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 10, paddingVertical: 12, justifyContent: "center", gap: 4 }, factValue: { color: theme.text, fontSize: 12, fontWeight: "800" }, factLabel: { color: theme.muted, fontSize: 9, fontWeight: "600" },
    sectionDivider: { height: 1, backgroundColor: theme.border }, section: { gap: 9 }, sectionEyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "800" }, description: { color: theme.muted, fontSize: 15, lineHeight: 25 },
    metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, metaItem: { width: "48%", borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background, padding: 13, gap: 5 }, metaLabel: { color: theme.muted, fontSize: 10 }, metaValue: { color: theme.text, fontSize: 13, fontWeight: "700" },
    trustCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.bronze, backgroundColor: theme.chip, padding: 14 }, trustMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.charcoal, borderWidth: 1, borderColor: theme.bronze, alignItems: "center", justifyContent: "center" }, trustMarkText: { color: theme.accent, fontSize: 18, fontWeight: "900" }, trustText: { flex: 1, gap: 3 }, trustTitle: { color: theme.text, fontSize: 12, fontWeight: "800" }, trustBody: { color: theme.muted, fontSize: 10, lineHeight: 16 },
    ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border }, applyMessage: { color: theme.muted, fontSize: 12, textAlign: "center" }, applySuccess: { color: theme.accent, fontWeight: "800" },
    primaryButton: { minHeight: 56, borderRadius: 17, backgroundColor: theme.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, primaryButtonText: { color: theme.charcoal, fontSize: 16, fontWeight: "900" }, primaryArrow: { color: theme.charcoal, fontSize: 25, lineHeight: 25, fontWeight: "500" }, buttonDisabled: { opacity: 0.55 },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontWeight: "700" }, errorText: { color: theme.text, fontSize: 18, textAlign: "center" },
  });
}
