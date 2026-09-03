import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import {
  applyToOpportunity,
  getPublicOpportunity,
  type ApplyResult,
  type MobileOpportunity,
} from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function OpportunityDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [item, setItem] = useState<MobileOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!slug) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        const response = await getPublicOpportunity(slug, locale, "SA");
        if (active) setItem(response.item);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [locale, slug]);

  async function apply() {
    if (!item || applyLoading) return;

    setApplyLoading(true);
    setApplyResult(null);
    try {
      const result = await applyToOpportunity(item.id);

      if (!result.ok && result.code === "UNAUTHENTICATED") {
        router.push({
          pathname: "/login",
          params: { next: `/opportunities/${item.slug}` },
        });
        return;
      }

      setApplyResult(result);
    } finally {
      setApplyLoading(false);
    }
  }

  function getApplyMessage(result: ApplyResult | null) {
    if (!result) return null;
    if (result.ok) {
      return locale === "ar" ? "تم تقديم طلبك بنجاح." : "Your application was submitted successfully.";
    }

    const messages: Record<string, { ar: string; en: string }> = {
      ALREADY_APPLIED: { ar: "سبق أن تقدمت على هذه الفرصة.", en: "You already applied to this opportunity." },
      PROFILE_INCOMPLETE: { ar: "أكمل ملف الموهبة قبل التقديم.", en: "Complete your talent profile before applying." },
      TALENT_NOT_APPROVED: { ar: "يجب اعتماد ملف الموهبة قبل التقديم.", en: "Your talent profile must be approved before applying." },
      NOT_TALENT: { ar: "أنشئ ملف موهبة أولًا للتقديم.", en: "Create a talent profile before applying." },
      ACCOUNT_RESTRICTED: { ar: "الحساب غير متاح للتقديم حاليًا.", en: "This account cannot apply right now." },
      APPLICATION_WINDOW_CLOSED: { ar: "انتهت مدة استقبال الطلبات.", en: "The application window has closed." },
      OPPORTUNITY_NOT_AVAILABLE: { ar: "الفرصة غير متاحة للتقديم حاليًا.", en: "This opportunity is not currently available." },
    };

    const message = messages[result.code] ?? {
      ar: "تعذر إكمال التقديم. حاول مرة أخرى.",
      en: "Unable to complete your application. Please try again.",
    };

    return locale === "ar" ? message.ar : message.en;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {locale === "ar" ? "تعذر فتح هذه الفرصة." : "Unable to open this opportunity."}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>{locale === "ar" ? "رجوع" : "Back"}</Text>
        </Pressable>
      </View>
    );
  }

  const compensation =
    item.compensationType === "unpaid"
      ? locale === "ar" ? "غير مدفوعة" : "Unpaid"
      : item.budget && item.currency
        ? `${item.budget} ${item.currency}`
        : item.compensationType ?? null;
  const applyMessage = getApplyMessage(applyResult);
  const applied = applyResult?.ok === true || (!applyResult?.ok && applyResult?.code === "ALREADY_APPLIED");

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text>
          </Pressable>
          <Text style={styles.type}>{item.opportunityType.replaceAll("_", " ")}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.company}>{item.companyName}</Text>
        </View>

        <View style={styles.infoGrid}>
          {item.city ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{locale === "ar" ? "الموقع" : "Location"}</Text>
              <Text style={styles.infoValue}>{item.city}</Text>
            </View>
          ) : null}
          {compensation ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>{locale === "ar" ? "المقابل" : "Compensation"}</Text>
              <Text style={styles.infoValue}>{compensation}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{locale === "ar" ? "عن الفرصة" : "About the opportunity"}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        {applyMessage ? (
          <Text style={[styles.applyMessage, applied && styles.applySuccess]}>{applyMessage}</Text>
        ) : null}
        <Pressable
          disabled={applyLoading || applied}
          style={({ pressed }) => [
            styles.primaryButton,
            (pressed || applyLoading || applied) && styles.buttonDisabled,
          ]}
          onPress={() => void apply()}
        >
          <Text style={styles.primaryButtonText}>
            {applyLoading
              ? locale === "ar" ? "جارٍ التقديم..." : "Applying..."
              : applied
                ? locale === "ar" ? "تم التقديم" : "Applied"
                : locale === "ar" ? "التقديم على الفرصة" : "Apply to opportunity"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(theme: typeof lightTheme | typeof darkTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background },
    content: { paddingHorizontal: 22, paddingTop: 62, paddingBottom: 164, gap: 24 },
    header: { gap: 10 },
    back: { color: theme.accent, fontSize: 14, fontWeight: "600" },
    type: { color: theme.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3, marginTop: 8 },
    title: { color: theme.text, fontSize: 38, lineHeight: 46, fontWeight: "300" },
    company: { color: theme.accent, fontSize: 16, fontWeight: "600" },
    infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    infoCard: { flexGrow: 1, minWidth: 150, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, gap: 6 },
    infoLabel: { color: theme.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
    infoValue: { color: theme.text, fontSize: 17, fontWeight: "500" },
    section: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 22, gap: 12 },
    sectionTitle: { color: theme.text, fontSize: 21, fontWeight: "500" },
    description: { color: theme.muted, fontSize: 16, lineHeight: 28 },
    ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, backgroundColor: theme.background, borderTopWidth: 1, borderTopColor: theme.border },
    applyMessage: { color: theme.muted, fontSize: 13, textAlign: "center" },
    applySuccess: { color: theme.accent, fontWeight: "600" },
    primaryButton: { backgroundColor: theme.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center" },
    primaryButtonText: { color: "#181818", fontSize: 16, fontWeight: "700" },
    buttonDisabled: { opacity: 0.6 },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 },
    secondaryButtonText: { color: theme.text, fontWeight: "600" },
    errorText: { color: theme.text, fontSize: 18, textAlign: "center" },
  });
}
