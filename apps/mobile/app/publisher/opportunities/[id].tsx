import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { getPublisherOpportunity, managePublisherOpportunity, updatePublisherApplicantStatus, type PublisherApplicant, type PublisherOpportunityAction, type PublisherOpportunityDetail } from "@/lib/publisher-api";
import { darkTheme, lightTheme } from "@/lib/theme";

export default function PublisherOpportunityDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const opportunityId = Number(rawId);
  const locale = getDeviceLocale();
  const theme = useColorScheme() === "dark" ? darkTheme : lightTheme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [detail, setDetail] = useState<PublisherOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<PublisherOpportunityAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) { setError(locale === "ar" ? "الفرصة غير صالحة." : "Invalid opportunity."); setLoading(false); return; }
    refresh ? setRefreshing(true) : setLoading(true); setError(null);
    const result = await getPublisherOpportunity(opportunityId, locale);
    if (!result) setError(locale === "ar" ? "تعذر تحميل تفاصيل الفرصة." : "Unable to load opportunity details.");
    else setDetail(result);
    setLoading(false); setRefreshing(false);
  }, [locale, opportunityId]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(applicant: PublisherApplicant, status: "accepted" | "rejected" | "shortlisted") {
    setBusyId(applicant.applicationId); setError(null);
    const result = await updatePublisherApplicantStatus(opportunityId, applicant.applicationId, status);
    if (!result.ok) setError(locale === "ar" ? "تعذر تحديث حالة الطلب." : "Unable to update application status.");
    else { await load(true); if (status === "accepted" && result.conversationId) router.push(`/conversations/${result.conversationId}`); }
    setBusyId(null);
  }

  async function runAction(action: Exclude<PublisherOpportunityAction, "edit">) {
    setBusyAction(action); setError(null);
    const result = await managePublisherOpportunity(opportunityId, { action });
    if (!result.ok) setError(actionError(result.code, locale));
    else await load(true);
    setBusyAction(null);
  }

  function confirmAction(action: "close" | "archive") {
    const archive = action === "archive";
    Alert.alert(
      archive ? (locale === "ar" ? "أرشفة الفرصة؟" : "Archive opportunity?") : (locale === "ar" ? "إغلاق الفرصة؟" : "Close opportunity?"),
      archive ? (locale === "ar" ? "سيتم إخفاء الفرصة وأرشفتها. لا يمكن تعديل الفرصة المؤرشفة من التطبيق." : "The opportunity will be hidden and archived. Archived opportunities cannot be edited in the app.") : (locale === "ar" ? "سيتم إخفاء الفرصة وإيقاف استقبال الطلبات الجديدة." : "The opportunity will be hidden and stop receiving new applications."),
      [{ text: locale === "ar" ? "إلغاء" : "Cancel", style: "cancel" }, { text: archive ? (locale === "ar" ? "أرشفة" : "Archive") : (locale === "ar" ? "إغلاق" : "Close"), style: "destructive", onPress: () => void runAction(action) }],
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.accent} /></View>;
  const archived = detail?.opportunity.status === "archived";

  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { direction: isRtlLocale(locale) ? "rtl" : "ltr" }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={theme.accent} />}>
    <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.back}>{locale === "ar" ? "رجوع" : "Back"}</Text></Pressable>
    {detail ? <>
      <View style={styles.hero}><Text style={styles.eyebrow}>MLAMH · OWNER</Text><Text style={styles.title}>{detail.opportunity.title}</Text><Text style={styles.meta}>{[detail.opportunity.city, detail.opportunity.countryCode].filter(Boolean).join(" · ")}</Text><View style={styles.badges}><Text style={styles.goldBadge}>{detail.opportunity.opportunityType}</Text><Text style={styles.outlineBadge}>{statusLabel(detail.opportunity.status || (detail.opportunity.published ? "published" : "draft"), locale)}</Text></View></View>
      <View style={styles.manageCard}>
        <View style={styles.manageHeader}><Text style={styles.sectionTitle}>{locale === "ar" ? "إدارة الفرصة" : "Manage opportunity"}</Text>{busyAction ? <ActivityIndicator color={theme.accent} /> : null}</View>
        {!archived ? <View style={styles.manageActions}>
          <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => router.push(`/publisher/opportunities/${opportunityId}/edit`)} accessibilityRole="button"><Text style={styles.secondaryButtonText}>{locale === "ar" ? "تعديل" : "Edit"}</Text></Pressable>
          {!detail.opportunity.published ? <Pressable disabled={Boolean(busyAction)} style={styles.managePrimary} onPress={() => void runAction("publish")} accessibilityRole="button"><Text style={styles.primaryButtonText}>{locale === "ar" ? "نشر الفرصة" : "Publish"}</Text></Pressable> : <Pressable disabled={Boolean(busyAction)} style={styles.manageSecondary} onPress={() => confirmAction("close")} accessibilityRole="button"><Text style={styles.secondaryButtonText}>{locale === "ar" ? "إغلاق" : "Close"}</Text></Pressable>}
          <Pressable disabled={Boolean(busyAction)} style={styles.manageDanger} onPress={() => confirmAction("archive")} accessibilityRole="button"><Text style={styles.rejectText}>{locale === "ar" ? "أرشفة" : "Archive"}</Text></Pressable>
        </View> : <Text style={styles.body}>{locale === "ar" ? "هذه الفرصة مؤرشفة ومحفوظة للرجوع إليها." : "This opportunity is archived and retained for reference."}</Text>}
      </View>
      <View style={styles.card}><Text style={styles.sectionTitle}>{locale === "ar" ? "تفاصيل الفرصة" : "Opportunity details"}</Text><Text style={styles.body}>{detail.opportunity.description}</Text><View style={styles.infoRow}><Text style={styles.meta}>{locale === "ar" ? "المقابل" : "Compensation"}</Text><Text style={styles.infoValue}>{[detail.opportunity.budget, detail.opportunity.currency].filter(Boolean).join(" ") || detail.opportunity.compensationType || "—"}</Text></View></View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{locale === "ar" ? `المتقدمون (${detail.applicants.length})` : `Applicants (${detail.applicants.length})`}</Text></View>
      {detail.applicants.length === 0 ? <View style={styles.empty}><Text style={styles.body}>{locale === "ar" ? "لا توجد طلبات على هذه الفرصة حتى الآن." : "No applications yet."}</Text></View> : detail.applicants.map((applicant) => <ApplicantCard key={applicant.applicationId} applicant={applicant} locale={locale} styles={styles} busy={busyId === applicant.applicationId} onChange={changeStatus} />)}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </> : <Text style={styles.error}>{error}</Text>}
  </ScrollView>;
}

