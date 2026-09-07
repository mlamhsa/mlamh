import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Archive, ChevronLeft, ChevronRight, Edit3, MessageCircle, Send, XCircle } from "lucide-react-native";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherOpportunity, managePublisherOpportunity, updatePublisherApplicantStatus, type PublisherApplicant, type PublisherOpportunityAction, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

const EDITABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
const SUBMITTABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
type ApplicantDecision = "accepted" | "rejected" | "shortlisted";

export default function PublisherOpportunityDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const opportunityId = Number(rawId);
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;
  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<PublisherOpportunityAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      setError(isArabic ? "الفرصة غير صالحة." : "Invalid opportunity.");
      setLoading(false); setRefreshing(false); return;
    }
    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await getPublisherOpportunity(opportunityId, locale);
      if (!result) {
        setDetail(null);
        setError(isArabic ? "تعذر تحميل تفاصيل الفرصة." : "Unable to load opportunity details.");
      } else setDetail(result);
    } catch {
      setError(isArabic ? "تعذر تحميل تفاصيل الفرصة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to load opportunity details. Check your connection and try again.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [isArabic, locale, opportunityId]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(applicant: PublisherApplicant, status: ApplicantDecision) {
    if (busyId !== null) return;
    setBusyId(applicant.applicationId); setError(null);
    try {
      const result = await updatePublisherApplicantStatus(opportunityId, applicant.applicationId, status);
      if (!result.ok) { setError(isArabic ? "تعذر تحديث حالة الطلب." : "Unable to update application status."); return; }
      await load(true);
      if (status === "accepted" && result.conversationId) router.push(`/conversations/${result.conversationId}`);
    } catch {
      setError(isArabic ? "تعذر تحديث حالة الطلب. حاول مرة أخرى." : "Unable to update application status. Please try again.");
    } finally { setBusyId(null); }
  }

  async function runAction(action: Exclude<PublisherOpportunityAction, "edit">) {
    if (busyAction) return;
    setBusyAction(action); setError(null);
    try {
      const result = await managePublisherOpportunity(opportunityId, { action });
      if (!result.ok) setError(actionError(result.code, locale));
      else await load(true);
    } catch {
      setError(isArabic ? "تعذر تحديث الفرصة. حاول مرة أخرى." : "Unable to update opportunity. Please try again.");
    } finally { setBusyAction(null); }
  }

  function confirmAction(action: "close" | "archive") {
    const archive = action === "archive";
    Alert.alert(
      archive ? (isArabic ? "أرشفة الفرصة؟" : "Archive opportunity?") : (isArabic ? "إغلاق الفرصة؟" : "Close opportunity?"),
      archive ? (isArabic ? "سيتم إخفاء الفرصة وأرشفتها." : "The opportunity will be hidden and archived.") : (isArabic ? "سيتم إيقاف استقبال الطلبات الجديدة." : "New applications will be stopped."),
      [{ text: isArabic ? "إلغاء" : "Cancel", style: "cancel" }, { text: archive ? (isArabic ? "أرشفة" : "Archive") : (isArabic ? "إغلاق" : "Close"), style: "destructive", onPress: () => void runAction(action) }],
    );
  }

  function confirmDecision(applicant: PublisherApplicant, status: "accepted" | "rejected") {
    const accepting = status === "accepted";
    Alert.alert(
      accepting ? (isArabic ? "قبول الموهبة؟" : "Accept talent?") : (isArabic ? "رفض الطلب؟" : "Reject application?"),
      accepting ? (isArabic ? `سيتم قبول ${applicant.name} وفتح المحادثة للتواصل.` : `${applicant.name} will be accepted and a conversation will be opened.`) : (isArabic ? `سيتم رفض طلب ${applicant.name}.` : `${applicant.name}'s application will be rejected.`),
      [{ text: isArabic ? "إلغاء" : "Cancel", style: "cancel" }, { text: accepting ? (isArabic ? "قبول" : "Accept") : (isArabic ? "رفض" : "Reject"), style: accepting ? "default" : "destructive", onPress: () => void changeStatus(applicant, status) }],
    );
  }

  if (loading) return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "جارٍ تحميل تفاصيل الفرصة" : "Loading opportunity details"} />;

  const status = detail?.opportunity.status || (detail?.opportunity.published ? "published" : "draft");
  const archived = status === "archived";
  const editable = EDITABLE_STATUSES.has(status);
  const canSubmit = SUBMITTABLE_STATUSES.has(status);
  const published = detail?.opportunity.published === true || status === "published";
  const applicantCounts = detail ? {
    total: detail.applicants.length,
    shortlisted: detail.applicants.filter((item) => item.status === "shortlisted").length,
    accepted: detail.applicants.filter((item) => item.status === "accepted").length,
  } : { total: 0, shortlisted: 0, accepted: 0 };
  const rowRtl = isRtl ? styles.rowRtl : null;
  const textRtl = isRtl ? styles.textRtl : null;

  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />} showsVerticalScrollIndicator={false}>
      <View style={[styles.topRow, rowRtl]}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={styles.backButton}><BackIcon size={21} color={theme.text} strokeWidth={1.9} /></Pressable><Text style={[styles.topLabel, textRtl]}>{isArabic ? "إدارة الفرصة" : "Manage opportunity"}</Text></View>
      {detail ? <>
        <View style={styles.hero}>
          <Text style={[styles.eyebrow, isArabic && styles.noTracking, textRtl]}>MLAMH FOR BUSINESS</Text>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, textRtl]}>{detail.opportunity.title}</Text>
          <Text style={[styles.heroMeta, textRtl]}>{[detail.opportunity.city, detail.opportunity.countryCode].filter(Boolean).join(" · ")}</Text>
          <View style={[styles.badges, rowRtl]}><Text style={styles.goldBadge}>{opportunityTypeLabel(detail.opportunity.opportunityType, locale)}</Text><Text style={styles.outlineBadge}>{statusLabel(status, locale)}</Text></View>
        </View>

        <View style={[styles.manageCard, compact && styles.cardCompact]}>
          <View style={[styles.manageHeader, rowRtl]}><View style={styles.flexOne}><Text style={[styles.sectionEyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "الحالة" : "STATUS"}</Text><Text style={[styles.sectionTitle, textRtl]}>{statusLabel(status, locale)}</Text></View>{busyAction ? <ActivityIndicator color={theme.accent} /> : null}</View>
          <Text style={[styles.body, textRtl]}>{statusMessage(status, locale)}</Text>
          {!archived ? <View style={[styles.manageActions, rowRtl]}>
            {editable ? <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => router.push(`/publisher/opportunities/${opportunityId}/edit`)}><Edit3 size={16} color={theme.text} /><Text style={styles.secondaryButtonText}>{isArabic ? "تعديل" : "Edit"}</Text></Pressable> : null}
            {canSubmit ? <Pressable disabled={Boolean(busyAction)} style={styles.managePrimary} onPress={() => void runAction("publish")}><Send size={16} color={theme.background} /><Text style={styles.primaryButtonText}>{isArabic ? "إرسال للمراجعة" : "Submit for review"}</Text></Pressable> : null}
            {published || status === "pending_review" ? <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => confirmAction("close")}><XCircle size={16} color={theme.text} /><Text style={styles.secondaryButtonText}>{isArabic ? "إغلاق" : "Close"}</Text></Pressable> : null}
            <Pressable disabled={Boolean(busyAction)} style={styles.manageDanger} onPress={() => confirmAction("archive")}><Archive size={16} color="#E59A9A" /><Text style={styles.dangerText}>{isArabic ? "أرشفة" : "Archive"}</Text></Pressable>
          </View> : null}
        </View>

        <OpportunityFacts detail={detail} locale={locale} isRtl={isRtl} styles={styles} compact={compact} />

        <View style={styles.applicantSection}>
          <View style={[styles.sectionHeaderRow, rowRtl]}><View><Text style={[styles.sectionEyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "الطلبات" : "APPLICATIONS"}</Text><Text style={[styles.sectionTitle, textRtl]}>{isArabic ? "مراجعة المتقدمين" : "Review applicants"}</Text></View><Text style={styles.sectionCount}>{applicantCounts.total}</Text></View>
          <View style={[styles.applicantSummary, compact && styles.applicantSummaryCompact, rowRtl]}><ApplicantMetric value={applicantCounts.total} label={isArabic ? "الإجمالي" : "Total"} styles={styles} /><ApplicantMetric value={applicantCounts.shortlisted} label={isArabic ? "القائمة المختصرة" : "Shortlist"} styles={styles} /><ApplicantMetric value={applicantCounts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} accent /></View>
          <Text style={[styles.applicantGuidance, textRtl]}>{isArabic ? "راجع ملف الموهبة قبل اتخاذ القرار. لا تُفتح المحادثة إلا بعد القبول." : "Review the talent profile before making a decision. Messaging opens only after acceptance."}</Text>
        </View>

        {detail.applicants.length === 0 ? <View style={styles.empty}><Text style={[styles.emptyTitle, textRtl]}>{isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet"}</Text><Text style={[styles.body, textRtl]}>{isArabic ? "ستظهر الطلبات هنا بمجرد تقدم المواهب على الفرصة." : "Applications will appear here as talents apply."}</Text></View> : detail.applicants.map((applicant) => <ApplicantCard key={applicant.applicationId} applicant={applicant} locale={locale} isRtl={isRtl} styles={styles} busy={busyId === applicant.applicationId} disabled={busyId !== null} onChange={changeStatus} onConfirm={confirmDecision} compact={compact} />)}
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.error, textRtl]}>{error}</Text></View> : null}
      </> : <View style={styles.empty}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text><Pressable style={styles.manageSecondary} onPress={() => void load()}><Text style={styles.secondaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View>}
    </ScrollView>
  </SafeAreaView>;
}

