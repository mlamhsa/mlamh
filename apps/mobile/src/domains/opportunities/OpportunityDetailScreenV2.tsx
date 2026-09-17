import { router, useLocalSearchParams } from "expo-router";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getMobileOpportunity } from "@/src/domains/opportunities/api";
import { OpportunityResponseCTA } from "@/src/domains/opportunities/OpportunityResponseCTA";
import type { MobilePublicOpportunity } from "@/src/domains/opportunities/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

function compensationLabel(item: MobilePublicOpportunity, isArabic: boolean) {
  if (item.compensationType === "unpaid") return isArabic ? "غير مدفوع" : "Unpaid";
  if (item.compensationType === "negotiable") return isArabic ? "حسب الاتفاق" : "Negotiable";
  const amount = Number(item.budget);
  if (!Number.isFinite(amount) || amount <= 0) return isArabic ? "غير محدد" : "Not specified";
  return `${new Intl.NumberFormat(isArabic ? "ar-SA-u-nu-latn" : "en-US").format(amount)} ${item.currency || "SAR"}`;
}

function dateLabel(value: string | null, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "غير محدد" : "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function OpportunityDetailScreenV2() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const identifier = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const align = isArabic ? "right" : "left";
  const [item, setItem] = useState<MobilePublicOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!identifier) {
      setError(isArabic ? "تعذر تحديد الفرصة." : "Opportunity could not be identified.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getMobileOpportunity(identifier, locale);
      setItem(response.item);
    } catch {
      setError(isArabic ? "تعذر تحميل تفاصيل الفرصة." : "Unable to load opportunity details.");
    } finally {
      setLoading(false);
    }
  }, [identifier, isArabic, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.backButton, isArabic && styles.backButtonRtl, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <BackIcon size={18} color={colors.textSecondary} />
          <Text style={styles.backText}>{isArabic ? "رجوع" : "Back"}</Text>
        </Pressable>

        {loading ? (
          <StateCard text={isArabic ? "جارٍ تحميل التفاصيل..." : "Loading details..."} />
        ) : error || !item ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>{error || (isArabic ? "الفرصة غير متاحة." : "Opportunity unavailable.")}</Text>
            <Pressable onPress={() => void load()} style={styles.retryButton}>
              <Text style={styles.retryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={[styles.rowBetween, isArabic ? styles.rowRtl : styles.rowLtr]}>
                <View style={[styles.modePill, isArabic && styles.rowReverse, item.postingMode === "quick" ? styles.quickPill : styles.castingPill]}>
                  {item.postingMode === "quick" ? <Zap size={12} color="#F6D487" /> : <BriefcaseBusiness size={12} color={colors.gold} />}
                  <Text style={[styles.modeText, item.postingMode === "quick" && styles.quickText]}>
                    {item.postingMode === "quick" ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
                  </Text>
                </View>
                {item.featured ? <Text style={styles.featured}>{isArabic ? "مميز" : "FEATURED"}</Text> : null}
              </View>

              <Text style={[styles.title, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.title}</Text>
              <View style={[styles.companyRow, isArabic ? styles.companyRowRtl : styles.companyRowLtr, isArabic ? styles.rowRtl : styles.rowLtr]}>
                <Building2 size={15} color={colors.gold} />
                <Text style={styles.company}>{item.companyName}</Text>
              </View>
              {item.description ? <Text style={[styles.description, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{item.description}</Text> : null}
            </View>

            <View style={[styles.infoGrid, isArabic && styles.rowReverse]}>
              <InfoCard icon={MapPin} label={isArabic ? "الموقع" : "Location"} value={item.city || (isArabic ? "غير محدد" : "Not specified")} isArabic={isArabic} />
              <InfoCard icon={Wallet} label={isArabic ? "المقابل" : "Compensation"} value={compensationLabel(item, isArabic)} isArabic={isArabic} />
              <InfoCard icon={UsersRound} label={isArabic ? "العدد المطلوب" : "Required count"} value={item.requiredCount ? String(item.requiredCount) : (isArabic ? "غير محدد" : "Not specified")} isArabic={isArabic} />
              <InfoCard icon={CalendarDays} label={isArabic ? "تاريخ العمل" : "Work date"} value={dateLabel(item.workDate, locale)} isArabic={isArabic} />
            </View>

            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{isArabic ? "تفاصيل الفرصة" : "Opportunity details"}</Text>
              <DetailRow label={isArabic ? "نوع الموهبة" : "Talent type"} value={item.opportunityType || "—"} isArabic={isArabic} />
              <DetailRow label={isArabic ? "الجنس المطلوب" : "Required gender"} value={item.requiredGender || (isArabic ? "غير محدد" : "Not specified")} isArabic={isArabic} />
              <DetailRow label={isArabic ? "العمر" : "Age"} value={item.minAge || item.maxAge ? `${item.minAge ?? "—"} - ${item.maxAge ?? "—"}` : (isArabic ? "غير محدد" : "Not specified")} isArabic={isArabic} />
              <DetailRow label={isArabic ? "مدة العمل" : "Work duration"} value={item.workDuration || (isArabic ? "غير محدد" : "Not specified")} isArabic={isArabic} icon={Clock3} />
              <DetailRow label={isArabic ? "آخر موعد للتقديم" : "Application deadline"} value={dateLabel(item.applicationDeadline, locale)} isArabic={isArabic} />
            </View>

            <View style={styles.semanticCard}>
              <Text style={[styles.semanticEyebrow, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                {item.postingMode === "quick" ? (isArabic ? "طلب سريع" : "QUICK REQUEST") : (isArabic ? "فرصة كاستينغ" : "CASTING OPPORTUNITY")}
              </Text>
              <Text style={[styles.semanticTitle, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                {item.postingMode === "quick"
                  ? (isArabic ? "إبداء الاهتمام ليس قبولًا نهائيًا." : "Interest is not final acceptance.")
                  : (isArabic ? "التقديم يرسل طلبك للجهة للمراجعة." : "Applying sends your profile for publisher review.")}
              </Text>
              <Text style={[styles.semanticText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                {item.postingMode === "quick"
                  ? (isArabic
                    ? "عند إبداء الاهتمام تبدأ رحلة الطلب داخل ملامح، والاختيار المبدئي يبقى منفصلًا عن التأكيد النهائي."
                    : "Expressing interest starts the request workflow inside MLAMH; preliminary selection remains separate from final confirmation.")
                  : (isArabic
                    ? "تظل حالة طلبك واضحة داخل ملامح من التقديم وحتى قرار الجهة."
                    : "Your application state remains clear inside MLAMH from submission through the publisher decision.")}
              </Text>
            </View>

            <OpportunityResponseCTA item={item} locale={locale} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StateCard({ text }: { text: string }) {
  return <View style={styles.stateCard}><Text style={styles.stateText}>{text}</Text></View>;
}

function InfoCard({ icon: Icon, label, value, isArabic }: { icon: typeof MapPin; label: string; value: string; isArabic: boolean }) {
  return (
    <View style={styles.infoCard}>
      <View style={isArabic ? styles.rowRtl : styles.rowLtr}>
        <Icon size={14} color={colors.gold} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { textAlign: isArabic ? "right" : "left" }]}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value, isArabic, icon: Icon }: { label: string; value: string; isArabic: boolean; icon?: typeof Clock3 }) {
  return (
    <View style={[styles.detailRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
      <View style={[styles.detailLabelWrap, isArabic ? styles.rowRtl : styles.rowLtr]}>
        {Icon ? <Icon size={13} color={colors.gold} /> : null}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text numberOfLines={2} style={[styles.detailValue, { textAlign: isArabic ? "left" : "right", writingDirection: isArabic ? "rtl" : "ltr" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 56 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowReverse: { flexDirection: "row-reverse" },
  rowBetween: { justifyContent: "space-between" },
  backButton: { alignSelf: "flex-start", minHeight: 44, alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  backButtonRtl: { alignSelf: "flex-end" },
  backText: { color: colors.textSecondary, fontSize: 12 },
  stateCard: { marginTop: spacing.xxl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center" },
  stateTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "600", textAlign: "center" },
  stateText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: "center" },
  retryButton: { marginTop: spacing.lg, minHeight: 42, justifyContent: "center", borderRadius: radius.pill, backgroundColor: colors.gold, paddingHorizontal: spacing.xl },
  retryText: { color: "#090909", fontSize: 12, fontWeight: "700" },
  heroCard: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 30, padding: spacing.xl },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 },
  quickPill: { borderColor: "rgba(246,212,135,0.28)", backgroundColor: "rgba(246,212,135,0.08)" },
  castingPill: { borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.07)" },
  modeText: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  quickText: { color: "#F6D487" },
  featured: { color: "rgba(201,169,98,0.65)", fontSize: 9, fontWeight: "700" },
  title: { color: colors.textPrimary, fontSize: 29, lineHeight: 37, fontWeight: "700", marginTop: spacing.xl },
  companyRow: { marginTop: spacing.md },
  companyRowRtl: { alignSelf: "flex-end" },
  companyRowLtr: { alignSelf: "flex-start" },
  company: { color: "rgba(255,255,255,0.52)", fontSize: 13 },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 25, marginTop: spacing.lg },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg },
  infoCard: { width: "48%", minHeight: 94, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.lg, padding: spacing.md },
  infoLabel: { color: "rgba(255,255,255,0.36)", fontSize: 10 },
  infoValue: { color: colors.textPrimary, fontSize: 13, lineHeight: 20, fontWeight: "600", marginTop: spacing.sm },
  sectionCard: { marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.025)", borderRadius: radius.xl, padding: spacing.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: spacing.sm },
  detailRow: { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingVertical: spacing.md },
  detailLabelWrap: { flexShrink: 1 },
  detailLabel: { color: colors.textMuted, fontSize: 11 },
  detailValue: { color: "rgba(255,255,255,0.76)", fontSize: 12, fontWeight: "600", flex: 1, marginHorizontal: spacing.md },
  semanticCard: { marginTop: spacing.lg, borderWidth: 1, borderColor: "rgba(201,169,98,0.18)", backgroundColor: "rgba(201,169,98,0.055)", borderRadius: radius.xl, padding: spacing.lg },
  semanticEyebrow: { color: colors.gold, fontSize: 10, fontWeight: "700" },
  semanticTitle: { color: colors.textPrimary, fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: spacing.sm },
  semanticText: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: spacing.sm },
});
