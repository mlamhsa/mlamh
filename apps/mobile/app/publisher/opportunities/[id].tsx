import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MessageCircle,
  Send,
  XCircle,
} from "lucide-react-native";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { displayValue, displayValues } from "@/lib/display-values";
import {
  formatGregorianDate,
  formatLatinNumber,
  isRtlLocale,
  toLatinDigits,
} from "@/lib/i18n";
import { useAppLocale } from "@/lib/locale-context";
import { leaveAuthenticatedScreen } from "@/lib/navigation";
import {
  getPublisherOpportunity,
  managePublisherOpportunity,
  updatePublisherApplicantStatus,
  type PublisherApplicant,
  type PublisherOpportunityAction,
  type PublisherOpportunityDetail,
} from "@/lib/publisher-api";
import { darkTheme } from "@/lib/theme";

const EDITABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
const SUBMITTABLE_STATUSES = new Set(["draft", "open", "needs_changes", "closed"]);
type ApplicantDecision = "accepted" | "rejected" | "shortlisted";

export default function PublisherOpportunityDetailScreen() {
  const { locale } = useAppLocale();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const opportunityId = Number(rawId);
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const styles = useMemo(() => createStyles(), []);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyApplicant, setBusyApplicant] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<PublisherOpportunityAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      setError(isArabic ? "الفرصة غير صالحة." : "Invalid opportunity.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const result = await getPublisherOpportunity(opportunityId, locale);
      if (!result) {
        setDetail(null);
        setError(isArabic ? "تعذر تحميل تفاصيل الفرصة." : "Unable to load opportunity details.");
      } else {
        setDetail(result);
      }
    } catch {
      setError(
        isArabic
          ? "تعذر تحميل تفاصيل الفرصة. تحقق من الاتصال وحاول مرة أخرى."
          : "Unable to load opportunity details. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isArabic, locale, opportunityId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeApplicantStatus(applicant: PublisherApplicant, status: ApplicantDecision) {
    if (busyApplicant !== null) return;
    setBusyApplicant(applicant.applicationId);
    setError(null);
    try {
      const result = await updatePublisherApplicantStatus(opportunityId, applicant.applicationId, status);
      if (!result.ok) {
        setError(isArabic ? "تعذر تحديث حالة الطلب." : "Unable to update application status.");
        return;
      }
      await load(true);
      if (status === "accepted" && result.conversationId) {
        router.push(`/conversations/${result.conversationId}`);
      }
    } catch {
      setError(isArabic ? "تعذر تحديث حالة الطلب. حاول مرة أخرى." : "Unable to update application status. Please try again.");
    } finally {
      setBusyApplicant(null);
    }
  }

  async function runOpportunityAction(action: Exclude<PublisherOpportunityAction, "edit">) {
    if (busyAction) return;
    setBusyAction(action);
    setError(null);
    try {
      const result = await managePublisherOpportunity(opportunityId, { action });
      if (!result.ok) setError(actionError(result.code, locale));
      else await load(true);
    } catch {
      setError(isArabic ? "تعذر تحديث الفرصة. حاول مرة أخرى." : "Unable to update opportunity. Please try again.");
    } finally {
      setBusyAction(null);
    }
  }

  function confirmOpportunityAction(action: "close" | "archive") {
    const archive = action === "archive";
    Alert.alert(
      archive ? (isArabic ? "أرشفة الفرصة؟" : "Archive opportunity?") : (isArabic ? "إغلاق الفرصة؟" : "Close opportunity?"),
      archive
        ? (isArabic ? "سيتم إخفاء الفرصة وأرشفتها." : "The opportunity will be hidden and archived.")
        : (isArabic ? "سيتم إيقاف استقبال الطلبات الجديدة." : "New applications will be stopped."),
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: archive ? (isArabic ? "أرشفة" : "Archive") : (isArabic ? "إغلاق" : "Close"),
          style: "destructive",
          onPress: () => void runOpportunityAction(action),
        },
      ],
    );
  }

  function confirmApplicantDecision(applicant: PublisherApplicant, status: "accepted" | "rejected") {
    const accepting = status === "accepted";
    Alert.alert(
      accepting ? (isArabic ? "قبول الموهبة؟" : "Accept talent?") : (isArabic ? "رفض الطلب؟" : "Reject application?"),
      accepting
        ? (isArabic ? `سيتم قبول ${applicant.name} وفتح المحادثة للتواصل.` : `${applicant.name} will be accepted and a conversation will be opened.`)
        : (isArabic ? `سيتم رفض طلب ${applicant.name}.` : `${applicant.name}'s application will be rejected.`),
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: accepting ? (isArabic ? "قبول" : "Accept") : (isArabic ? "رفض" : "Reject"),
          style: accepting ? "default" : "destructive",
          onPress: () => void changeApplicantStatus(applicant, status),
        },
      ],
    );
  }

  if (loading) {
    return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "جارٍ تحميل تفاصيل الفرصة" : "Loading opportunity details"} />;
  }

  const status = detail?.opportunity.status || (detail?.opportunity.published ? "published" : "draft");
  const archived = status === "archived";
  const editable = EDITABLE_STATUSES.has(status);
  const canSubmit = SUBMITTABLE_STATUSES.has(status);
  const published = detail?.opportunity.published === true || status === "published";
  const counts = detail ? {
    total: detail.applicants.length,
    shortlisted: detail.applicants.filter((item) => item.status === "shortlisted").length,
    accepted: detail.applicants.filter((item) => item.status === "accepted").length,
  } : { total: 0, shortlisted: 0, accepted: 0 };

  const rowRtl = isRtl ? styles.rowRtl : null;
  const textRtl = isRtl ? styles.textRtl : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact, { direction: isRtl ? "rtl" : "ltr" }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={darkTheme.accent} colors={[darkTheme.accent]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topRow, rowRtl]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isArabic ? "رجوع" : "Back"}
            onPress={() => leaveAuthenticatedScreen("/publisher")}
            style={styles.backButton}
          >
            <BackIcon size={21} color={darkTheme.text} strokeWidth={1.9} />
          </Pressable>
          <Text style={[styles.topLabel, textRtl]}>{isArabic ? "إدارة الفرصة" : "Manage opportunity"}</Text>
        </View>

        {detail ? (
          <>
            <View style={styles.hero}>
              <Text style={[styles.eyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "ملامح للأعمال" : "MLAMH FOR BUSINESS"}</Text>
              <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, textRtl]}>{detail.opportunity.title}</Text>
              <Text style={[styles.meta, textRtl]}>
                {[detail.opportunity.city, countryLabel(detail.opportunity.countryCode, locale)].filter(Boolean).join(" · ")}
              </Text>
              <View style={[styles.badges, rowRtl]}>
                <Text style={styles.goldBadge}>{displayValue(detail.opportunity.opportunityType, locale) ?? detail.opportunity.opportunityType}</Text>
                <Text style={styles.outlineBadge}>{statusLabel(status, locale)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.cardHeader, rowRtl]}>
                <View style={styles.flexOne}>
                  <Text style={[styles.sectionEyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "الحالة" : "STATUS"}</Text>
                  <Text style={[styles.sectionTitle, textRtl]}>{statusLabel(status, locale)}</Text>
                </View>
                {busyAction ? <ActivityIndicator color={darkTheme.accent} /> : null}
              </View>
              <Text style={[styles.body, textRtl]}>{statusMessage(status, locale)}</Text>
              {!archived ? (
                <View style={[styles.actions, rowRtl]}>
                  {editable ? <ActionButton label={isArabic ? "تعديل" : "Edit"} icon="edit" onPress={() => router.push(`/publisher/opportunities/${opportunityId}/edit`)} secondary /> : null}
                  {canSubmit ? <ActionButton label={isArabic ? "إرسال للمراجعة" : "Submit for review"} icon="send" onPress={() => void runOpportunityAction("publish")} /> : null}
                  {published || status === "pending_review" ? <ActionButton label={isArabic ? "إغلاق" : "Close"} icon="close" onPress={() => confirmOpportunityAction("close")} secondary /> : null}
                  <ActionButton label={isArabic ? "أرشفة" : "Archive"} icon="archive" onPress={() => confirmOpportunityAction("archive")} danger />
                </View>
              ) : null}
            </View>

            <OpportunityFacts detail={detail} locale={locale} isRtl={isRtl} styles={styles} />

            <View style={styles.applicantSection}>
              <View style={[styles.cardHeader, rowRtl]}>
                <View>
                  <Text style={[styles.sectionEyebrow, isArabic && styles.noTracking, textRtl]}>{isArabic ? "الطلبات" : "APPLICATIONS"}</Text>
                  <Text style={[styles.sectionTitle, textRtl]}>{isArabic ? "مراجعة المتقدمين" : "Review applicants"}</Text>
                </View>
                <Text style={styles.sectionCount}>{formatLatinNumber(counts.total, locale)}</Text>
              </View>
              <View style={[styles.metrics, rowRtl]}>
                <Metric value={counts.total} label={isArabic ? "الإجمالي" : "Total"} locale={locale} styles={styles} />
                <Metric value={counts.shortlisted} label={isArabic ? "القائمة المختصرة" : "Shortlist"} locale={locale} styles={styles} />
                <Metric value={counts.accepted} label={isArabic ? "مقبول" : "Accepted"} locale={locale} styles={styles} accent />
              </View>
              <Text style={[styles.guidance, textRtl]}>{isArabic ? "راجع ملف الموهبة قبل اتخاذ القرار. لا تُفتح المحادثة إلا بعد القبول." : "Review the talent profile before making a decision. Messaging opens only after acceptance."}</Text>
            </View>

            {detail.applicants.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, textRtl]}>{isArabic ? "لا توجد طلبات حتى الآن" : "No applications yet"}</Text>
                <Text style={[styles.body, textRtl]}>{isArabic ? "ستظهر الطلبات هنا بمجرد تقدم المواهب على الفرصة." : "Applications will appear here as talents apply."}</Text>
              </View>
            ) : detail.applicants.map((applicant) => (
              <ApplicantCard
                key={applicant.applicationId}
                applicant={applicant}
                locale={locale}
                isRtl={isRtl}
                styles={styles}
                busy={busyApplicant === applicant.applicationId}
                disabled={busyApplicant !== null}
                onChange={changeApplicantStatus}
                onConfirm={confirmApplicantDecision}
              />
            ))}

            {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text></View> : null}
          </>
        ) : (
          <View style={styles.empty}>
            <Text accessibilityRole="alert" style={[styles.error, textRtl]}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.secondaryButton}><Text style={styles.secondaryText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OpportunityFacts({ detail, locale, isRtl, styles }: { detail: PublisherOpportunityDetail; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  const ar = locale === "ar";
  const o = detail.opportunity;
  const age = o.minAge == null && o.maxAge == null
    ? null
    : o.minAge != null && o.maxAge != null
      ? `${formatLatinNumber(o.minAge, locale)}–${formatLatinNumber(o.maxAge, locale)}`
      : o.minAge != null
        ? `${formatLatinNumber(o.minAge, locale)}+`
        : `≤ ${formatLatinNumber(o.maxAge!, locale)}`;
  const compensation = o.compensationType === "unpaid"
    ? (ar ? "بدون مقابل" : "Unpaid")
    : o.compensationType === "negotiable"
      ? (ar ? "حسب الاتفاق" : "Negotiable")
      : [toLatinDigits(o.budget ?? ""), o.currency].filter(Boolean).join(" ") || (ar ? "غير محدد" : "Not specified");
  const roleItems = roleRequirementItems(o.roleRequirements ?? {}, o.opportunityType, locale);

  return (
    <View style={styles.card}>
      <Text style={[styles.sectionEyebrow, ar && styles.noTracking, isRtl && styles.textRtl]}>{ar ? "التفاصيل" : "DETAILS"}</Text>
      <Text style={[styles.sectionTitle, isRtl && styles.textRtl]}>{ar ? "تفاصيل موجز الفرصة" : "Brief details"}</Text>
      <Text style={[styles.body, isRtl && styles.textRtl]}>{o.description}</Text>
      <View style={[styles.factGrid, isRtl && styles.rowRtl]}>
        <Fact label={ar ? "المقابل" : "Compensation"} value={compensation} isRtl={isRtl} styles={styles} />
        <Fact label={ar ? "الجنس" : "Gender"} value={genderLabel(o.requiredGender, locale)} isRtl={isRtl} styles={styles} />
        {age ? <Fact label={ar ? "العمر" : "Age"} value={age} isRtl={isRtl} styles={styles} /> : null}
        {o.requiredCount ? <Fact label={ar ? "العدد المطلوب" : "Talent count"} value={formatLatinNumber(o.requiredCount, locale)} isRtl={isRtl} styles={styles} /> : null}
        {o.workDate ? <Fact label={ar ? "تاريخ العمل" : "Work date"} value={formatGregorianDate(o.workDate, locale) ?? toLatinDigits(o.workDate)} isRtl={isRtl} styles={styles} /> : null}
        {o.workDuration ? <Fact label={ar ? "مدة العمل" : "Duration"} value={durationLabel(o.workDuration, locale)} isRtl={isRtl} styles={styles} /> : null}
        {o.applicationStartDate ? <Fact label={ar ? "بداية التقديم" : "Application start"} value={formatGregorianDate(o.applicationStartDate, locale) ?? toLatinDigits(o.applicationStartDate)} isRtl={isRtl} styles={styles} /> : null}
        {o.applicationDeadline ? <Fact label={ar ? "آخر موعد" : "Deadline"} value={formatGregorianDate(o.applicationDeadline, locale) ?? toLatinDigits(o.applicationDeadline)} isRtl={isRtl} styles={styles} /> : null}
      </View>
      {roleItems.length ? (
        <View style={styles.requirements}>
          {roleItems.map((item) => <View key={item.label} style={[styles.requirementRow, isRtl && styles.rowRtl]}><Text style={[styles.requirementLabel, isRtl && styles.textRtl]}>{item.label}</Text><Text style={[styles.requirementValue, isRtl && styles.textRtl]}>{item.value}</Text></View>)}
        </View>
      ) : null}
    </View>
  );
}

function ApplicantCard({ applicant, locale, isRtl, styles, busy, disabled, onChange, onConfirm }: { applicant: PublisherApplicant; locale: "ar" | "en"; isRtl: boolean; styles: ReturnType<typeof createStyles>; busy: boolean; disabled: boolean; onChange: (applicant: PublisherApplicant, status: ApplicantDecision) => Promise<void>; onConfirm: (applicant: PublisherApplicant, status: "accepted" | "rejected") => void }) {
  const ar = locale === "ar";
  const accepted = applicant.status === "accepted";
  const rejected = applicant.status === "rejected";
  const shortlisted = applicant.status === "shortlisted";
  const appliedAt = applicant.createdAt ? formatGregorianDate(applicant.createdAt, locale) : null;

  return (
    <View style={[styles.applicantCard, accepted && styles.acceptedCard]}>
      <View style={[styles.applicantTop, isRtl && styles.rowRtl]}>
        {applicant.imageUrl ? <Image source={{ uri: applicant.imageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{applicant.name.slice(0, 1)}</Text></View>}
        <View style={styles.flexOne}>
          <Text numberOfLines={1} style={[styles.applicantName, isRtl && styles.textRtl]}>{applicant.name}</Text>
          <Text style={[styles.meta, isRtl && styles.textRtl]}>{[applicant.category, applicant.city].filter(Boolean).join(" · ")}</Text>
          {appliedAt ? <Text style={[styles.appliedAt, isRtl && styles.textRtl]}>{ar ? `تقدم ${appliedAt}` : `Applied ${appliedAt}`}</Text> : null}
        </View>
        <Text style={[styles.statusPill, accepted && styles.statusAccepted, rejected && styles.statusRejected]}>{statusLabel(applicant.status, locale)}</Text>
      </View>

      <View style={[styles.actions, isRtl && styles.rowRtl]}>
        {applicant.talentSlug ? <Pressable onPress={() => router.push(`/talents/${encodeURIComponent(applicant.talentSlug!)}`)} style={styles.secondaryButton}><Text style={styles.secondaryText}>{ar ? "عرض ملف الموهبة" : "View talent profile"}</Text></Pressable> : null}
        {accepted && applicant.conversationId ? <Pressable onPress={() => router.push(`/conversations/${applicant.conversationId}`)} style={styles.primaryButton}><MessageCircle size={15} color={darkTheme.background} /><Text style={styles.primaryText}>{ar ? "فتح المحادثة" : "Open chat"}</Text></Pressable> : null}
      </View>

      {!accepted && !rejected ? (
        <View style={[styles.actions, isRtl && styles.rowRtl]}>
          {!shortlisted ? <Pressable disabled={disabled} onPress={() => void onChange(applicant, "shortlisted")} style={[styles.secondaryButton, disabled && styles.disabled]}><Text style={styles.secondaryText}>{ar ? "قائمة مختصرة" : "Shortlist"}</Text></Pressable> : null}
          <Pressable disabled={disabled} onPress={() => onConfirm(applicant, "rejected")} style={[styles.dangerButton, disabled && styles.disabled]}><Text style={styles.dangerText}>{ar ? "رفض" : "Reject"}</Text></Pressable>
          <Pressable disabled={disabled} onPress={() => onConfirm(applicant, "accepted")} style={[styles.primaryButton, disabled && styles.disabled]}>{busy ? <ActivityIndicator size="small" color={darkTheme.background} /> : <Text style={styles.primaryText}>{ar ? "قبول" : "Accept"}</Text>}</Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({ label, icon, onPress, secondary = false, danger = false }: { label: string; icon: "edit" | "send" | "close" | "archive"; onPress: () => void; secondary?: boolean; danger?: boolean }) {
  const Icon = icon === "edit" ? Edit3 : icon === "send" ? Send : icon === "close" ? XCircle : Archive;
  const color = danger ? darkTheme.danger : secondary ? darkTheme.text : darkTheme.background;
  return <Pressable onPress={onPress} style={[stylesStatic.actionButton, secondary && stylesStatic.actionSecondary, danger && stylesStatic.actionDanger]}><Icon size={16} color={color} /><Text style={[stylesStatic.actionText, secondary && stylesStatic.actionTextSecondary, danger && stylesStatic.actionTextDanger]}>{label}</Text></Pressable>;
}

function Metric({ value, label, locale, styles, accent = false }: { value: number; label: string; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; accent?: boolean }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, accent && styles.metricValueAccent]}>{formatLatinNumber(value, locale)}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Fact({ label, value, isRtl, styles }: { label: string; value: string; isRtl: boolean; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.fact}><Text style={[styles.factLabel, isRtl && styles.textRtl]}>{label}</Text><Text style={[styles.factValue, isRtl && styles.textRtl]}>{value}</Text></View>;
}

function roleRequirementItems(value: Record<string, unknown>, type: string, locale: "ar" | "en") {
  const ar = locale === "ar";
  const items: Array<{ label: string; value: string }> = [];
  if (type === "actor") {
    const languages = Array.isArray(value.languages) ? value.languages.filter((item): item is string => typeof item === "string") : [];
    const dialects = Array.isArray(value.dialects) ? value.dialects.filter((item): item is string => typeof item === "string") : [];
    const languageLabels = displayValues(languages, locale);
    const dialectLabels = displayValues(dialects, locale);
    if (languageLabels.length) items.push({ label: ar ? "اللغات" : "Languages", value: languageLabels.join(ar ? "، " : ", ") });
    if (dialectLabels.length) items.push({ label: ar ? "اللهجات" : "Dialects", value: dialectLabels.join(ar ? "، " : ", ") });
  } else if (type === "model") {
    const modelingRaw = Array.isArray(value.modeling_types) ? value.modeling_types : Array.isArray(value.modelingTypes) ? value.modelingTypes : [];
    const modeling = modelingRaw.filter((item): item is string => typeof item === "string");
    const modelingLabels = displayValues(modeling, locale);
    if (modelingLabels.length) items.push({ label: ar ? "أنواع المودل" : "Modeling types", value: modelingLabels.join(ar ? "، " : ", ") });
    const minHeight = value.min_height_cm ?? value.minHeightCm;
    const hair = value.hair_color ?? value.hairColor;
    if (minHeight != null) items.push({ label: ar ? "الحد الأدنى للطول" : "Minimum height", value: `${toLatinDigits(String(minHeight))} ${ar ? "سم" : "cm"}` });
    if (typeof hair === "string" && hair) items.push({ label: ar ? "لون الشعر" : "Hair color", value: displayValue(hair, locale) ?? hair });
  }
  return items;
}

function countryLabel(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return null;
  return displayValue(value.toLowerCase(), locale) ?? value;
}

function genderLabel(value: string | null | undefined, locale: "ar" | "en") {
  if (value === "male") return locale === "ar" ? "ذكر" : "Male";
  if (value === "female") return locale === "ar" ? "أنثى" : "Female";
  return locale === "ar" ? "الجميع" : "Any";
}

function durationLabel(value: string, locale: "ar" | "en") {
  const values: Record<string, { ar: string; en: string }> = {
    "1_hour": { ar: "ساعة", en: "1 hour" },
    "2_hours": { ar: "ساعتان", en: "2 hours" },
    "4_hours": { ar: "4 ساعات", en: "4 hours" },
    full_day: { ar: "يوم كامل", en: "Full day" },
  };
  return toLatinDigits(values[value]?.[locale] ?? value.replaceAll("_", " "));
}

function actionError(code: string, locale: "ar" | "en") {
  const ar: Record<string, string> = {
    INCOMPLETE_OPPORTUNITY: "أكمل عنوان ووصف الفرصة قبل إرسالها للمراجعة.",
    MISSING_COUNTRY: "حدد دولة الفرصة قبل إرسالها للمراجعة.",
    ARCHIVED: "لا يمكن تعديل أو إرسال فرصة مؤرشفة.",
    FORBIDDEN: "لا تملك صلاحية إدارة هذه الفرصة.",
    PUBLISHER_NOT_VERIFIED: "يجب توثيق الجهة قبل إرسال الفرصة للمراجعة.",
    ALREADY_PENDING_REVIEW: "الفرصة قيد المراجعة بالفعل.",
    ALREADY_PUBLISHED: "الفرصة منشورة بالفعل.",
    REJECTED: "الفرصة المرفوضة لا يمكن إعادة إرسالها من التطبيق.",
    EDIT_LOCKED: "لا يمكن تعديل الفرصة في حالتها الحالية.",
  };
  const en: Record<string, string> = {
    INCOMPLETE_OPPORTUNITY: "Complete the title and description before submitting for review.",
    MISSING_COUNTRY: "Set the opportunity country before submitting for review.",
    ARCHIVED: "Archived opportunities cannot be edited or submitted.",
    FORBIDDEN: "You do not have permission to manage this opportunity.",
    PUBLISHER_NOT_VERIFIED: "Your organization must be verified before submitting this opportunity.",
    ALREADY_PENDING_REVIEW: "This opportunity is already under review.",
    ALREADY_PUBLISHED: "This opportunity is already published.",
    REJECTED: "Rejected opportunities cannot be resubmitted from the app.",
    EDIT_LOCKED: "This opportunity cannot be edited in its current state.",
  };
  return (locale === "ar" ? ar : en)[code] ?? (locale === "ar" ? "تعذر تحديث الفرصة." : "Unable to update opportunity.");
}

function statusMessage(status: string, locale: "ar" | "en") {
  const ar: Record<string, string> = {
    draft: "المسودة خاصة بك. عدّلها ثم أرسلها للمراجعة.",
    open: "المسودة خاصة بك. عدّلها ثم أرسلها للمراجعة.",
    pending_review: "تم إرسال الفرصة للمراجعة ولن تظهر للمواهب حتى اعتمادها.",
    needs_changes: "طلبت الإدارة تعديلات. حدّث الفرصة ثم أرسلها للمراجعة مجددًا.",
    published: "الفرصة منشورة وتستقبل الطلبات.",
    closed: "الفرصة مغلقة ويمكن تعديلها وإرسالها للمراجعة مجددًا.",
    rejected: "تم رفض هذه الفرصة.",
    archived: "هذه الفرصة مؤرشفة.",
  };
  const en: Record<string, string> = {
    draft: "This draft is private. Edit it, then submit it for review.",
    open: "This draft is private. Edit it, then submit it for review.",
    pending_review: "This opportunity is under review and will not be visible to talent until approved.",
    needs_changes: "Changes were requested. Update the opportunity, then submit it again.",
    published: "This opportunity is published and accepting applications.",
    closed: "This opportunity is closed. You can edit and submit it for review again.",
    rejected: "This opportunity was rejected.",
    archived: "This opportunity is archived.",
  };
  return (locale === "ar" ? ar : en)[status] ?? "";
}

function statusLabel(status: string, locale: "ar" | "en") {
  const ar: Record<string, string> = { draft: "مسودة", open: "مسودة", pending_review: "قيد المراجعة", needs_changes: "تحتاج تعديل", published: "منشورة", closed: "مغلقة", archived: "مؤرشفة", submitted: "جديد", pending: "قيد المراجعة", shortlisted: "مختصر", accepted: "مقبول", rejected: "مرفوض" };
  const en: Record<string, string> = { draft: "Draft", open: "Draft", pending_review: "In review", needs_changes: "Needs changes", published: "Published", closed: "Closed", archived: "Archived", submitted: "New", pending: "Review", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Rejected" };
  return (locale === "ar" ? ar : en)[status] ?? status;
}

const stylesStatic = StyleSheet.create({
  actionButton: { minHeight: 44, flexGrow: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 13, backgroundColor: darkTheme.accent },
  actionSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: darkTheme.border },
  actionDanger: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#C84F4F55" },
  actionText: { color: darkTheme.background, fontSize: 10, fontWeight: "900" },
  actionTextSecondary: { color: darkTheme.text },
  actionTextDanger: { color: darkTheme.danger },
});

function createStyles() {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: darkTheme.background },
    content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 18, paddingTop: 18, paddingBottom: 42, gap: 15 },
    contentCompact: { paddingHorizontal: 14, paddingTop: 14, gap: 12 },
    rowRtl: { flexDirection: "row-reverse" },
    textRtl: { textAlign: "right", writingDirection: "rtl" },
    noTracking: { letterSpacing: 0, writingDirection: "rtl" },
    flexOne: { flex: 1 },
    topRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: darkTheme.border, backgroundColor: darkTheme.surface, alignItems: "center", justifyContent: "center" },
    topLabel: { color: darkTheme.muted, fontSize: 11, fontWeight: "700" },
    hero: { gap: 7, paddingVertical: 2 },
    eyebrow: { color: darkTheme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
    title: { color: darkTheme.text, fontSize: 30, lineHeight: 37, fontWeight: "800" },
    titleCompact: { fontSize: 25, lineHeight: 31 },
    meta: { color: darkTheme.muted, fontSize: 10, lineHeight: 16 },
    badges: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
    goldBadge: { color: darkTheme.background, backgroundColor: darkTheme.accent, borderRadius: 999, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: "900" },
    outlineBadge: { color: darkTheme.text, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9 },
    card: { gap: 12, padding: 16, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 20, backgroundColor: darkTheme.surface },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    sectionEyebrow: { color: darkTheme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
    sectionTitle: { color: darkTheme.text, fontSize: 19, fontWeight: "800", marginTop: 2 },
    sectionCount: { color: darkTheme.accent, fontSize: 27, fontWeight: "700" },
    body: { color: darkTheme.muted, fontSize: 12, lineHeight: 19 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    factGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    fact: { minWidth: "46%", flexGrow: 1, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 14, backgroundColor: darkTheme.background, padding: 10, gap: 4 },
    factLabel: { color: darkTheme.muted, fontSize: 9, fontWeight: "700" },
    factValue: { color: darkTheme.text, fontSize: 11, fontWeight: "800" },
    requirements: { gap: 8, borderTopWidth: 1, borderTopColor: darkTheme.border, paddingTop: 11 },
    requirementRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
    requirementLabel: { color: darkTheme.muted, fontSize: 10 },
    requirementValue: { color: darkTheme.text, fontSize: 11, fontWeight: "700", flex: 1 },
    applicantSection: { gap: 11, marginTop: 3 },
    metrics: { flexDirection: "row", gap: 8 },
    metric: { flex: 1, minHeight: 74, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 16, backgroundColor: darkTheme.surface, padding: 10, justifyContent: "space-between" },
    metricValue: { color: darkTheme.text, fontSize: 22, fontWeight: "700" },
    metricValueAccent: { color: "#49C991" },
    metricLabel: { color: darkTheme.muted, fontSize: 8, fontWeight: "700" },
    guidance: { color: darkTheme.muted, fontSize: 10, lineHeight: 17 },
    applicantCard: { gap: 13, padding: 14, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 19, backgroundColor: darkTheme.surface },
    acceptedCard: { borderColor: "#16A36A55" },
    applicantTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: 54, height: 54, borderRadius: 17, backgroundColor: darkTheme.surfaceElevated },
    avatarFallback: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: darkTheme.surfaceElevated, borderWidth: 1, borderColor: darkTheme.border },
    avatarInitial: { color: darkTheme.accent, fontSize: 19, fontWeight: "800" },
    applicantName: { color: darkTheme.text, fontSize: 15, fontWeight: "800" },
    appliedAt: { color: darkTheme.grayMuted, fontSize: 9, marginTop: 2 },
    statusPill: { color: darkTheme.accent, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, fontSize: 8, fontWeight: "900", overflow: "hidden" },
    statusAccepted: { color: "#49C991", borderColor: "#16A36A55", backgroundColor: "#16A36A10" },
    statusRejected: { color: darkTheme.danger, borderColor: "#C84F4F44", backgroundColor: "#C84F4F0D" },
    primaryButton: { minHeight: 42, flexGrow: 1, flexDirection: "row", gap: 7, backgroundColor: darkTheme.accent, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    primaryText: { color: darkTheme.background, fontSize: 10, fontWeight: "900" },
    secondaryButton: { minHeight: 42, flexGrow: 1, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    secondaryText: { color: darkTheme.text, fontSize: 10, fontWeight: "800" },
    dangerButton: { minHeight: 42, flexGrow: 1, borderWidth: 1, borderColor: "#C84F4F55", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
    dangerText: { color: darkTheme.danger, fontSize: 10, fontWeight: "800" },
    disabled: { opacity: 0.45 },
    empty: { minHeight: 148, alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: darkTheme.border, borderRadius: 19, padding: 18 },
    emptyTitle: { color: darkTheme.text, fontSize: 15, fontWeight: "800" },
    errorBox: { borderWidth: 1, borderColor: "#C84F4F66", backgroundColor: "#C84F4F14", borderRadius: 13, padding: 12 },
    error: { color: darkTheme.danger, fontSize: 12, lineHeight: 18 },
  });
}
