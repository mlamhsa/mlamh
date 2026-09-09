import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Share2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { resolveMobileMarket } from "@/lib/account";
import { applyToOpportunity, getPublicOpportunity, type ApplyResult, type MobileOpportunity } from "@/lib/api";
import { formatGregorianDate, isRtlLocale } from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { getMobileMarketLabel } from "@/lib/market-labels";
import { darkTheme } from "@/lib/theme";

const BLOCKING_APPLY_CODES = new Set(["PROFILE_INCOMPLETE", "TALENT_NOT_APPROVED", "NOT_TALENT", "ACCOUNT_RESTRICTED"]);

function getApplyApprovalStatus(result: ApplyResult | null) {
  if (!result || result.ok) return null;
  const value = result.details?.approvalStatus;
  return typeof value === "string" ? value : null;
}

export default function OpportunityDetailScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { locale } = useAppLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<MobileOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [gateVisible, setGateVisible] = useState(false);

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
  }, [locale, reloadKey, slug]);

  function retryLoad() { setItem(null); setError(false); setLoading(true); setReloadKey((value) => value + 1); }

  async function apply() {
    if (!item || applyLoading) return;
    setApplyLoading(true);
    setApplyResult(null);
    setApplyError(null);
    setGateVisible(false);
    try {
      const result = await applyToOpportunity(item.id);
      if (!result.ok && result.code === "UNAUTHENTICATED") {
        router.push({ pathname: "/login", params: { next: `/opportunities/${item.slug}` } });
        return;
      }
      setApplyResult(result);
      if (!result.ok && BLOCKING_APPLY_CODES.has(result.code)) setGateVisible(true);
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
    const approvalStatus = getApplyApprovalStatus(result);
    if (result.code === "PROFILE_INCOMPLETE" && approvalStatus === "approved") {
      return isArabic
        ? "اعتمادك محفوظ، لكن توجد بيانات أساسية ناقصة. أكملها ثم ارجع للتقديم على الفرصة."
        : "Your approval is preserved, but required profile details are missing. Complete them, then return to apply.";
    }
    if (result.code === "TALENT_NOT_APPROVED" && (approvalStatus === "pending" || approvalStatus === "submitted")) {
      return isArabic
        ? "ملفك قيد المراجعة حاليًا. لا تحتاج لإعادة الإرسال؛ يمكنك التقديم بعد الاعتماد."
        : "Your profile is currently under review. No need to resubmit; you can apply once it is approved.";
    }
    const messages: Record<string, { ar: string; en: string }> = {
      ALREADY_APPLIED: { ar: "سبق أن تقدمت على هذه الفرصة.", en: "You already applied to this opportunity." },
      PROFILE_INCOMPLETE: { ar: "أكمل متطلبات ملفك الأساسية أولًا، ثم أرسله للمراجعة إذا لم يكن معتمدًا بعد.", en: "Complete your required profile details first, then submit for review if your profile is not already approved." },
      TALENT_NOT_APPROVED: { ar: "ملفك مكتمل لكنه يحتاج الاعتماد قبل التقديم على الفرص.", en: "Your profile is complete but must be approved before you can apply." },
      NOT_TALENT: { ar: "أنشئ ملف موهبة أولًا للتقديم على الفرص.", en: "Create a talent profile before applying to opportunities." },
      ACCOUNT_RESTRICTED: { ar: "الحساب غير متاح للتقديم حاليًا.", en: "This account cannot apply right now." },
      APPLICATION_WINDOW_CLOSED: { ar: "انتهت مدة استقبال الطلبات.", en: "The application window has closed." },
      OPPORTUNITY_NOT_AVAILABLE: { ar: "الفرصة غير متاحة للتقديم حاليًا.", en: "This opportunity is not currently available." },
    };
    const message = messages[result.code] ?? { ar: "تعذر إكمال التقديم. حاول مرة أخرى.", en: "Unable to complete your application. Please try again." };
    return isArabic ? message.ar : message.en;
  }

  function gateAction() {
    if (!applyResult || applyResult.ok) return;
    setGateVisible(false);
    if (applyResult.code === "PROFILE_INCOMPLETE") router.push("/profile/edit");
    else router.push("/profile");
  }

  if (loading) return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "تحميل تفاصيل الفرصة" : "Loading opportunity details"} />;
  if (error || !item) return <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}><Text accessibilityRole="alert" style={styles.errorText}>{isArabic ? "تعذر فتح هذه الفرصة." : "Unable to open this opportunity."}</Text><Text style={styles.errorHint}>{isArabic ? "تحقق من الاتصال ثم أعد المحاولة، أو ارجع إلى قائمة الفرص." : "Check your connection and try again, or return to the opportunities list."}</Text><View style={[styles.errorActions, isRtl && styles.rowReverse]}><Pressable accessibilityRole="button" onPress={retryLoad} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.back()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></View></View>;

  const compensation = item.compensationType === "unpaid" ? (isArabic ? "غير مدفوعة" : "Unpaid") : item.budget && item.currency ? `${item.budget} ${item.currency}` : item.compensationType === "negotiable" ? (isArabic ? "حسب الاتفاق" : "Negotiable") : (isArabic ? "غير محدد" : "Not specified");
  const publishedLabel = formatDate(item.createdAt, locale);
  const deadlineLabel = formatDate(item.applicationDeadline ?? item.expiresAt, locale);
  const workDateLabel = formatDate(item.workDate, locale);
  const ageLabel = formatAge(item.minAge, item.maxAge, isArabic);
  const genderLabel = formatGender(item.requiredGender, isArabic);
  const durationLabel = formatDuration(item.workDuration, isArabic);
  const roleRequirementItems = getRoleRequirementItems(item, isArabic);
  const applyMessage = applyError ?? getApplyMessage(applyResult);
  const applied = applyResult?.ok === true || (!applyResult?.ok && applyResult?.code === "ALREADY_APPLIED");
  const isBlockingResult = !applyResult?.ok && Boolean(applyResult && BLOCKING_APPLY_CODES.has(applyResult.code));
  const marketLabel = getMobileMarketLabel(item.countryCode, locale);
  const locationLabel = [item.city, marketLabel].filter(Boolean).join(" · ");
  const gateApprovalStatus = getApplyApprovalStatus(applyResult);
  const approvedButIncomplete = Boolean(applyResult && !applyResult.ok && applyResult.code === "PROFILE_INCOMPLETE" && gateApprovalStatus === "approved");
  const reviewPending = Boolean(applyResult && !applyResult.ok && applyResult.code === "TALENT_NOT_APPROVED" && (gateApprovalStatus === "pending" || gateApprovalStatus === "submitted"));
  const gateTitle = approvedButIncomplete
    ? (isArabic ? "اعتمادك محفوظ — أكمل بياناتك" : "Your approval is preserved")
    : reviewPending
      ? (isArabic ? "ملفك قيد المراجعة" : "Your profile is in review")
      : applyResult && !applyResult.ok && applyResult.code === "TALENT_NOT_APPROVED"
        ? (isArabic ? "ملفك يحتاج الاعتماد" : "Your profile needs approval")
        : (isArabic ? "جهّز ملفك المهني" : "Get your profile ready");
  const gateStep = approvedButIncomplete
    ? (isArabic ? "أكمل البيانات المطلوبة → ارجع للفرصة → قدّم مباشرة" : "Complete required details → return to the opportunity → apply")
    : reviewPending
      ? (isArabic ? "لا تحتاج لإعادة الإرسال → راقب حالة المراجعة → قدّم بعد الاعتماد" : "No resubmission needed → watch review status → apply after approval")
      : applyResult && !applyResult.ok && applyResult.code === "TALENT_NOT_APPROVED"
        ? (isArabic ? "افتح ملفك → أرسله للمراجعة إذا لم يُرسل → قدّم بعد الاعتماد" : "Open your profile → submit for review if needed → apply after approval")
        : (isArabic ? "أكمل الملف → أرسله للمراجعة إذا لزم → بعد الاعتماد يمكنك التقديم" : "Complete profile → submit for review if needed → apply after approval");

  return <View style={styles.screen}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 8, 20), paddingBottom: 132 + insets.bottom }]}>
      <View style={[styles.topBar, isRtl && styles.rowReverse]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} style={({ pressed }) => [styles.roundAction, pressed && styles.pressed]}>{isRtl ? <ArrowRight size={21} color={theme.text}/> : <ArrowLeft size={21} color={theme.text}/>}</Pressable>
        <Text style={styles.topBrand}>MLAMH</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "مشاركة الفرصة" : "Share opportunity"} onPress={() => void shareOpportunity()} style={({ pressed }) => [styles.roundAction, pressed && styles.pressed]}><Share2 size={19} color={theme.text}/></Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={[styles.badgeRow, isRtl && styles.rowReverse]}>{item.featured ? <Text style={[styles.goldBadge, isRtl && styles.rtlText]}>{isArabic ? "مميزة" : "Featured"}</Text> : null}<Text style={[styles.neutralBadge, isRtl && styles.rtlText]}>{formatType(item.opportunityType, isArabic)}</Text></View>
        <Text accessibilityRole="header" style={[styles.title, isRtl && styles.rtlText]}>{item.title}</Text>
        <Text style={[styles.company, isRtl && styles.rtlText]}>{item.companyName}</Text>
        {locationLabel ? <Text style={[styles.location, isRtl && styles.rtlText]}>{locationLabel}</Text> : null}
      </View>

      <View style={[styles.factStrip, isRtl && styles.rowReverse]}><Fact label={isArabic ? "المقابل" : "Compensation"} value={compensation} styles={styles}/><Fact label={isArabic ? "العمر" : "Age"} value={ageLabel} styles={styles}/><Fact label={isArabic ? "آخر موعد" : "Deadline"} value={deadlineLabel ?? (isArabic ? "مفتوح" : "Open")} styles={styles}/></View>
      <Section title={isArabic ? "عن الفرصة" : "About the opportunity"} styles={styles} isRtl={isRtl}><Text style={[styles.description, isRtl && styles.rtlText]}>{item.description ? normalizeDisplayText(item.description) : (isArabic ? "لا يوجد وصف متاح لهذه الفرصة." : "No description is available for this opportunity.")}</Text></Section>
      <Section title={isArabic ? "التفاصيل الأساسية" : "Key details"} styles={styles} isRtl={isRtl}><View style={styles.metaGrid}><Meta label={isArabic ? "نوع الفرصة" : "Type"} value={formatType(item.opportunityType, isArabic)} styles={styles} isRtl={isRtl}/><Meta label={isArabic ? "الجنس" : "Gender"} value={genderLabel} styles={styles} isRtl={isRtl}/>{item.requiredCount ? <Meta label={isArabic ? "العدد المطلوب" : "Talent needed"} value={String(item.requiredCount)} styles={styles} isRtl={isRtl}/> : null}{workDateLabel ? <Meta label={isArabic ? "تاريخ العمل" : "Work date"} value={workDateLabel} styles={styles} isRtl={isRtl}/> : null}{durationLabel ? <Meta label={isArabic ? "مدة العمل" : "Duration"} value={durationLabel} styles={styles} isRtl={isRtl}/> : null}{publishedLabel ? <Meta label={isArabic ? "تاريخ النشر" : "Published"} value={publishedLabel} styles={styles} isRtl={isRtl}/> : null}</View></Section>
      {roleRequirementItems.length > 0 ? <Section title={isArabic ? "متطلبات الدور" : "Role requirements"} styles={styles} isRtl={isRtl}><View style={styles.requirementList}>{roleRequirementItems.map((entry) => <View key={`${entry.label}-${entry.value}`} style={styles.requirementRow}><Text style={[styles.requirementLabel, isRtl && styles.rtlText]}>{entry.label}</Text><Text style={[styles.requirementValue, isRtl && styles.rtlText]}>{entry.value}</Text></View>)}</View></Section> : null}
      {item.managedByMlamh ? <View style={[styles.trustCard, isRtl && styles.rowReverse]}><View style={styles.trustDot}/><View style={styles.trustCopy}><Text style={[styles.trustTitle, isRtl && styles.rtlText]}>{isArabic ? "هذه الفرصة مُدارة عبر ملامح" : "Managed through MLAMH"}</Text><Text style={[styles.trustBody, isRtl && styles.rtlText]}>{isArabic ? "استقبال الطلبات ومراحل الاختيار تتم من خلال المنصة." : "Applications and selection stages are handled through the platform."}</Text></View></View> : null}
    </ScrollView>

    <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}>{applyMessage && !isBlockingResult ? <Text accessibilityRole="alert" style={[styles.applyMessage, applied && styles.applySuccess, isRtl && styles.rtlText]}>{applyMessage}</Text> : null}<Pressable disabled={applyLoading || applied} onPress={() => void apply()} style={({ pressed }) => [styles.primaryButton, (applyLoading || applied) && styles.buttonDisabled, pressed && !applied && styles.pressed]}>{applyLoading ? <ActivityIndicator color={theme.background}/> : <Text style={[styles.primaryButtonText, isRtl && styles.rtlText]}>{applied ? (isArabic ? "تم التقديم" : "Applied") : (isArabic ? "تقدم على الفرصة" : "Apply to opportunity")}</Text>}</Pressable></View>

    <Modal animationType="fade" transparent visible={gateVisible} onRequestClose={() => setGateVisible(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.gateCard}>
          <View style={styles.gateIcon}><LockKeyhole size={25} color={theme.accent} strokeWidth={1.8}/></View>
          <Text style={[styles.gateEyebrow, isRtl && styles.rtlText]}>{isArabic ? "قبل التقديم" : "BEFORE YOU APPLY"}</Text>
          <Text accessibilityRole="header" style={[styles.gateTitle, isRtl && styles.rtlText]}>{gateTitle}</Text>
          <Text accessibilityRole="alert" style={[styles.gateBody, isRtl && styles.rtlText]}>{getApplyMessage(applyResult)}</Text>
          <View style={[styles.gateSteps, isRtl && styles.rowReverse]}><CheckCircle2 size={17} color={theme.accent}/><Text style={[styles.gateStepText, isRtl && styles.rtlText]}>{gateStep}</Text></View>
          <Pressable accessibilityRole="button" onPress={gateAction} style={({ pressed }) => [styles.primaryButton, styles.gatePrimary, pressed && styles.pressed]}><Text style={[styles.primaryButtonText, isRtl && styles.rtlText]}>{applyResult && !applyResult.ok && applyResult.code === "PROFILE_INCOMPLETE" ? (isArabic ? "إكمال البيانات" : "Complete profile") : (isArabic ? "الذهاب إلى ملفي" : "Go to my profile")}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setGateVisible(false)} style={({ pressed }) => [styles.gateDismiss, pressed && styles.pressed]}><Text style={[styles.gateDismissText, isRtl && styles.rtlText]}>{isArabic ? "لاحقًا" : "Not now"}</Text></Pressable>
        </View>
      </View>
    </Modal>
  </View>;
}