function ApplicantCard({ applicant, locale, styles, busy, onChange }: { applicant: PublisherApplicant; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; busy: boolean; onChange: (applicant: PublisherApplicant, status: "accepted" | "rejected" | "shortlisted") => Promise<void> }) {
  const accepted = applicant.status === "accepted"; const rejected = applicant.status === "rejected";
  return <View style={styles.applicantCard}><View style={styles.applicantTop}>{applicant.imageUrl ? <Image source={{ uri: applicant.imageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{applicant.name.slice(0, 1)}</Text></View>}<View style={styles.applicantInfo}><Text style={styles.applicantName}>{applicant.name}</Text><Text style={styles.meta}>{[applicant.category, applicant.city].filter(Boolean).join(" · ")}</Text></View><Text style={styles.statusText}>{statusLabel(applicant.status, locale)}</Text></View>
    {accepted && applicant.conversationId ? <Pressable style={styles.primaryButton} onPress={() => router.push(`/conversations/${applicant.conversationId}`)}><Text style={styles.primaryButtonText}>{locale === "ar" ? "فتح المحادثة" : "Open chat"}</Text></Pressable> : null}
    {!accepted && !rejected ? <View style={styles.actions}><Pressable disabled={busy} style={styles.secondaryButton} onPress={() => void onChange(applicant, "shortlisted")}><Text style={styles.secondaryButtonText}>{locale === "ar" ? "قائمة مختصرة" : "Shortlist"}</Text></Pressable><Pressable disabled={busy} style={styles.rejectButton} onPress={() => void onChange(applicant, "rejected")}><Text style={styles.rejectText}>{locale === "ar" ? "رفض" : "Reject"}</Text></Pressable><Pressable disabled={busy} style={styles.primaryButtonSmall} onPress={() => void onChange(applicant, "accepted")}><Text style={styles.primaryButtonText}>{busy ? "…" : (locale === "ar" ? "قبول" : "Accept")}</Text></Pressable></View> : null}
  </View>;
}

function actionError(code: string, locale: "ar" | "en") { const ar: Record<string,string> = { INCOMPLETE_OPPORTUNITY: "أكمل عنوان ووصف الفرصة قبل النشر.", MISSING_COUNTRY: "حدد دولة الفرصة قبل النشر.", ARCHIVED: "لا يمكن تعديل أو نشر فرصة مؤرشفة.", FORBIDDEN: "لا تملك صلاحية إدارة هذه الفرصة." }; const en: Record<string,string> = { INCOMPLETE_OPPORTUNITY: "Complete the title and description before publishing.", MISSING_COUNTRY: "Set the opportunity country before publishing.", ARCHIVED: "Archived opportunities cannot be edited or published.", FORBIDDEN: "You do not have permission to manage this opportunity." }; return (locale === "ar" ? ar : en)[code] ?? (locale === "ar" ? "تعذر تحديث الفرصة." : "Unable to update opportunity."); }
function statusLabel(status: string, locale: "ar" | "en") { const ar: Record<string,string> = { draft: "مسودة", open: "مسودة", published: "منشورة", closed: "مغلقة", archived: "مؤرشفة", submitted: "جديد", pending: "قيد المراجعة", shortlisted: "مختصر", accepted: "مقبول", rejected: "مرفوض" }; const en: Record<string,string> = { draft: "Draft", open: "Draft", published: "Published", closed: "Closed", archived: "Archived", submitted: "New", pending: "Review", shortlisted: "Shortlisted", accepted: "Accepted", rejected: "Rejected" }; return (locale === "ar" ? ar : en)[status] ?? status; }
function createStyles(theme: typeof lightTheme | typeof darkTheme) { return StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }, content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 60, gap: 15 }, back: { color: theme.accent, fontSize: 13, fontWeight: "700" }, hero: { gap: 10, paddingVertical: 12 }, eyebrow: { color: theme.accent, fontSize: 11, fontWeight: "800", letterSpacing: 2 }, title: { color: theme.text, fontSize: 34, lineHeight: 42, fontWeight: "300" }, meta: { color: theme.muted, fontSize: 11, lineHeight: 18 }, badges: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, goldBadge: { color: "#181818", backgroundColor: theme.accent, borderRadius: 14, overflow: "hidden", paddingHorizontal: 11, paddingVertical: 6, fontSize: 10, fontWeight: "800" }, outlineBadge: { color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6, fontSize: 10 }, manageCard: { gap: 14, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, manageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, manageActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, managePrimary: { minWidth: 110, flexGrow: 1, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 12, alignItems: "center" }, manageSecondary: { minWidth: 90, flexGrow: 1, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingVertical: 12, alignItems: "center" }, manageDanger: { minWidth: 90, borderWidth: 1, borderColor: "rgba(239,68,68,0.45)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" }, card: { gap: 13, padding: 18, borderWidth: 1, borderColor: theme.border, borderRadius: 24, backgroundColor: theme.surface }, sectionHeader: { marginTop: 5 }, sectionTitle: { color: theme.text, fontSize: 20, fontWeight: "600" }, body: { color: theme.muted, fontSize: 14, lineHeight: 23 }, infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }, infoValue: { color: theme.text, fontSize: 12, fontWeight: "700" }, applicantCard: { gap: 14, padding: 16, borderWidth: 1, borderColor: theme.border, borderRadius: 22, backgroundColor: theme.surface }, applicantTop: { flexDirection: "row", alignItems: "center", gap: 12 }, avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.border }, avatarFallback: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: theme.border }, avatarInitial: { color: theme.accent, fontSize: 22, fontWeight: "600" }, applicantInfo: { flex: 1, gap: 3 }, applicantName: { color: theme.text, fontSize: 17, fontWeight: "600" }, statusText: { color: theme.accent, fontSize: 10, fontWeight: "800" }, actions: { flexDirection: "row", gap: 8 }, primaryButton: { backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 13, alignItems: "center" }, primaryButtonSmall: { flex: 1, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 11, alignItems: "center" }, primaryButtonText: { color: "#181818", fontSize: 12, fontWeight: "800" }, secondaryButton: { flex: 1.2, borderWidth: 1, borderColor: theme.border, borderRadius: 14, paddingVertical: 11, alignItems: "center" }, secondaryButtonText: { color: theme.text, fontSize: 11, fontWeight: "700" }, rejectButton: { flex: 1, borderWidth: 1, borderColor: "rgba(239,68,68,0.45)", borderRadius: 14, paddingVertical: 11, alignItems: "center" }, rejectText: { color: "#EF8B8B", fontSize: 11, fontWeight: "700" }, empty: { minHeight: 140, alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: theme.border, borderRadius: 22, padding: 20 }, error: { color: "#EF8B8B", fontSize: 13, lineHeight: 19 } }); }
