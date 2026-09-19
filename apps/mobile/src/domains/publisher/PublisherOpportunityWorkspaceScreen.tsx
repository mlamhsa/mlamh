import { router, useLocalSearchParams } from "expo-router";
import { BriefcaseBusiness, Check, ChevronLeft, ChevronRight, MessageCircle, UserRound, X, Zap } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  decidePublisherApplicant,
  getPublisherOpportunityWorkspace,
  type PublisherOpportunityApplicant,
  type PublisherOpportunityWorkspaceResponse,
} from "@/src/domains/publisher/workspace";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { localizeOpportunityStatus, localizeTalentType } from "@/src/i18n/format";
import { colors, radius, spacing } from "@/src/theme/tokens";

type FilterKey = "all" | "pending" | "selected" | "rejected";
type Decision = "accepted" | "rejected";

function stateLabel(state: string, isArabic: boolean) {
  const labels: Record<string, [string, string]> = {
    pending: ["جديد", "New"],
    reviewing: ["قيد المراجعة", "Reviewing"],
    shortlisted: ["قائمة مختصرة", "Shortlisted"],
    accepted: ["مقبول", "Accepted"],
    rejected: ["مرفوض", "Rejected"],
    interested: ["مهتم", "Interested"],
    conversation_open: ["المحادثة مفتوحة", "Conversation open"],
    preliminary_selected: ["اختيار مبدئي", "Preliminary selection"],
    materials_requested: ["مواد مطلوبة", "Materials requested"],
    awaiting_talent_confirmation: ["بانتظار تأكيد الموهبة", "Awaiting talent"],
    mutually_confirmed: ["تم التأكيد", "Confirmed"],
    declined: ["اعتذرت الموهبة", "Declined"],
  };
  return isArabic ? labels[state]?.[0] ?? state : labels[state]?.[1] ?? state;
}

export function PublisherOpportunityWorkspaceScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const opportunityId = Number(params.id);
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const align = isArabic ? "right" : "left";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const [data, setData] = useState<PublisherOpportunityWorkspaceResponse | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [decisionBusyId, setDecisionBusyId] = useState<number | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!Number.isInteger(opportunityId) || opportunityId <= 0) {
      setError(true);
      setLoading(false);
      return;
    }
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      setData(await getPublisherOpportunityWorkspace(opportunityId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [opportunityId]);

  useEffect(() => { void load(); }, [load]);

  const applicants = useMemo(() => {
    const items = data?.applicants ?? [];
    if (filter === "all") return items;
    if (filter === "selected") return items.filter((item) => item.rawStatus === "accepted");
    if (filter === "rejected") return items.filter((item) => item.rawStatus === "rejected");
    return items.filter((item) => item.rawStatus !== "accepted" && item.rawStatus !== "rejected");
  }, [data?.applicants, filter]);

  const isQuick = data?.opportunity.postingMode === "quick";
  const ModeIcon = isQuick ? Zap : BriefcaseBusiness;

  const runDecision = useCallback(async (applicationId: number, decision: Decision) => {
    setDecisionBusyId(applicationId);
    setDecisionError(null);
    try {
      const result = await decidePublisherApplicant(applicationId, decision);
      await load(true);
      if (decision === "accepted" && result.conversationId) {
        router.push(`/messages/${result.conversationId}` as never);
      }
    } catch {
      setDecisionError(
        isArabic
          ? "تعذر تحديث حالة المتقدم. حدّث الصفحة وحاول مرة أخرى."
          : "Unable to update this applicant. Refresh and try again.",
      );
    } finally {
      setDecisionBusyId(null);
    }
  }, [isArabic, load]);

  const confirmDecision = useCallback((item: PublisherOpportunityApplicant, decision: Decision) => {
    const quickSelection = isQuick && decision === "accepted";
    Alert.alert(
      quickSelection
        ? (isArabic ? "اختيار مبدئي" : "Preliminary selection")
        : decision === "accepted"
          ? (isArabic ? "قبول المتقدم" : "Accept applicant")
          : (isArabic ? "رفض المتقدم" : "Reject applicant"),
      quickSelection
        ? (isArabic
            ? "سيتم فتح محادثة مع الموهبة. هذا اختيار مبدئي وليس تأكيدًا نهائيًا للتعاون."
            : "A conversation will open with the talent. This is a preliminary selection, not final confirmation.")
        : decision === "accepted"
          ? (isArabic
              ? "سيتم قبول المتقدم وفتح محادثة مرتبطة بهذه الفرصة."
              : "The applicant will be accepted and a linked conversation will be opened.")
          : (isArabic
              ? "سيتم رفض هذا الطلب ولا يمكن التراجع عن الحالة من هذه الشاشة."
              : "This application will be rejected and cannot be reversed from this screen."),
      [
        { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: quickSelection
            ? (isArabic ? "اختيار" : "Select")
            : decision === "accepted"
              ? (isArabic ? "قبول" : "Accept")
              : (isArabic ? "رفض" : "Reject"),
          style: decision === "rejected" ? "destructive" : "default",
          onPress: () => { void runDecision(item.applicationId, decision); },
        },
      ],
    );
  }, [isArabic, isQuick, runDecision]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <BackIcon size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { textAlign: align }]}>{isArabic ? "إدارة الفرصة" : "OPPORTUNITY WORKSPACE"}</Text>
          <Text style={[styles.headerTitle, { textAlign: align }]} numberOfLines={1}>{data?.opportunity.title ?? (isArabic ? "الفرصة" : "Opportunity")}</Text>
        </View>
        <ModeIcon size={20} color={colors.gold} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.gold} />}
      >
        {loading ? <Text style={styles.centerText}>{isArabic ? "جارٍ تحميل مساحة الفرصة..." : "Loading workspace..."}</Text> : null}
        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={[styles.stateText, { textAlign: align }]}>{isArabic ? "تعذر تحميل الفرصة والمتقدمين." : "Unable to load opportunity and applicants."}</Text>
            <Pressable onPress={() => void load()} style={styles.primaryButton}><Text style={styles.primaryText}>{isArabic ? "إعادة المحاولة" : "Retry"}</Text></Pressable>
          </View>
        ) : null}

        {!loading && !error && data ? (
          <>
            <View style={styles.heroCard}>
              <Text style={[styles.opportunityTitle, { textAlign: align }]}>{data.opportunity.title}</Text>
              <Text style={[styles.meta, { textAlign: align }]}>
                {isQuick ? (isArabic ? "طلب الآن" : "Quick Request") : (isArabic ? "كاستينغ" : "Casting")}
                {" · "}{isArabic ? (data.opportunity.cityAr ?? data.opportunity.cityEn ?? "—") : (data.opportunity.cityEn ?? data.opportunity.cityAr ?? "—")}
                {" · "}{localizeOpportunityStatus(data.opportunity.status, locale)}
              </Text>
              <View style={styles.statsRow}>
                <Stat value={data.counts.total} label={isArabic ? "المتقدمون" : "Applicants"} />
                <Stat value={data.counts.selected} label={isArabic ? "مختارون" : "Selected"} />
                <Stat value={data.counts.conversations} label={isArabic ? "محادثات" : "Chats"} />
              </View>
            </View>

            {decisionError ? <Text style={[styles.decisionError, { textAlign: align }]}>{decisionError}</Text> : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {([
                ["all", isArabic ? "الكل" : "All", data.counts.total],
                ["pending", isArabic ? "جدد" : "New", data.counts.pending],
                ["selected", isArabic ? "مختارون" : "Selected", data.counts.selected],
                ["rejected", isArabic ? "مرفوضون" : "Rejected", data.counts.rejected],
              ] as Array<[FilterKey, string, number]>).map(([key, label, count]) => (
                <Pressable key={key} onPress={() => setFilter(key)} style={[styles.filterChip, filter === key && styles.filterChipActive]}>
                  <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label} · {count}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {applicants.length === 0 ? (
              <View style={styles.stateCard}><Text style={[styles.stateText, { textAlign: align }]}>{isArabic ? "لا يوجد متقدمون ضمن هذا التصنيف." : "No applicants in this filter."}</Text></View>
            ) : (
              <View style={styles.list}>
                {applicants.map((item) => (
                  <ApplicantCard
                    key={item.applicationId}
                    item={item}
                    isArabic={isArabic}
                    align={align}
                    isQuick={Boolean(isQuick)}
                    busy={decisionBusyId === item.applicationId}
                    decisionsDisabled={decisionBusyId !== null}
                    onDecision={(decision) => confirmDecision(item, decision)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ApplicantCard({
  item,
  isArabic,
  align,
  isQuick,
  busy,
  decisionsDisabled,
  onDecision,
}: {
  item: PublisherOpportunityApplicant;
  isArabic: boolean;
  align: "right" | "left";
  isQuick: boolean;
  busy: boolean;
  decisionsDisabled: boolean;
  onDecision: (decision: Decision) => void;
}) {
  const talentName = isArabic ? (item.talent?.nameAr ?? item.talent?.nameEn ?? "موهبة") : (item.talent?.nameEn ?? item.talent?.nameAr ?? "Talent");
  const city = isArabic ? (item.talent?.cityAr ?? item.talent?.cityEn ?? "—") : (item.talent?.cityEn ?? item.talent?.cityAr ?? "—");
  const canDecide = item.rawStatus !== "accepted" && item.rawStatus !== "rejected";

  return (
    <View style={styles.card}>
      <View style={[styles.cardTop, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
        {item.talent?.imageUrl ? <Image source={{ uri: item.talent.imageUrl }} style={styles.avatar} /> : <View style={styles.avatarFallback}><UserRound size={20} color={colors.textMuted} /></View>}
        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { textAlign: align }]}>{talentName}</Text>
          <Text style={[styles.meta, { textAlign: align }]}>{city}{item.talent?.role ? ` · ${localizeTalentType(item.talent.role, isArabic ? "ar" : "en")}` : ""}</Text>
        </View>
        <View style={styles.statusPill}><Text style={styles.statusText}>{stateLabel(item.displayState, isArabic)}</Text></View>
      </View>

      {canDecide ? (
        <View style={[styles.decisionRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
          <Pressable
            disabled={decisionsDisabled}
            accessibilityRole="button"
            onPress={() => onDecision("accepted")}
            style={[styles.selectButton, decisionsDisabled && styles.disabledButton]}
          >
            <Check size={14} color="#090909" />
            <Text style={styles.primaryText}>
              {busy
                ? (isArabic ? "جارٍ التحديث..." : "Updating...")
                : isQuick
                  ? (isArabic ? "اختيار مبدئي" : "Select")
                  : (isArabic ? "قبول" : "Accept")}
            </Text>
          </Pressable>
          <Pressable
            disabled={decisionsDisabled}
            accessibilityRole="button"
            onPress={() => onDecision("rejected")}
            style={[styles.rejectButton, decisionsDisabled && styles.disabledButton]}
          >
            <X size={14} color={colors.textSecondary} />
            <Text style={styles.rejectText}>{isArabic ? "رفض" : "Reject"}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.actions, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
        {item.talent?.slug ? (
          <Pressable onPress={() => router.push(`/talent/${item.talent?.slug}` as never)} style={styles.secondaryButton}>
            <UserRound size={14} color={colors.textSecondary} />
            <Text style={styles.secondaryText}>{isArabic ? "الملف" : "Profile"}</Text>
          </Pressable>
        ) : null}
        {item.conversationId ? (
          <Pressable onPress={() => router.push(`/messages/${item.conversationId}` as never)} style={styles.primaryButtonInline}>
            <MessageCircle size={14} color="#090909" />
            <Text style={styles.primaryText}>{isArabic ? "المحادثة" : "Conversation"}</Text>
          </Pressable>
        ) : (
          <View style={styles.noConversation}><Text style={styles.noConversationText}>{isArabic ? "لا توجد محادثة بعد" : "No conversation yet"}</Text></View>
        )}
      </View>

      {item.quickWorkflow?.actions.canPublisherConfirm || item.quickWorkflow?.actions.canRequestMaterials ? (
        <Text style={[styles.workflowHint, { textAlign: align }]}>
          {isArabic ? "إجراءات طلب الآن متاحة داخل المحادثة بعد الاختيار المبدئي." : "Quick Request workflow actions are available inside the conversation after preliminary selection."}
        </Text>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  headerTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: 56 },
  heroCard: { borderWidth: 1, borderColor: "rgba(201,169,98,0.24)", backgroundColor: "rgba(201,169,98,0.05)", borderRadius: radius.xl, padding: spacing.lg },
  opportunityTitle: { color: colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 5 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  stat: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, alignItems: "center" },
  statValue: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 9, marginTop: 4 },
  decisionError: { color: "#f4a3a3", fontSize: 11, lineHeight: 18, marginTop: spacing.md },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  filterChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 9 },
  filterChipActive: { borderColor: "rgba(201,169,98,0.40)", backgroundColor: "rgba(201,169,98,0.10)" },
  filterText: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: colors.gold },
  list: { gap: spacing.md },
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg },
  cardTop: { alignItems: "center", gap: spacing.md },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.background },
  avatarFallback: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  cardCopy: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "800" },
  statusPill: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 9, paddingVertical: 6, maxWidth: 130 },
  statusText: { color: colors.textSecondary, fontSize: 9, fontWeight: "700", textAlign: "center" },
  decisionRow: { gap: spacing.sm, marginTop: spacing.md },
  selectButton: { flex: 1, minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: spacing.md },
  rejectButton: { flex: 1, minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  rejectText: { color: colors.textSecondary, fontSize: 10, fontWeight: "800" },
  disabledButton: { opacity: 0.45 },
  actions: { gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  secondaryButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.textSecondary, fontSize: 10, fontWeight: "800" },
  primaryButtonInline: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: spacing.md },
  noConversation: { minHeight: 38, justifyContent: "center", paddingHorizontal: spacing.md },
  noConversationText: { color: colors.textMuted, fontSize: 10 },
  workflowHint: { color: colors.gold, fontSize: 10, lineHeight: 17, marginTop: spacing.sm },
  stateCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md },
  stateText: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  centerText: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl },
  primaryButton: { alignSelf: "center", marginTop: spacing.md, borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  primaryText: { color: "#090909", fontSize: 10, fontWeight: "800" },
});