function Section({ title, children, styles, isRtl }: { title: string; children: React.ReactNode; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.section}><Text style={[styles.sectionTitle, isRtl && styles.rtlText]}>{title}</Text>{children}</View>; }
function Fact({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.fact}><Text numberOfLines={2} style={styles.factValue}>{value}</Text><Text style={styles.factLabel}>{label}</Text></View>; }
function Meta({ label, value, styles, isRtl }: { label: string; value: string; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.metaItem}><Text style={[styles.metaLabel, isRtl && styles.rtlText]}>{label}</Text><Text style={[styles.metaValue, isRtl && styles.rtlText]}>{value}</Text></View>; }
function normalizeDisplayText(value: string) { return value.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim(); }
function formatDate(value: string | null | undefined, locale: "ar" | "en") { return formatGregorianDate(value, locale, { year: "numeric", month: "short", day: "numeric" }); }).format(date); }
function formatType(value: string, ar: boolean) { const key = value.toLowerCase(); if (key === "actor") return ar ? "ممثل / ممثلة" : "Actor"; if (key === "model") return ar ? "مودل" : "Model"; return value.replaceAll("_", " "); }
function formatGender(value: string | null, ar: boolean) { if (!value || value === "any" || value === "all") return ar ? "الجميع" : "Any"; if (value === "male") return ar ? "ذكر" : "Male"; if (value === "female") return ar ? "أنثى" : "Female"; return value; }
function formatAge(min: number | null, max: number | null, ar: boolean) { if (min == null && max == null) return ar ? "جميع الأعمار" : "All ages"; if (min != null && max != null) return ar ? `${min}–${max} سنة` : `${min}–${max} years`; if (min != null) return ar ? `${min}+ سنة` : `${min}+ years`; return ar ? `حتى ${max} سنة` : `Up to ${max}`; }
function formatDuration(value: string | null, ar: boolean) { if (!value) return null; const map: Record<string, [string,string]> = { "1_hour": ["ساعة", "1 hour"], "2_hours": ["ساعتان", "2 hours"], "4_hours": ["4 ساعات", "4 hours"], "full_day": ["يوم كامل", "Full day"] }; return map[value]?.[ar ? 0 : 1] ?? value.replaceAll("_", " "); }
function humanizeRequirement(value: unknown, ar: boolean) { const key = String(value ?? "").trim().toLowerCase().replaceAll("-", "_"); const labels: Record<string, [string,string]> = { arabic:["العربية","Arabic"], english:["الإنجليزية","English"], french:["الفرنسية","French"], najdi:["نجدي","Najdi"], hejazi:["حجازي","Hejazi"], southern:["جنوبي","Southern"], northern:["شمالي","Northern"], gulf:["خليجي","Gulf"], commercial:["تجاري","Commercial"], fashion:["أزياء","Fashion"], beauty:["جمال","Beauty"], lifestyle:["لايف ستايل","Lifestyle"], ecommerce:["متاجر إلكترونية","E-commerce"], black:["أسود","Black"], brown:["بني","Brown"], blonde:["أشقر","Blonde"], red:["أحمر","Red"], gray:["رمادي","Gray"] }; return labels[key]?.[ar ? 0 : 1] ?? key.replaceAll("_", " "); }
function getRoleRequirementItems(item: MobileOpportunity, ar: boolean) { const req = item.roleRequirements ?? {}; const list: Array<{label:string;value:string}> = []; const arr = (key: string) => Array.isArray(req[key]) ? (req[key] as unknown[]).map((v) => humanizeRequirement(v, ar)).filter(Boolean) : []; if (item.opportunityType.toLowerCase() === "actor") { const languages = arr("languages"); const dialects = arr("dialects"); if (languages.length) list.push({ label: ar ? "اللغات المطلوبة" : "Languages", value: languages.join(ar ? "، " : ", ") }); if (dialects.length) list.push({ label: ar ? "اللهجات المطلوبة" : "Dialects", value: dialects.join(ar ? "، " : ", ") }); } if (item.opportunityType.toLowerCase() === "model") { const modelingTypes = arr("modeling_types"); if (modelingTypes.length) list.push({ label: ar ? "نوع أعمال المودل" : "Modeling types", value: modelingTypes.join(ar ? "، " : ", ") }); if (req.min_height_cm != null) list.push({ label: ar ? "الحد الأدنى للطول" : "Minimum height", value: `${req.min_height_cm} ${ar ? "سم" : "cm"}` }); if (req.hair_color) list.push({ label: ar ? "لون الشعر" : "Hair color", value: humanizeRequirement(req.hair_color, ar) }); } return list; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, rowReverse: { flexDirection: "row-reverse" }, rtlText: { textAlign: "right", writingDirection: "rtl" }, centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 24, backgroundColor: theme.background }, content: { paddingHorizontal: 18, gap: 16 }, topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, roundAction: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, topBrand: { color: theme.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2 }, heroCard: { gap: 9, padding: 18, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: "#C9A96233" }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, goldBadge: { color: theme.background, backgroundColor: theme.accent, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "800" }, neutralBadge: { color: theme.text, backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: "700" }, title: { color: theme.text, fontSize: 27, lineHeight: 34, fontWeight: "800" }, company: { color: theme.text, fontSize: 15, fontWeight: "700" }, location: { color: theme.muted, fontSize: 12 }, factStrip: { flexDirection: "row", gap: 8 }, fact: { flex: 1, minHeight: 72, paddingHorizontal: 10, paddingVertical: 12, gap: 4, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, justifyContent: "center" }, factValue: { color: theme.text, fontSize: 13, fontWeight: "700", textAlign: "center", writingDirection: "ltr" }, factLabel: { color: theme.muted, fontSize: 9, textAlign: "center" }, section: { gap: 12, paddingTop: 6 }, sectionTitle: { color: theme.text, fontSize: 19, fontWeight: "700" }, description: { color: theme.muted, fontSize: 14, lineHeight: 23 }, metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, metaItem: { width: "48%", minHeight: 74, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 13, gap: 5 }, metaLabel: { color: theme.muted, fontSize: 10 }, metaValue: { color: theme.text, fontSize: 13, fontWeight: "700" }, requirementList: { borderTopWidth: 1, borderColor: theme.border }, requirementRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 4 }, requirementLabel: { color: theme.muted, fontSize: 10 }, requirementValue: { color: theme.text, fontSize: 13, lineHeight: 19, fontWeight: "600" }, trustCard: { flexDirection: "row", gap: 11, alignItems: "flex-start", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 }, trustDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent, marginTop: 5 }, trustCopy: { flex: 1, gap: 4 }, trustTitle: { color: theme.text, fontSize: 13, fontWeight: "700" }, trustBody: { color: theme.muted, fontSize: 11, lineHeight: 17 }, ctaBar: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.background }, primaryButton: { minHeight: 54, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, primaryButtonText: { color: theme.background, fontSize: 15, fontWeight: "800", textAlign: "center" }, buttonDisabled: { opacity: 0.5 }, pressed: { opacity: 0.72 }, applyMessage: { color: "#E59A9A", fontSize: 12, textAlign: "center", marginBottom: 8 }, applySuccess: { color: theme.accent }, errorHint: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: "center", maxWidth: 320 }, errorActions: { width: "100%", maxWidth: 340, flexDirection: "row", gap: 10 }, retryButton: { flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: theme.accent, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }, retryButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" }, secondaryButton: { flex: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 12, minHeight: 46, paddingHorizontal: 18, paddingVertical: 12, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 13, fontWeight: "700" }, errorText: { color: theme.text, fontSize: 15, fontWeight: "800", textAlign: "center" }, modalBackdrop: { flex: 1, backgroundColor: "#000000B8", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 }, gateCard: { width: "100%", maxWidth: 420, borderRadius: 24, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: theme.surfaceElevated, padding: 22, gap: 12, alignItems: "stretch" }, gateIcon: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: "#C9A96255", backgroundColor: "#C9A9620C", alignItems: "center", justifyContent: "center", alignSelf: "center" }, gateEyebrow: { color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, textAlign: "center" }, gateTitle: { color: theme.text, fontSize: 23, lineHeight: 30, fontWeight: "800", textAlign: "center" }, gateBody: { color: theme.muted, fontSize: 14, lineHeight: 22, textAlign: "center" }, gateSteps: { flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.surface, padding: 12 }, gateStepText: { flex: 1, color: theme.text, fontSize: 11, lineHeight: 18 }, gatePrimary: { marginTop: 2 }, gateDismiss: { minHeight: 44, alignItems: "center", justifyContent: "center" }, gateDismissText: { color: theme.muted, fontSize: 12, fontWeight: "700" }
}); }
