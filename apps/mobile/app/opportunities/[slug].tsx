import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { resolveMobileMarket } from "@/lib/account";
import { applyToOpportunity, getPublicOpportunity, type ApplyResult, type MobileOpportunity } from "@/lib/api";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getMobileMarketLabel } from "@/lib/market-labels";
import { darkTheme } from "@/lib/theme";

export default function OpportunityDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
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
    await Share.share({ title: item.title, message: `${item.title}\n${url}`, url });
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

  if (loading) return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "تحميل تفاصيل الفرصة" : "Loading opportunity details"} />;
  if (error || !item) return <View style={styles.centered}><Text accessibilityRole="alert" style={styles.errorText}>{isArabic ? "تعذر فتح هذه الفرصة." : "Unable to open this opportunity."}</Text><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={styles.secondaryButton} onPress={() => router.back()}><Text style={styles.secondaryButtonText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View>;

  const compensation = item.compensationType === "unpaid"
    ? (isArabic ? "غير مدفوعة" : "Unpaid")
    : item.budget && item.currency ? `${item.budget} ${item.currency}` : item.compensationType === "negotiable" ? (isArabic ? "حسب الاتفاق" : "Negotiable") : (isArabic ? "غير محدد" : "Not specified");
  const publishedLabel = formatDate(item.createdAt, locale);
  const deadlineLabel = formatDate(item.applicationDeadline ?? item.expiresAt, locale);
  const workDateLabel = formatDate(item.workDate, locale);
  const ageLabel = formatAge(item.minAge, item.maxAge, isArabic);
  const genderLabel = formatGender(item.requiredGender, isArabic);
  const durationLabel = formatDuration(item.workDuration, isArabic);
  const roleRequirementItems = getRoleRequirementItems(item, isArabic);
  const applyMessage = applyError ?? getApplyMessage(applyResult);
  const applied = applyResult?.ok === true || (!applyResult?.ok && applyResult?.code === "ALREADY_APPLIED");
  const marketLabel = getMobileMarketLabel(item.countryCode, locale);
  const locationLabel = [item.city, marketLabel].filter(Boolean).join(" · ");

  return <View style={styles.screen}>
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={[styles.topBar, { direction: isRtl ? "rtl" : "ltr" }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={12} style={styles.roundAction}><Text style={[styles.topIcon, isRtl && styles.topIconRtl]}>‹</Text></Pressable>
        <Text style={styles.topBrand}>MLAMH</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "مشاركة الفرصة" : "Share opportunity"} onPress={() => void shareOpportunity()} hitSlop={10} style={styles.roundAction}><Text style={styles.shareIcon}>↗</Text></Pressable>
      </View>

      <View style={[styles.hero, { direction: isRtl ? "rtl" : "ltr" }]}>
        <View style={styles.badgeRow}>{item.featured ? <Text style={styles.goldBadge}>{isArabic ? "مميزة" : "Featured"}</Text> : null}<Text style={styles.neutralBadge}>{formatType(item.opportunityType, isArabic)}</Text></View>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{item.title}</Text>
        <Text style={[styles.company, { textAlign: isRtl ? "right" : "left" }]}>{item.companyName}</Text>
        {locationLabel ? <Text style={[styles.location, { textAlign: isRtl ? "right" : "left" }]}>{locationLabel}</Text> : null}
      </View>

      <View style={[styles.factStrip, { direction: isRtl ? "rtl" : "ltr" }]}>
        <Fact label={isArabic ? "المقابل" : "Compensation"} value={compensation} styles={styles} />
        <Fact label={isArabic ? "العمر" : "Age"} value={ageLabel} styles={styles} />
        <Fact label={isArabic ? "آخر موعد" : "Deadline"} value={deadlineLabel ?? (isArabic ? "مفتوح" : "Open")} styles={styles} />
      </View>

      <Section title={isArabic ? "عن الفرصة" : "About the opportunity"} styles={styles} isRtl={isRtl}>
        <Text style={[styles.description, { textAlign: isRtl ? "right" : "left" }]}>{item.description ? normalizeDisplayText(item.description) : (isArabic ? "لا يوجد وصف متاح لهذه الفرصة." : "No description is available for this opportunity.")}</Text>
      </Section>

      <Section title={isArabic ? "التفاصيل الأساسية" : "Key details"} styles={styles} isRtl={isRtl}>
        <View style={styles.metaGrid}>
          <Meta label={isArabic ? "نوع الفرصة" : "Type"} value={formatType(item.opportunityType, isArabic)} styles={styles} />
          <Meta label={isArabic ? "الجنس" : "Gender"} value={genderLabel} styles={styles} />
          {item.requiredCount ? <Meta label={isArabic ? "العدد المطلوب" : "Talent needed"} value={String(item.requiredCount)} styles={styles} /> : null}
          {workDateLabel ? <Meta label={isArabic ? "تاريخ العمل" : "Work date"} value={workDateLabel} styles={styles} /> : null}
          {durationLabel ? <Meta label={isArabic ? "مدة العمل" : "Duration"} value={durationLabel} styles={styles} /> : null}
          {publishedLabel ? <Meta label={isArabic ? "تاريخ النشر" : "Published"} value={publishedLabel} styles={styles} /> : null}
        </View>
      </Section>

      {roleRequirementItems.length > 0 ? <Section title={isArabic ? "متطلبات الدور" : "Role requirements"} styles={styles} isRtl={isRtl}><View style={styles.requirementList}>{roleRequirementItems.map((entry) => <View key={`${entry.label}-${entry.value}`} style={styles.requirementRow}><Text style={styles.requirementLabel}>{entry.label}</Text><Text style={styles.requirementValue}>{entry.value}</Text></View>)}</View></Section> : null}

      {item.managedByMlamh ? <View style={[styles.trustCard, { direction: isRtl ? "rtl" : "ltr" }]}><View style={styles.trustDot} /><View style={styles.trustCopy}><Text style={[styles.trustTitle, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "هذه الفرصة مُدارة عبر ملامح" : "Managed through MLAMH"}</Text><Text style={[styles.trustBody, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "استقبال الطلبات ومراحل الاختيار تتم من خلال المنصة." : "Applications and selection stages are handled through the platform."}</Text></View></View> : null}
    </ScrollView>

    <View style={styles.ctaBar}>
      {applyMessage ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.applyMessage, applied && styles.applySuccess]}>{applyMessage}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={applied ? (isArabic ? "تم التقديم" : "Applied") : (isArabic ? "تقدم على الفرصة" : "Apply to opportunity")} accessibilityState={{ disabled: applyLoading || applied, busy: applyLoading }} disabled={applyLoading || applied} onPress={() => void apply()} style={({ pressed }) => [styles.primaryButton, (applyLoading || applied) && styles.buttonDisabled, pressed && !applied && styles.pressed]}>
        {applyLoading ? <ActivityIndicator accessibilityLabel={isArabic ? "جارٍ إرسال الطلب" : "Submitting application"} color={theme.background} /> : <Text style={styles.primaryButtonText}>{applied ? (isArabic ? "تم التقديم" : "Applied") : (isArabic ? "تقدم على الفرصة" : "Apply to opportunity")}</Text>}
      </Pressable>
    </View>
  </View>;
}

function Section({ title, children, styles, isRtl }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={[styles.section, { direction: isRtl ? "rtl" : "ltr" }]}><Text style={[styles.sectionTitle, { textAlign: isRtl ? "right" : "left" }]}>{title}</Text>{children}</View>; }
function Fact({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.fact}><Text numberOfLines={2} style={styles.factValue}>{value}</Text><Text style={styles.factLabel}>{label}</Text></View>; }
function Meta({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.metaItem}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>; }

function normalizeDisplayText(value: string) { return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim(); }
function formatDate(value: string | null | undefined, locale: "ar" | "en") { if (!value) return null; const date = new Date(value); if (Number.isNaN(date.getTime())) return null; return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { year: "numeric", month: "short", day: "numeric" }).format(date); }
function formatType(value: string, ar: boolean) { const key = value.toLowerCase(); if (key === "actor") return ar ? "ممثل / ممثلة" : "Actor"; if (key === "model") return ar ? "مودل" : "Model"; return value.replaceAll("_", " "); }
function formatGender(value: string | null, ar: boolean) { if (!value || value === "any" || value === "all") return ar ? "الجميع" : "Any"; if (value === "male") return ar ? "ذكر" : "Male"; if (value === "female") return ar ? "أنثى" : "Female"; return value; }
function formatAge(min: number | null, max: number | null, ar: boolean) { if (min == null && max == null) return ar ? "جميع الأعمار" : "All ages"; if (min != null && max != null) return ar ? `${min}–${max} سنة` : `${min}–${max} years`; if (min != null) return ar ? `${min}+ سنة` : `${min}+ years`; return ar ? `حتى ${max} سنة` : `Up to ${max}`; }
function formatDuration(value: string | null, ar: boolean) { if (!value) return null; const map: Record<string, [string,string]> = { "1_hour": ["ساعة", "1 hour"], "2_hours": ["ساعتان", "2 hours"], "4_hours": ["4 ساعات", "4 hours"], "full_day": ["يوم كامل", "Full day"] }; return map[value]?.[ar ? 0 : 1] ?? value.replaceAll("_", " "); }
function humanizeRequirement(value: unknown, ar: boolean) { const key = String(value ?? "").trim().toLowerCase().replaceAll("-", "_"); const labels: Record<string, [string,string]> = { arabic:["العربية","Arabic"], english:["الإنجليزية","English"], french:["الفرنسية","French"], najdi:["نجدي","Najdi"], hejazi:["حجازي","Hejazi"], southern:["جنوبي","Southern"], northern:["شمالي","Northern"], gulf:["خليجي","Gulf"], commercial:["تجاري","Commercial"], fashion:["أزياء","Fashion"], beauty:["جمال","Beauty"], lifestyle:["لايف ستايل","Lifestyle"], ecommerce:["متاجر إلكترونية","E-commerce"], black:["أسود","Black"], brown:["بني","Brown"], blonde:["أشقر","Blonde"], red:["أحمر","Red"], gray:["رمادي","Gray"] }; return labels[key]?.[ar ? 0 : 1] ?? key.replaceAll("_", " "); }
function getRoleRequirementItems(item: MobileOpportunity, ar: boolean) { const req = item.roleRequirements ?? {}; const list: Array<{label:string;value:string}> = []; const arr = (key: string) => Array.isArray(req[key]) ? (req[key] as unknown[]).map((v) => humanizeRequirement(v, ar)).filter(Boolean) : []; if (item.opportunityType.toLowerCase() === "actor") { const languages = arr("languages"); const dialects = arr("dialects"); if (languages.length) list.push({ label: ar ? "اللغات المطلوبة" : "Languages", value: languages.join(ar ? "، " : ", ") }); if (dialects.length) list.push({ label: ar ? "اللهجات المطلوبة" : "Dialects", value: dialects.join(ar ? "، " : ", ") }); } if (item.opportunityType.toLowerCase() === "model") { const modelingTypes = arr("modeling_types"); if (modelingTypes.length) list.push({ label: ar ? "نوع أعمال المودل" : "Modeling types", value: modelingTypes.join(ar ? "، " : ", ") }); if (req.min_height_cm != null) list.push({ label: ar ? "الحد الأدنى للطول" : "Minimum height", value: `${req.min_height_cm} ${ar ? "سم" : "cm"}` }); if (req.hair_color) list.push({ label: ar ? "لون الشعر" : "Hair color", value: humanizeRequirement(req.hair_color, ar) }); } return list; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 26, paddingBottom: 148, gap: 18 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, roundAction: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, topIcon: { color: theme.text, fontSize: 30, lineHeight: 32 }, topIconRtl: { transform: [{ rotate: "180deg" }] }, shareIcon: { color: theme.text, fontSize: 19 }, topBrand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  hero: { gap: 8, paddingTop: 8, paddingBottom: 8 }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, goldBadge: { color: theme.background, backgroundColor: theme.accent, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "800" }, neutralBadge: { color: theme.text, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "700" }, title: { color: theme.text, fontSize: 31, lineHeight: 39, fontWeight: "700" }, company: { color: theme.text, fontSize: 15, fontWeight: "700" }, location: { color: theme.muted, fontSize: 12 },
  factStrip: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.border, paddingVertical: 14 }, fact: { flex: 1, paddingHorizontal: 8, gap: 4 }, factValue: { color: theme.text, fontSize: 13, fontWeight: "700", textAlign: "center" }, factLabel: { color: theme.muted, fontSize: 9, textAlign: "center" },
  section: { gap: 12, paddingTop: 6 }, sectionTitle: { color: theme.text, fontSize: 19, fontWeight: "700" }, description: { color: theme.muted, fontSize: 14, lineHeight: 23 }, metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metaItem: { width: "48%", minHeight: 74, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 13, gap: 5 }, metaLabel: { color: theme.muted, fontSize: 10 }, metaValue: { color: theme.text, fontSize: 13, fontWeight: "700" }, requirementList: { borderTopWidth: 1, borderColor: theme.border }, requirementRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 4 }, requirementLabel: { color: theme.muted, fontSize: 10 }, requirementValue: { color: theme.text, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  trustCard: { flexDirection: "row", gap: 11, alignItems: "flex-start", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 }, trustDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, marginTop: 5 }, trustCopy: { flex: 1, gap: 4 }, trustTitle: { color: theme.text, fontSize: 13, fontWeight: "700" }, trustBody: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background }, primaryButton: { minHeight: 52, borderRadius: 12, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "800" }, buttonDisabled: { opacity: 0.5 }, pressed: { opacity: 0.8 }, applyMessage: { color: "#E59A9A", fontSize: 12, textAlign: "center", marginBottom: 8 }, applySuccess: { color: theme.accent }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 44, paddingHorizontal: 18, paddingVertical: 12, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 13, fontWeight: "700" }, errorText: { color: theme.text, fontSize: 14, textAlign: "center" },
}); }
