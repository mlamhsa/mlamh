import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
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
  if (error || !item) return <View style={styles.centered}><Text style={styles.errorText}>{isArabic ? "تعذر فتح هذه الفرصة." : "Unable to open this opportunity."}</Text><Pressable style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryButtonText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  const compensation = item.compensationType === "unpaid"
    ? (isArabic ? "غير مدفوعة" : "Unpaid")
    : item.budget && item.currency ? `${item.budget} ${item.currency}` : item.compensationType ?? null;
  const applyMessage = applyError ?? getApplyMessage(applyResult);
  const applied = applyResult?.ok === true || (!applyResult?.ok && applyResult?.code === "ALREADY_APPLIED");

  return <View style={styles.screen}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={[styles.topBar, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12}><Text style={styles.topIcon}>‹</Text></Pressable>
        <View style={styles.topActions}><Text style={styles.topIcon}>♡</Text><Text style={styles.topIcon}>↗</Text></View>
      </View>

      <View style={styles.coverCard}>
        <View style={styles.coverGlow} />
        <View style={styles.coverTopRow}><Text style={styles.featuredBadge}>{item.featured ? (isArabic ? "مميز" : "Featured") : (isArabic ? "فرصة" : "Opportunity")}</Text><Text style={styles.coverCount}>1/1</Text></View>
        <View style={styles.coverContent}><Text style={styles.coverBrand}>MLAMH</Text><Text numberOfLines={2} style={styles.coverTitle}>{item.title}</Text></View>
      </View>

      <View style={[styles.mainCard, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
        <Text accessibilityRole="header" style={styles.title}>{item.title}</Text>
        <View style={styles.companyRow}><Text style={styles.company}>{item.companyName}</Text>{item.managedByMlamh ? <Text style={styles.verifiedDot}>✓</Text> : null}</View>
        <Text style={styles.locationLine}>{[item.city, item.countryCode].filter(Boolean).join(" · ")}</Text>
        {compensation ? <View style={styles.compensationPill}><Text style={styles.compensationText}>{compensation}</Text></View> : null}

        <View style={styles.tabs}><Text style={[styles.tab, styles.tabActive]}>{isArabic ? "التفاصيل" : "Details"}</Text><Text style={styles.tab}>{isArabic ? "المتطلبات" : "Requirements"}</Text><Text style={styles.tab}>{isArabic ? "الموقع" : "Location"}</Text><Text style={styles.tab}>{isArabic ? "الجهة" : "Company"}</Text></View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isArabic ? "عن الفرصة" : "About the opportunity"}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.metaGrid}>
          <Meta label={isArabic ? "النوع" : "Type"} value={item.opportunityType.replaceAll("_", " ")} styles={styles} />
          {item.city ? <Meta label={isArabic ? "الموقع" : "Location"} value={item.city} styles={styles} /> : null}
          {item.createdAt ? <Meta label={isArabic ? "تاريخ النشر" : "Published"} value={new Date(item.createdAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US")} styles={styles} /> : null}
          {item.expiresAt ? <Meta label={isArabic ? "آخر موعد" : "Deadline"} value={new Date(item.expiresAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US")} styles={styles} /> : null}
        </View>
      </View>
    </ScrollView>

    <View style={styles.ctaBar}>
      {applyMessage ? <Text accessibilityLiveRegion="polite" style={[styles.applyMessage, applied && styles.applySuccess]}>{applyMessage}</Text> : null}
      <View style={styles.ctaRow}>
        <Pressable style={styles.saveButton} accessibilityLabel={isArabic ? "حفظ الفرصة" : "Save opportunity"}><Text style={styles.saveIcon}>♡</Text></Pressable>
        <Pressable disabled={applyLoading || applied} style={({ pressed }) => [styles.primaryButton, (pressed || applyLoading || applied) && styles.buttonDisabled]} onPress={() => void apply()}>
          <Text style={styles.primaryButtonText}>{applyLoading ? (isArabic ? "جارٍ التقديم..." : "Applying...") : applied ? (isArabic ? "تم التقديم" : "Applied") : (isArabic ? "تقدم الآن" : "Apply now")}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}

function Meta({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.metaItem}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background },
    content: { paddingHorizontal: 12, paddingTop: 46, paddingBottom: 152, gap: 12 },
    topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6 },
    topActions: { flexDirection: "row", gap: 18 }, topIcon: { color: theme.text, fontSize: 28, lineHeight: 32 },
    coverCard: { minHeight: 248, borderRadius: 28, overflow: "hidden", backgroundColor: theme.charcoal ?? "#2E2E2E", borderWidth: 1, borderColor: theme.border, padding: 18, justifyContent: "space-between" },
    coverGlow: { position: "absolute", width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(212,160,23,0.16)", right: -54, top: -50 },
    coverTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    featuredBadge: { color: "#2E2E2E", backgroundColor: "#D4A017", borderRadius: 12, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, fontWeight: "800" },
    coverCount: { color: "#F5F1E8", fontSize: 12, fontWeight: "700" }, coverContent: { gap: 8 },
    coverBrand: { color: "#D4A017", fontSize: 13, fontWeight: "800", letterSpacing: 2.4 },
    coverTitle: { color: "#F5F1E8", fontSize: 27, lineHeight: 34, fontWeight: "700", maxWidth: "86%" },
    mainCard: { borderRadius: 30, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, padding: 20, gap: 11 },
    title: { color: theme.text, fontSize: 29, lineHeight: 38, fontWeight: "700" }, companyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    company: { color: theme.text, fontSize: 14, fontWeight: "700" }, verifiedDot: { width: 20, height: 20, borderRadius: 10, overflow: "hidden", textAlign: "center", lineHeight: 20, backgroundColor: theme.accent, color: "#2E2E2E", fontSize: 12, fontWeight: "900" },
    locationLine: { color: theme.muted, fontSize: 13 }, compensationPill: { alignSelf: "flex-start", backgroundColor: "rgba(212,160,23,0.16)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 }, compensationText: { color: theme.text, fontSize: 13, fontWeight: "700" },
    tabs: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: theme.border, marginTop: 8 }, tab: { color: theme.muted, fontSize: 12, fontWeight: "600", paddingVertical: 12 }, tabActive: { color: theme.accent, borderBottomWidth: 2, borderBottomColor: theme.accent },
    section: { gap: 10, paddingTop: 4 }, sectionTitle: { color: theme.text, fontSize: 18, fontWeight: "800" }, description: { color: theme.muted, fontSize: 15, lineHeight: 25 },
    metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 }, metaItem: { width: "47%", borderRadius: 18, borderWidth: 1, borderColor: theme.border, padding: 12, gap: 4 }, metaLabel: { color: theme.muted, fontSize: 11 }, metaValue: { color: theme.text, fontSize: 13, fontWeight: "700" },
    ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border }, applyMessage: { color: theme.muted, fontSize: 12, textAlign: "center" }, applySuccess: { color: theme.accent, fontWeight: "700" }, ctaRow: { flexDirection: "row", gap: 10 },
    primaryButton: { flex: 1, backgroundColor: theme.accent, borderRadius: 16, minHeight: 54, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: "#2E2E2E", fontSize: 16, fontWeight: "900" },
    saveButton: { width: 54, minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: theme.accent, alignItems: "center", justifyContent: "center", backgroundColor: theme.surface }, saveIcon: { color: theme.accent, fontSize: 24 }, buttonDisabled: { opacity: 0.55 },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontWeight: "700" }, errorText: { color: theme.text, fontSize: 18, textAlign: "center" },
  });
}