function OpportunityFacts({ detail, locale, isRtl, styles, compact }: { detail: PublisherOpportunityDetail; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; compact: boolean }) {
  const ar = locale === "ar";
  const o = detail.opportunity;
  const age = o.minAge == null && o.maxAge == null ? null : o.minAge != null && o.maxAge != null ? `${o.minAge}–${o.maxAge}` : o.minAge != null ? `${o.minAge}+` : `≤ ${o.maxAge}`;
  const roleItems = roleRequirementItems(o.roleRequirements ?? {}, o.opportunityType, locale);
  const compensation = o.compensationType === "unpaid" ? (ar ? "بدون مقابل" : "Unpaid") : o.compensationType === "negotiable" ? (ar ? "حسب الاتفاق" : "Negotiable") : [o.budget, o.currency].filter(Boolean).join(" ") || (ar ? "غير محدد" : "Not specified");
  return <View style={[styles.card, compact && styles.cardCompact]}>
    <Text style={[styles.sectionEyebrow, ar && styles.noTracking, isRtl && styles.textRtl]}>{ar ? "التفاصيل" : "DETAILS"}</Text>
    <Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{ar ? "تفاصيل الـBrief" : "Brief details"}</Text>
    <Text style={[styles.body, isRtl && styles.textRtl]}>{o.description}</Text>
    <View style={[styles.factGrid, isRtl && styles.rowRtl]}>
      <Fact label={ar ? "المقابل" : "Compensation"} value={compensation} styles={styles} isRtl={isRtl} />
      <Fact label={ar ? "الجنس" : "Gender"} value={genderLabel(o.requiredGender, locale)} styles={styles} isRtl={isRtl} />
      {age ? <Fact label={ar ? "العمر" : "Age"} value={age} styles={styles} isRtl={isRtl} /> : null}
      {o.requiredCount ? <Fact label={ar ? "العدد المطلوب" : "Talent count"} value={String(o.requiredCount)} styles={styles} isRtl={isRtl} /> : null}
      {o.workDate ? <Fact label={ar ? "تاريخ العمل" : "Work date"} value={formatDate(o.workDate, locale)} styles={styles} isRtl={isRtl} /> : null}
      {o.workDuration ? <Fact label={ar ? "مدة العمل" : "Duration"} value={durationLabel(o.workDuration, locale)} styles={styles} isRtl={isRtl} /> : null}
      {o.applicationStartDate ? <Fact label={ar ? "بداية التقديم" : "Application start"} value={formatDate(o.applicationStartDate, locale)} styles={styles} isRtl={isRtl} /> : null}
      {o.applicationDeadline ? <Fact label={ar ? "آخر موعد" : "Deadline"} value={formatDate(o.applicationDeadline, locale)} styles={styles} isRtl={isRtl} /> : null}
    </View>
    {roleItems.length ? <View style={styles.requirements}>{roleItems.map((item) => <View key={item.label} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text style={[styles.requirementLabel, isRtl && styles.textRtl]}>{item.label}</Text><Text style={[styles.requirementValue, isRtl && styles.textRtl]}>{item.value}</Text></View>)}</View> : null}
  </View>;
}

