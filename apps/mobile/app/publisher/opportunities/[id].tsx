import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

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
  const theme = darkTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
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

  return <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, { direction: isRtl ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} colors={[theme.accent]} />} showsVerticalScrollIndicator={false}>
    <View style={[styles.topRow, isRtl && styles.rowRtl]}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} hitSlop={12}><Text style={styles.backIcon}>{isRtl ? "›" : "‹"}</Text></Pressable><Text style={styles.topLabel}>{isArabic ? "إدارة الفرصة" : "Manage opportunity"}</Text></View>
    {detail ? <>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{isArabic ? "MLAMH FOR BUSINESS" : "MLAMH FOR BUSINESS"}</Text>
        <Text accessibilityRole="header" style={[styles.title, { textAlign: isRtl ? "right" : "left" }]}>{detail.opportunity.title}</Text>
        <Text style={[styles.heroMeta, { textAlign: isRtl ? "right" : "left" }]}>{[detail.opportunity.city, detail.opportunity.countryCode].filter(Boolean).join(" · ")}</Text>
        <View style={[styles.badges, isRtl && styles.rowRtl]}><Text style={styles.goldBadge}>{opportunityTypeLabel(detail.opportunity.opportunityType, locale)}</Text><Text style={styles.outlineBadge}>{statusLabel(status, locale)}</Text></View>
      </View>

      <View style={styles.manageCard}>
        <View style={[styles.manageHeader, isRtl && styles.rowRtl]}><View><Text style={styles.sectionEyebrow}>{isArabic ? "الحالة" : "STATUS"}</Text><Text style={styles.sectionTitle}>{statusLabel(status, locale)}</Text></View>{busyAction ? <ActivityIndicator color={theme.accent} /> : null}</View>
        <Text style={[styles.body, { textAlign: isRtl ? "right" : "left" }]}>{statusMessage(status, locale)}</Text>
        {!archived ? <View style={[styles.manageActions, isRtl && styles.rowRtl]}>
          {editable ? <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => router.push(`/publisher/opportunities/${opportunityId}/edit`)}><Text style={styles.secondaryButtonText}>{isArabic ? "تعديل" : "Edit"}</Text></Pressable> : null}
          {canSubmit ? <Pressable disabled={Boolean(busyAction)} style={styles.managePrimary} onPress={() => void runAction("publish")}><Text style={styles.primaryButtonText}>{isArabic ? "إرسال للمراجعة" : "Submit for review"}</Text></Pressable> : null}
          {published || status === "pending_review" ? <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => confirmAction("close")}><Text style={styles.secondaryButtonText}>{isArabic ? "إغلاق" : "Close"}</Text></Pressable> : null}
          <Pressable disabled={Boolean(busyAction)} style={styles.manageDanger} onPress={() => confirmAction("archive")}><Text style={styles.dangerText}>{isArabic ? "أرشفة" : "Archive"}</Text></Pressable>
        </View> : null}
      </View>

      <OpportunityFacts detail={detail} locale={locale} styles={styles} />

      <View style={styles.applicantSection}>
        <View style={[styles.sectionHeaderRow, isRtl && styles.rowRtl]}><View><Text style={styles.sectionEyebrow}>{isArabic ? "الطلبات" : "APPLICATIONS"}</Text><Text style={styles.sectionTitle}>{isArabic ? "مراجعة المتقدمين" : "Review applicants"}</Text></View><Text style={styles.sectionCount}>{applicantCounts.total}</Text></View>
        <View style={[styles.applicantSummary, isRtl && styles.rowRtl]}><ApplicantMetric value={applicantCounts.total} label={isArabic ? "الإجمالي" : "Total"} styles={styles} /><ApplicantMetric value={applicantCounts.shortlisted} label={isArabic ? "القائمة المختصرة" : "Shortlist"} styles={styles} /><ApplicantMetric value={applicantCounts.accepted} label={isArabic ? "مقبول" : "Accepted"} styles={styles} accent /></View>
        <Text style={[styles.applicantGuidance, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? "راجع ملف الموهبة قبل اتخاذ القرار. لا تُفتح المحادثة إلا بعد القبول." : "Review the talent profile before making a decision. Messaging opens only after acceptance."}</Text>
      </View>

      {detail.applicants.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>{isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet"}</Text><Text style={styles.body}>{isArabic ? "ستظهر الطلبات هنا بمجرد تقدم المواهب على الفرصة." : "Applications will appear here as talents apply."}</Text></View> : detail.applicants.map((applicant) => <ApplicantCard key={applicant.applicationId} applicant={applicant} locale={locale} isRtl={isRtl} styles={styles} busy={busyId === applicant.applicationId} disabled={busyId !== null} onChange={changeStatus} onConfirm={confirmDecision} />)}
      {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </> : <View style={styles.empty}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable style={styles.manageSecondary} onPress={() => void load()}><Text style={styles.secondaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable></View>}
  </ScrollView>;
}

function OpportunityFacts({ detail, locale, styles }: { detail: PublisherOpportunityDetail; locale: "ar" | "en"; styles: ReturnType<typeof createStyles> }) {
  const ar = locale === "ar";
  const o = detail.opportunity;
  const age = o.minAge == null && o.maxAge == null ? null : o.minAge != null && o.maxAge != null ? `${o.minAge}–${o.maxAge}` : o.minAge != null ? `${o.minAge}+` : `≤ ${o.maxAge}`;
  const roleItems = roleRequirementItems(o.roleRequirements ?? {}, o.opportunityType, locale);
  const compensation = o.compensationType === "unpaid" ? (ar ? "بدون مقابل" : "Unpaid") : o.compensationType === "negotiable" ? (ar ? "حسب الاتفاق" : "Negotiable") : [o.budget, o.currency].filter(Boolean).join(" ") || (ar ? "غير محدد" : "Not specified");
  return <View style={styles.card}>
    <Text style={styles.sectionEyebrow}>{ar ? "التفاصيل" : "DETAILS"}</Text>
    <Text style={styles.sectionTitle}>{ar ? "تفاصيل الـBrief" : "Brief details"}</Text>
    <Text style={[styles.body, { textAlign: ar ? "right" : "left" }]}>{o.description}</Text>
    <View style={styles.factGrid}>
      <Fact label={ar ? "المقابل" : "Compensation"} value={compensation} styles={styles} />
      <Fact label={ar ? "الجنس" : "Gender"} value={genderLabel(o.requiredGender, locale)} styles={styles} />
      {age ? <Fact label={ar ? "العمر" : "Age"} value={age} styles={styles} /> : null}
      {o.requiredCount ? <Fact label={ar ? "العدد المطلوب" : "Talent count"} value={String(o.requiredCount)} styles={styles} /> : null}
      {o.workDate ? <Fact label={ar ? "تاريخ العمل" : "Work date"} value={formatDate(o.workDate, locale)} styles={styles} /> : null}
      {o.workDuration ? <Fact label={ar ? "مدة العمل" : "Duration"} value={durationLabel(o.workDuration, locale)} styles={styles} /> : null}
      {o.applicationStartDate ? <Fact label={ar ? "بداية التقديم" : "Application start"} value={formatDate(o.applicationStartDate, locale)} styles={styles} /> : null}
      {o.applicationDeadline ? <Fact label={ar ? "آخر موعد" : "Deadline"} value={formatDate(o.applicationDeadline, locale)} styles={styles} /> : null}
    </View>
    {roleItems.length ? <View style={styles.requirements}>{roleItems.map((item) => <View key={item.label} style={styles.requirementRow}><Text style={styles.requirementLabel}>{item.label}</Text><Text style={styles.requirementValue}>{item.value}</Text></View>)}</View> : null}
  </View>;
}

function Fact({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) { return <View style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text></View>; }
function ApplicantMetric({ value, label, styles, accent = false }: { value: number; label: string; styles: ReturnType<typeof createStyles>; accent?: boolean }) { return <View style={styles.applicantMetric}><Text style={[styles.applicantMetricValue, accent && styles.applicantMetricValueAccent]}>{value}</Text><Text numberOfLines={1} style={styles.applicantMetricLabel}>{label}</Text></View>; }
function ApplicantCard({ applicant, locale, isRtl, styles, busy, disabled, onChange, onConfirm }: { applicant: PublisherApplicant; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; busy: boolean; disabled: boolean; onChange: (applicant: PublisherApplicant, status: ApplicantDecision) => Promise<void>; onConfirm: (applicant: PublisherApplicant, status: "accepted" | "rejected") => void }) {
  const isArabic = locale === "ar";
  const accepted = applicant.status === "accepted";
  const rejected = applicant.status === "rejected";
  const shortlisted = applicant.status === "shortlisted";
  const appliedAt = applicant.createdAt ? formatDate(applicant.createdAt, locale) : null;
  return <View accessibilityLabel={`${applicant.name}, ${statusLabel(applicant.status, locale)}`} style={[styles.applicantCard, accepted && styles.applicantCardAccepted]}>
    <View style={[styles.applicantTop, isRtl && styles.rowRtl]}>{applicant.imageUrl ? <Image source={{ uri: applicant.imageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{applicant.name.slice(0, 1)}</Text></View>}<View style={styles.applicantInfo}><Text numberOfLines={1} style={[styles.applicantName, { textAlign: isRtl ? "right" : "left" }]}>{applicant.name}</Text><Text style={[styles.meta, { textAlign: isRtl ? "right" : "left" }]}>{[applicant.category, applicant.city].filter(Boolean).join(" · ")}</Text>{appliedAt ? <Text style={[styles.appliedAt, { textAlign: isRtl ? "right" : "left" }]}>{isArabic ? `تقدم ${appliedAt}` : `Applied ${appliedAt}`}</Text> : null}</View><View style={[styles.statusPill, accepted && styles.statusPillAccepted, shortlisted && styles.statusPillShortlisted, rejected && styles.statusPillRejected]}><Text style={[styles.statusText, accepted && styles.statusTextAccepted, rejected && styles.statusTextRejected]}>{statusLabel(applicant.status, locale)}</Text></View></View>
    <View style={[styles.profileActions, isRtl && styles.rowRtl]}>{applicant.talentSlug ? <Pressable accessibilityRole="button" style={styles.profileButton} onPress={() => router.push(`/talents/${encodeURIComponent(applicant.talentSlug!)}`)}><Text style={styles.profileButtonText}>{isArabic ? "عرض ملف الموهبة" : "View talent profile"}</Text></Pressable> : null}{accepted && applicant.conversationId ? <Pressable style={styles.primaryButtonInline} onPress={() => router.push(`/conversations/${applicant.conversationId}`)}><Text style={styles.primaryButtonText}>{isArabic ? "فتح المحادثة" : "Open chat"}</Text></Pressable> : null}</View>
    {!accepted && !rejected ? <View style={[styles.actions, isRtl && styles.rowRtl]}>{!shortlisted ? <Pressable disabled={disabled} style={[styles.secondaryButton, disabled && styles.disabled]} onPress={() => void onChange(applicant, "shortlisted")}><Text style={styles.secondaryButtonText}>{isArabic ? "قائمة مختصرة" : "Shortlist"}</Text></Pressable> : null}<Pressable disabled={disabled} style={[styles.rejectButton, disabled && styles.disabled]} onPress={() => onConfirm(applicant, "rejected")}><Text style={styles.dangerText}>{isArabic ? "رفض" : "Reject"}</Text></Pressable><Pressable disabled={disabled} style={[styles.primaryButtonSmall, disabled && styles.disabled]} onPress={() => onConfirm(applicant, "accepted")}><Text style={styles.primaryButtonText}>{busy ? "…" : (isArabic ? "قبول" : "Accept")}</Text></Pressable></View> : null}
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
    const modeling = Array.isArray(value.modeling_types) ? value.modeling_types.filter((x): x is string => typeof x === "string") : [];
    if (modeling.length) items.push({ label: ar ? "أنواع المودل" : "Modeling types", value: modeling.join(ar ? "، " : ", ") });
    if (value.min_height_cm != null) items.push({ label: ar ? "الحد الأدنى للطول" : "Minimum height", value: `${value.min_height_cm} ${ar ? "سم" : "cm"}` });
    if (typeof value.hair_color === "string" && value.hair_color) items.push({ label: ar ? "لون الشعر" : "Hair color", value: value.hair_color });
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
  screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 52, paddingBottom: 76, gap: 16 }, rowRtl: { flexDirection: "row-reverse" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, backIcon: { color: theme.text, fontSize: 30, lineHeight: 34 }, topLabel: { color: theme.muted, fontSize: 11, fontWeight: "700" },
  hero: { paddingVertical: 9, gap: 8 }, eyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 }, title: { color: theme.text, fontSize: 32, lineHeight: 40, fontWeight: "700" }, heroMeta: { color: theme.muted, fontSize: 12 }, meta: { color: theme.muted, fontSize: 11, lineHeight: 18 }, badges: { flexDirection: "row", gap: 7, flexWrap: "wrap" }, goldBadge: { color: theme.background, backgroundColor: theme.accent, borderRadius: 999, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 6, fontSize: 9, fontWeight: "900" }, outlineBadge: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, fontSize: 9 },
  manageCard: { gap: 13, padding: 17, borderWidth: 1, borderColor: "#C9A96233", borderRadius: 22, backgroundColor: theme.surface }, manageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, manageActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, sectionEyebrow: { color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "800", marginTop: 2 }, body: { color: theme.muted, fontSize: 13, lineHeight: 21 },
  managePrimary: { minWidth: 140, minHeight: 46, flexGrow: 1, backgroundColor: theme.accent, borderRadius: 13, paddingVertical: 11, alignItems: "center", justifyContent: "center" }, manageSecondary: { minWidth: 90, minHeight: 46, flexGrow: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, alignItems: "center", justifyContent: "center" }, manageDanger: { minWidth: 90, minHeight: 46, borderWidth: 1, borderColor: "#C84F4F55", borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  card: { gap: 12, padding: 17, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, fact: { minWidth: "46%", flexGrow: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 14, backgroundColor: theme.background, padding: 11, gap: 4 }, factLabel: { color: theme.muted, fontSize: 9, fontWeight: "700" }, factValue: { color: theme.text, fontSize: 12, fontWeight: "800" }, requirements: { gap: 8, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }, requirementRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, requirementLabel: { color: theme.muted, fontSize: 10 }, requirementValue: { color: theme.text, fontSize: 11, fontWeight: "700", flex: 1, textAlign: "right" },
  applicantSection: { gap: 12, marginTop: 4 }, sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sectionCount: { color: theme.accent, fontSize: 28, fontWeight: "700" }, applicantSummary: { flexDirection: "row", gap: 8 }, applicantMetric: { flex: 1, minHeight: 78, borderWidth: 1, borderColor: theme.border, borderRadius: 17, backgroundColor: theme.surface, padding: 11, justifyContent: "space-between" }, applicantMetricValue: { color: theme.text, fontSize: 23, fontWeight: "700" }, applicantMetricValueAccent: { color: "#49C991" }, applicantMetricLabel: { color: theme.muted, fontSize: 8, fontWeight: "700" }, applicantGuidance: { color: theme.muted, fontSize: 11, lineHeight: 18 },
  applicantCard: { gap: 14, padding: 15, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface }, applicantCardAccepted: { borderColor: "#16A36A55" }, applicantTop: { flexDirection: "row", alignItems: "center", gap: 11 }, avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.surfaceElevated }, avatarFallback: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: theme.surfaceElevated, borderWidth: 1, borderColor: theme.border }, avatarInitial: { color: theme.accent, fontSize: 20, fontWeight: "800" }, applicantInfo: { flex: 1, gap: 2 }, applicantName: { color: theme.text, fontSize: 16, fontWeight: "800" }, appliedAt: { color: theme.grayMuted, fontSize: 9, marginTop: 2 }, statusPill: { borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, statusPillAccepted: { borderColor: "#16A36A55", backgroundColor: "#16A36A10" }, statusPillShortlisted: { borderColor: "#C9A96255", backgroundColor: theme.chip }, statusPillRejected: { borderColor: "#C84F4F44", backgroundColor: "#C84F4F0D" }, statusText: { color: theme.accent, fontSize: 8, fontWeight: "900" }, statusTextAccepted: { color: "#49C991" }, statusTextRejected: { color: "#E59A9A" }, profileActions: { flexDirection: "row", gap: 8 }, profileButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: "#C9A96244", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 }, profileButtonText: { color: theme.accent, fontSize: 10, fontWeight: "800" }, primaryButtonInline: { flex: 1, minHeight: 42, backgroundColor: theme.accent, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  actions: { flexDirection: "row", gap: 8 }, primaryButtonSmall: { flex: 1, backgroundColor: theme.accent, borderRadius: 12, minHeight: 42, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, primaryButtonText: { color: theme.background, fontSize: 11, fontWeight: "900" }, secondaryButton: { flex: 1.2, minHeight: 42, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontSize: 11, fontWeight: "700" }, rejectButton: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: "#C84F4F55", borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center" }, dangerText: { color: "#E59A9A", fontSize: 11, fontWeight: "800" }, disabled: { opacity: 0.45 },
  empty: { minHeight: 150, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: theme.border, borderRadius: 20, padding: 20 }, emptyTitle: { color: theme.text, fontSize: 16, fontWeight: "800" }, error: { color: "#E59A9A", fontSize: 13, lineHeight: 19 },
}); }