function Fact({ label, value, styles, isRtl }: { label: string; value: string; styles: ReturnType<typeof createStyles>; isRtl: boolean }) { return <View style={styles.fact}><Text style={[styles.factLabel, isRtl && styles.textRtl]}>{label}</Text><Text style={[styles.factValue, isRtl && styles.textRtl]}>{value}</Text></View>; }
function ApplicantMetric({ value, label, styles, accent = false }: { value: number; label: string; styles: ReturnType<typeof createStyles>; accent?: boolean }) { return <View style={styles.applicantMetric}><Text style={[styles.applicantMetricValue, accent && styles.applicantMetricValueAccent]}>{value}</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.applicantMetricLabel}>{label}</Text></View>; }
function ApplicantCard({ applicant, locale, isRtl, styles, busy, disabled, onChange, onConfirm, compact }: { applicant: PublisherApplicant; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; busy: boolean; disabled: boolean; onChange: (applicant: PublisherApplicant, status: ApplicantDecision) => Promise<void>; onConfirm: (applicant: PublisherApplicant, status: "accepted" | "rejected") => void; compact: boolean }) {
  const isArabic = locale === "ar";
  const accepted = applicant.status === "accepted";
  const rejected = applicant.status === "rejected";
  const shortlisted = applicant.status === "shortlisted";
  const appliedAt = applicant.createdAt ? formatDate(applicant.createdAt, locale) : null;
  return <View accessibilityLabel={`${applicant.name}, ${statusLabel(applicant.status, locale)}`} style={[styles.applicantCard, compact && styles.cardCompact, accepted && styles.applicantCardAccepted]}>
    <View style={[styles.applicantTop, isRtl && styles.rowRtl]}>{applicant.imageUrl ? <Image source={{ uri: applicant.imageUrl }} style={[styles.avatar, compact && styles.avatarCompact]} /> : <View style={[styles.avatarFallback, compact && styles.avatarCompact]}><Text style={styles.avatarInitial}>{applicant.name.slice(0, 1)}</Text></View>}<View style={styles.applicantInfo}><Text numberOfLines={1} style={[styles.applicantName, isRtl && styles.textRtl]}>{applicant.name}</Text><Text style={[styles.meta, isRtl && styles.textRtl]}>{[applicant.category, applicant.city].filter(Boolean).join(" · ")}</Text>{appliedAt ? <Text style={[styles.appliedAt, isRtl && styles.textRtl]}>{isArabic ? `تقدم ${appliedAt}` : `Applied ${appliedAt}`}</Text> : null}</View><View style={[styles.statusPill, accepted && styles.statusPillAccepted, shortlisted && styles.statusPillShortlisted, rejected && styles.statusPillRejected]}><Text style={[styles.statusText, accepted && styles.statusTextAccepted, rejected && styles.statusTextRejected]}>{statusLabel(applicant.status, locale)}</Text></View></View>
    <View style={[styles.profileActions, isRtl && styles.rowRtl]}>{applicant.talentSlug ? <Pressable accessibilityRole="button" style={styles.profileButton} onPress={() => router.push(`/talents/${encodeURIComponent(applicant.talentSlug!)}`)}><Text style={styles.profileButtonText}>{isArabic ? "عرض ملف الموهبة" : "View talent profile"}</Text></Pressable> : null}{accepted && applicant.conversationId ? <Pressable style={styles.primaryButtonInline} onPress={() => router.push(`/conversations/${applicant.conversationId}`)}><MessageCircle size={15} color={darkTheme.background} /><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open chat"}</Text></Pressable> : null}</View>
    {!accepted && !rejected ? <View style={[styles.actions, compact && styles.actionsCompact, isRtl && styles.rowRtl]}>{!shortlisted ? <Pressable disabled={disabled} style={[styles.secondaryButton, disabled && styles.disabled]} onPress={() => void onChange(applicant, "shortlisted")}><Text style={styles.secondaryButtonText}>{isArabic ? "قائمة مختصرة" : "Shortlist"}</Text></Pressable> : null}<Pressable disabled={disabled} style={[styles.rejectButton, disabled && styles.disabled]} onPress={() => onConfirm(applicant, "rejected")}><Text style={styles.dangerText}>{isArabic ? "رفض" : "Reject"}</Text></Pressable><Pressable disabled={disabled} style={[styles.primaryButtonSmall, disabled && styles.disabled]} onPress={() => onConfirm(applicant, "accepted")}><Text style={styles.primaryButtonText}>{busy ? "…" : (isArabic ? "قبول" : "Accept")}</Text></Pressable></View> : null}
  </View>;
}

function roleRequirementItems(value: Record<string, unknown>, type: string, locale: "ar" | "en") {
  const ar = locale === "ar"; const items: Array<{ label: string; value: string }> = [];
  if (type === "actor") {
    const languages = Array.isArray(value.languages) ? value.languages.filter((x): x is string => typeof x === "string") : [];
    const dialects = Array.isArray(value.dialects) ? value.dialects.filter((x): x is string => typeof x === "string") : [];
    if (languages.length) items.push({ label: ar ? "اللغات" : "Languages", value: languages.join(ar ? "، " : ", ") });
    if (dialects.length) items.push({ label: ar ? "اللهجات" : "Dialects", value: dialects.join(ar ? "، " : ", ") });
  } else if (type === "model") {
    const modelingRaw = Array.isArray(value.modeling_types) ? value.modeling_types : Array.isArray(value.modelingTypes) ? value.modelingTypes : [];
    const modeling = modelingRaw.filter((x): x is string => typeof x === "string");
    if (modeling.length) items.push({ label: ar ? "أنواع المودل" : "Modeling types", value: modeling.join(ar ? "، " : ", ") });
    const minHeight = value.min_height_cm ?? value.minHeightCm;
    const hair = value.hair_color ?? value.hairColor;
    if (minHeight != null) items.push({ label: ar ? "الحد الأدنى للطول" : "Minimum height", value: `${minHeight} ${ar ? "سم" : "cm"}` });
    if (typeof hair === "string" && hair) items.push({ label: ar ? "لون الشعر" : "Hair color", value: hair });
  }
  return items;
}
function opportunityTypeLabel(value: string, locale: "ar" | "en") { return value === "actor" ? (locale === "ar" ? "ممثل" : "Actor") : value === "model" ? (locale === "ar" ? "مودل" : "Model") : value.replaceAll("_", " "); }
function genderLabel(value: string | null | undefined, locale: "ar" | "en") { if (value === "male") return locale === "ar" ? "ذكر" : "Male"; if (value === "female") return locale === "ar" ? "أنثى" : "Female"; return locale === "ar" ? "الجميع" : "Any"; }
function durationLabel(value: string, locale: "ar" | "en") { const map: Record<string, { ar: string; en: string }> = { "1_hour": { ar: "ساعة", en: "1 hour" }, "2_hours": { ar: "ساعتان", en: "2 hours" }, "4_hours": { ar: "4 ساعات", en: "4 hours" }, full_day: { ar: "يوم كامل", en: "Full day" } }; return map[value]?.[locale] ?? value.replaceAll("_", " "); }
function formatDate(value: string, locale: "ar" | "en") { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", { year: "numeric", month: "short", day: "numeric" }); }
function actionError(code: string, locale: "ar" | "en") { const ar: Record<string,string> = { INCOMPLETE_OPPORTUNITY: "أكمل عنوان ووصف الفرصة قبل إرسالها للمراجعة.", MISSING_COUNTRY: "حدد دولة الفرصة قبل إرسالها للمراجعة.", ARCHIVED: "لا يمكن تعديل أو إرسال فرصة مؤرشفة.", FORBIDDEN: "لا تملك صلاحية إدارة هذه الفرصة.", PUBLISHER_NOT_VERIFIED: "يجب توثيق الجهة قبل إرسال الفرصة للمراجعة.", ALREADY_PENDING_REVIEW: "الفرصة قيد المراجعة بالفعل.", ALREADY_PUBLISHED: "الفرصة منشورة بالفعل.", REJECTED: "الفرصة المرفوضة لا يمكن إعادة إرسالها من التطبيق.", EDIT_LOCKED: "لا يمكن تعديل الفرصة في حالتها الحالية." }; const en: Record<string,string> = { INCOMPLETE_OPPORTUNITY: "Complete the title and description before submitting for review.", MISSING_COUNTRY: "Set the opportunity country before submitting for review.", ARCHIVED: "Archived opportunities cannot be edited or submitted.", FORBIDDEN: "You do not have permission to manage this opportunity.", PUBLISHER_NOT_VERIFIED: "Your organization must be verified before submitting this opportunity.", ALREADY_PENDING_REVIEW: "This opportunity is already under review.", ALREADY_PUBLISHED: "This opportunity is already published.", REJECTED: "Rejected opportunities cannot be resubmitted from the app.", EDIT_LOCKED: "This opportunity cannot be edited in its current state." }; return (locale === "ar" ? ar : en)[code] ?? (locale === "ar" ? "تعذر تحديث الفرصة." : "Unable to update opportunity."); }
function statusMessage(status: string, locale: "ar" | "en") { const ar: Record<string,string> = { draft: "المسودة خاصة بك. عدّلها ثم أرسلها للمراجعة.", open: "المسودة خاصة بك. عدّلها ثم أرسلها للمراجعة.", pending_review: "تم إرسال الفرصة للمراجعة ولن تظهر للمواهب حتى اعتمادها.", needs_changes: "طلبت الإدارة تعديلات. حدّث الفرصة ثم أرسلها للمراجعة مجددًا.", published: "الفرصة منشورة وتستقبل الطلبات.", closed: "الفرصة مغلقة ويمكن تعديلها وإرسالها للمراجعة مجددًا.", rejected: "تم رفض هذه الفرصة.", archived: "هذه الفرصة مؤرشفة." }; const en: Record<string,string> = { draft: "This draft is private. Edit it, then submit it for review.", open: "This draft is private. Edit it, then submit it for review.", pending_review: "This opportunity is under review and will not be visible to talent until approved.", needs_changes: "Changes were requested. Update the opportunity, then submit it again.", published: "This opportunity is published and accepting applications.", closed: "This opportunity is closed. You can edit and submit it for review again.", rejected: "This opportunity was rejected.", archived: "This opportunity is archived." }; return (locale === "ar" ? ar : en)[status] ?? ""; }
function statusLabel(status: string, locale: "ar" | "en") { const ar: Record<string,string> = { draft: "مسودة", open: "مسودة", pending_review: "قيد المراجعة", needs_changes: "تحتاج تعديل", published: "منشورة", closed: "مغلقة", archived: "مؤرشفة", submitted: "جديد", pending: "قيد المراجعة", shortlisted: "مختصر", accepted: "مقبول", rejected: "مرفوض" }; const en: Record<string,string> = { draft: "Draft", open: "Draft", pending_review: "In review", needs_changes: "Needs changes", published: "Published", closed: "Closed", archived: "Archived", submitted: "New", pending: "Review", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Rejected" }; return (locale === "ar" ? ar : en)[status] ?? status; }

function createStyles(theme: typeof darkTheme) { return StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 34, gap: 15 },
  contentCompact: { paddingHorizontal: 14, gap: 12 },
  rowRtl: { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right", writingDirection: "rtl" },
  noTracking: { letterSpacing: 0 },
  flexOne: { flex: 1 },
  topRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
  topLabel: { color: theme.muted, fontSize: 11, fontWeight: "700" },
  hero: { paddingVertical: 4, gap: 7 },
  eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 30, lineHeight: 37, fontWeight: "800" },
  titleCompact: { fontSize: 25, lineHeight: 31 },
  heroMeta: { color: theme.muted, fontSize: 11 },
  meta: { color: theme.muted, fontSize: 10, lineHeight: 16 },
  badges: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  goldBadge: { color: theme.background, backgroundColor: theme.accent, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: "900" },
  outlineBadge: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9 },
  manageCard: { gap: 12, padding: 16, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 20, backgroundColor: theme.surface },
  cardCompact: { padding: 13 },
  manageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  manageActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  sectionTitle: { color: theme.text, fontSize: 19, fontWeight: "800", marginTop: 2 },
  body: { color: theme.muted, fontSize: 12, lineHeight: 19 },
  managePrimary: { minWidth: 140, minHeight: 46, flexGrow: 1, flexDirection: "row", gap: 7, backgroundColor: theme.accent, borderRadius: 13, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  manageSecondary: { minWidth: 90, minHeight: 46, flexGrow: 1, flexDirection: "row", gap: 7, borderWidth: 1, borderColor: theme.border, borderRadius: 13, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  manageDanger: { minWidth: 90, minHeight: 46, flexDirection: "row", gap: 7, borderWidth: 1, borderColor: "#C84F4F55", borderRadius: 13, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  card: { gap: 11, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface },
  factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fact: { minWidth: "46%", flexGrow: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.background, padding: 10, gap: 4 },
  factLabel: { color: theme.muted, fontSize: 9, fontWeight: "700" },
  factValue: { color: theme.text, fontSize: 11, fontWeight: "800" },
  requirements: { gap: 8, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 11 },
  requirementRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  requirementLabel: { color: theme.muted, fontSize: 10 },
  requirementValue: { color: theme.text, fontSize: 11, fontWeight: "700", flex: 1 },
  applicantSection: { gap: 11, marginTop: 3 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionCount: { color: theme.accent, fontSize: 27, fontWeight: "700" },
  applicantSummary: { flexDirection: "row", gap: 8 },
  applicantSummaryCompact: { gap: 6 },
  applicantMetric: { flex: 1, minHeight: 74, borderWidth: 1, borderColor: theme.border, borderRadius: 16, backgroundColor: theme.surface, padding: 10, justifyContent: "space-between" },
  applicantMetricValue: { color: theme.text, fontSize: 22, fontWeight: "700" },
  applicantMetricValueAccent: { color: "#49C991" },
  applicantMetricLabel: { color: theme.muted, fontSize: 8, fontWeight: "700" },
  applicantGuidance: { color: theme.muted, fontSize: 10, lineHeight: 17 },
  applicantCard: { gap: 13, padding: 14, borderWidth: 1, borderColor: theme.border, borderRadius: 19, backgroundColor: theme.surface },
  applicantCardAccepted: { borderColor: "#16A36A55" },
  applicantTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 54, height: 54, borderRadius: 17, backgroundColor: theme.surfaceElevated },
  avatarFallback: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border },
  avatarCompact: { width: 48, height: 48, borderRadius: 15 },
  avatarInitial: { color: theme.accent, fontSize: 19, fontWeight: "800" },
  applicantInfo: { flex: 1, gap: 2 },
  applicantName: { color: theme.text, fontSize: 15, fontWeight: "800" },
  appliedAt: { color: theme.grayMuted, fontSize: 9, marginTop: 2 },
  statusPill: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusPillAccepted: { borderColor: "#16A36A55", backgroundColor: "#16A36A10" },
  statusPillShortlisted: { borderColor: "#C9A96255", backgroundColor: theme.chip },
  statusPillRejected: { borderColor: "#C84F4F44", backgroundColor: "#C84F4F0D" },
  statusText: { color: theme.accent, fontSize: 8, fontWeight: "900" },
  statusTextAccepted: { color: "#49C991" },
  statusTextRejected: { color: "#E59A9A" },
  profileActions: { flexDirection: "row", gap: 8 },
  profileButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: "#C9A96244", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  profileButtonText: { color: theme.accent, fontSize: 10, fontWeight: "800" },
  primaryButtonInline: { flex: 1, minHeight: 42, flexDirection: "row", gap: 7, backgroundColor: theme.accent, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  actions: { flexDirection: "row", gap: 8 },
  actionsCompact: { flexWrap: "wrap" },
  primaryButtonSmall: { flex: 1, minWidth: 76, backgroundColor: theme.accent, borderRadius: 12, minHeight: 42, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: theme.background, fontSize: 10, fontWeight: "900" },
  secondaryButton: { flex: 1.2, minWidth: 92, minHeight: 42, borderWidth: 1, borderColor: theme.border, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  secondaryButtonText: { color: theme.text, fontSize: 10, fontWeight: "700" },
  rejectButton: { flex: 1, minWidth: 70, minHeight: 42, borderWidth: 1, borderColor: "#C84F4F55", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dangerText: { color: "#E59A9A", fontSize: 10, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  empty: { minHeight: 148, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: theme.border, borderRadius: 19, padding: 18 },
  emptyTitle: { color: theme.text, fontSize: 15, fontWeight: "800" },
  errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 13, padding: 12 },
  error: { color: "#E59A9A", fontSize: 12, lineHeight: 18 },
}); }
