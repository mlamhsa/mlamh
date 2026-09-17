import { router, useLocalSearchParams } from "expo-router";
import { CalendarClock, Check, ChevronLeft, ChevronRight, FileText, MessageCircle, Phone, Ruler, Send, Video, X, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { MobileApiError } from "@/src/api/client";
import {
  confirmQuickSelection,
  getConversationDetail,
  markConversationRead,
  requestQuickMaterials,
  sendConversationMessage,
  shareQuickContact,
  submitQuickTalentDecision,
  type QuickMaterialRequestType,
} from "@/src/domains/messages/api";
import type { ConversationDetailResponse, QuickRequestProductState } from "@/src/domains/messages/types";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { colors, radius, spacing } from "@/src/theme/tokens";

function workflowLabel(state: QuickRequestProductState, isArabic: boolean) {
  const labels: Record<QuickRequestProductState, [string, string]> = {
    interested: ["تم إبداء الاهتمام", "Interest sent"],
    conversation_open: ["المحادثة مفتوحة", "Conversation open"],
    preliminary_selected: ["اختيار مبدئي", "Preliminary selection"],
    materials_requested: ["مطلوب مواد إضافية", "Materials requested"],
    awaiting_talent_confirmation: ["بانتظار تأكيدك", "Awaiting your confirmation"],
    mutually_confirmed: ["تم تأكيد التعاون", "Collaboration confirmed"],
    declined: ["تم الاعتذار", "Declined"],
  };
  return isArabic ? labels[state][0] : labels[state][1];
}

const MATERIAL_OPTIONS: Array<{
  type: QuickMaterialRequestType;
  ar: string;
  en: string;
  icon: typeof FileText;
}> = [
  { type: "portfolio", ar: "معرض الأعمال", en: "Portfolio", icon: FileText },
  { type: "intro_video", ar: "فيديو تعريفي", en: "Intro video", icon: Video },
  { type: "measurements", ar: "المقاسات / التفاصيل", en: "Measurements", icon: Ruler },
  { type: "availability", ar: "التوفر للموعد", en: "Availability", icon: CalendarClock },
];

export function ConversationScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const conversationId = Number(rawId);
  const { locale } = useLocale();
  const isArabic = locale === "ar";
  const BackIcon = isArabic ? ChevronRight : ChevronLeft;
  const align = isArabic ? "right" : "left";
  const scrollRef = useRef<ScrollView>(null);
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const load = useCallback(async () => {
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      setError(isArabic ? "المحادثة غير صالحة." : "Invalid conversation.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const detail = await getConversationDetail(conversationId);
      setData(detail);
      try {
        await markConversationRead(conversationId);
      } catch (markError) {
        console.warn("[ConversationScreen mark-read]", markError);
      }
    } catch {
      setError(isArabic ? "تعذر تحميل المحادثة." : "Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, isArabic]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (data?.messages.length) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 0);
  }, [data?.messages.length]);

  const send = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending || !data) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendConversationMessage(conversationId, body);
      if (!result.ok) throw new Error(result.code);
      setDraft("");
      setData((current) => current ? { ...current, messages: [...current.messages, result.message] } : current);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "SEND_FAILED";
      setError(code === "RATE_LIMITED"
        ? (isArabic ? "تم إرسال رسائل كثيرة بسرعة. حاول بعد قليل." : "Too many messages sent quickly. Try again shortly.")
        : (isArabic ? "تعذر إرسال الرسالة." : "Unable to send message."));
    } finally {
      setSending(false);
    }
  }, [conversationId, data, draft, isArabic, sending]);

  const decide = useCallback(async (decision: "accept" | "decline") => {
    if (deciding) return;
    setDeciding(true);
    setError(null);
    try {
      await submitQuickTalentDecision(conversationId, decision, locale);
      await load();
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "DECISION_FAILED";
      setError(
        code === "ALREADY_DECIDED"
          ? (isArabic ? "سبق تسجيل قرارك لهذا الطلب." : "Your decision has already been recorded.")
          : code === "PUBLISHER_CONFIRMATION_REQUIRED"
            ? (isArabic ? "لم تؤكد الجهة الاختيار النهائي بعد." : "The publisher has not confirmed the selection yet.")
            : (isArabic ? "تعذر تسجيل قرارك. حاول مرة أخرى." : "Unable to record your decision. Try again."),
      );
      if (code === "ALREADY_DECIDED") await load();
    } finally {
      setDeciding(false);
    }
  }, [conversationId, deciding, isArabic, load, locale]);

  const requestMaterial = useCallback(async (requestType: QuickMaterialRequestType) => {
    if (workflowBusy) return;
    setWorkflowBusy(true);
    setError(null);
    try {
      await requestQuickMaterials(conversationId, requestType, locale);
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "REQUEST_FAILED";
      setError(
        code === "PRELIMINARY_SELECTION_REQUIRED"
          ? (isArabic ? "يجب اختيار الموهبة مبدئيًا أولًا." : "A preliminary selection is required first.")
          : code === "RATE_LIMITED"
            ? (isArabic ? "تمت محاولات كثيرة خلال وقت قصير. حاول لاحقًا." : "Too many attempts in a short time. Try again later.")
            : (isArabic ? "تعذر إرسال طلب المادة الإضافية." : "Unable to request additional material."),
      );
    } finally {
      setWorkflowBusy(false);
    }
  }, [conversationId, isArabic, load, locale, workflowBusy]);

  const confirmSelection = useCallback(async () => {
    if (workflowBusy) return;
    setWorkflowBusy(true);
    setError(null);
    try {
      await confirmQuickSelection(conversationId, locale);
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "CONFIRM_FAILED";
      setError(
        code === "PRELIMINARY_SELECTION_REQUIRED"
          ? (isArabic ? "يجب اختيار الموهبة مبدئيًا أولًا." : "A preliminary selection is required first.")
          : code === "RATE_LIMITED"
            ? (isArabic ? "تمت محاولات كثيرة خلال وقت قصير. حاول لاحقًا." : "Too many attempts in a short time. Try again later.")
            : (isArabic ? "تعذر تأكيد الاختيار. حاول مرة أخرى." : "Unable to confirm the selection. Try again."),
      );
    } finally {
      setWorkflowBusy(false);
    }
  }, [conversationId, isArabic, load, locale, workflowBusy]);

  const shareContact = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    setError(null);
    try {
      await shareQuickContact(conversationId, locale);
      await load();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 0);
    } catch (caught) {
      const code = caught instanceof MobileApiError ? caught.code : "SHARE_FAILED";
      setError(
        code === "PHONE_MISSING"
          ? (isArabic ? "لا يوجد رقم جوال محفوظ في حسابك. أضف رقمك أولًا ثم حاول مرة أخرى." : "No mobile number is saved on your account. Add one first, then try again.")
          : code === "MUTUAL_CONFIRMATION_REQUIRED"
            ? (isArabic ? "لا يمكن مشاركة رقم التواصل قبل تأكيد التعاون من الطرفين." : "Contact details cannot be shared before both sides confirm the collaboration.")
            : code === "RATE_LIMITED"
              ? (isArabic ? "تمت محاولات كثيرة خلال وقت قصير. حاول لاحقًا." : "Too many attempts in a short time. Try again later.")
              : (isArabic ? "تعذرت مشاركة رقم التواصل. حاول مرة أخرى." : "Unable to share your contact number. Try again."),
      );
    } finally {
      setSharing(false);
    }
  }, [conversationId, isArabic, load, locale, sharing]);

  const workflow = data?.conversation.workflow;
  const remainingMaterials = MATERIAL_OPTIONS.filter((option) => !workflow?.requestedMaterials.includes(option.type));

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.header, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[styles.party, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{data?.conversation.partyName || (isArabic ? "المحادثة" : "Conversation")}</Text>
            <Text numberOfLines={1} style={[styles.opportunity, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{data?.conversation.opportunityTitle || "MLAMH"}</Text>
          </View>
          <MessageCircle size={19} color={colors.gold} />
        </View>

        {workflow ? (
          <View style={styles.workflowCard}>
            <View style={[styles.workflowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <Zap size={14} color="#F6D487" />
              <Text style={styles.workflowEyebrow}>{isArabic ? "طلب الآن" : "QUICK REQUEST"}</Text>
              <Text style={[styles.workflowState, { textAlign: isArabic ? "right" : "left", writingDirection: isArabic ? "rtl" : "ltr" }]}>{workflowLabel(workflow.state, isArabic)}</Text>
            </View>

            {workflow.actions.canRequestMaterials ? (
              <View style={styles.publisherActionBox}>
                <Text style={[styles.workflowAction, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic ? "يمكنك طلب مادة إضافية قبل تأكيد اختيار الموهبة." : "You can request additional material before confirming the talent."}
                </Text>
                <View style={[styles.materialGrid, isArabic && styles.rowReverse]}>
                  {remainingMaterials.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Pressable
                        key={option.type}
                        disabled={workflowBusy}
                        onPress={() => void requestMaterial(option.type)}
                        style={[styles.materialButton, workflowBusy && styles.disabled]}
                      >
                        <Icon size={14} color={colors.gold} />
                        <Text style={styles.materialText}>{isArabic ? option.ar : option.en}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {workflow.actions.canPublisherConfirm ? (
              <Pressable
                accessibilityRole="button"
                disabled={workflowBusy}
                onPress={() => void confirmSelection()}
                style={[styles.publisherConfirmButton, workflowBusy && styles.disabled]}
              >
                <Check size={15} color="#090909" />
                <Text style={styles.publisherConfirmText}>{isArabic ? "تأكيد اختيار الموهبة" : "Confirm talent selection"}</Text>
              </Pressable>
            ) : null}

            {workflow.actions.canTalentConfirm ? (
              <>
                <Text style={[styles.workflowAction, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic ? "الجهة أكدت اختيارك. أكد قبولك أو اعتذر لإكمال الطلب." : "The publisher confirmed your selection. Confirm or decline to complete the request."}
                </Text>
                <View style={[styles.decisionRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
                  <Pressable disabled={deciding} onPress={() => void decide("accept")} style={[styles.confirmButton, deciding && styles.disabled]}>
                    <Check size={15} color="#090909" />
                    <Text style={styles.confirmText}>{isArabic ? "أؤكد قبولي" : "Confirm"}</Text>
                  </Pressable>
                  <Pressable disabled={deciding} onPress={() => void decide("decline")} style={[styles.declineButton, deciding && styles.disabled]}>
                    <X size={15} color={colors.textSecondary} />
                    <Text style={styles.declineText}>{isArabic ? "أعتذر" : "Decline"}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {workflow.actions.canShareContact ? (
              <View style={styles.contactShareBox}>
                <Text style={[styles.contactShareText, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                  {isArabic
                    ? "تم تأكيد التعاون من الطرفين. يمكنك الآن مشاركة رقم جوالك المحفوظ في حسابك، ولن تتم مشاركته إلا عند ضغطك على الزر."
                    : "Both sides confirmed the collaboration. You can now explicitly share the mobile number saved on your account; it is never shared automatically."}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={sharing}
                  onPress={() => void shareContact()}
                  style={[styles.shareContactButton, sharing && styles.disabled]}
                >
                  <Phone size={15} color="#090909" />
                  <Text style={styles.shareContactText}>{isArabic ? "مشاركة رقم التواصل" : "Share contact number"}</Text>
                </Pressable>
              </View>
            ) : null}

            {workflow.requestedMaterials.length ? (
              <Text style={[styles.workflowNote, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>
                {isArabic ? `تم طلب: ${workflow.requestedMaterials.join("، ")}` : `Requested: ${workflow.requestedMaterials.join(", ")}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          {loading ? <Text style={styles.centerText}>{isArabic ? "جارٍ تحميل المحادثة..." : "Loading conversation..."}</Text> : null}
          {!loading && data?.messages.length === 0 ? <Text style={styles.centerText}>{isArabic ? "ابدأ المحادثة من هنا." : "Start the conversation here."}</Text> : null}
          {data?.messages.map((message) => (
            <View key={String(message.id)} style={[styles.messageRow, message.isMine ? styles.mineRow : styles.theirRow]}>
              <View style={[styles.bubble, message.isMine ? styles.mineBubble : styles.theirBubble]}>
                <Text style={[styles.messageBody, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}>{message.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={[styles.composer, isArabic ? styles.rowRtl : styles.rowLtr]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={isArabic ? "اكتب رسالة..." : "Write a message..."}
            placeholderTextColor="rgba(255,255,255,0.28)"
            multiline
            maxLength={4000}
            style={[styles.input, { textAlign: align, writingDirection: isArabic ? "rtl" : "ltr" }]}
          />
          <Pressable accessibilityRole="button" disabled={!draft.trim() || sending} onPress={() => void send()} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}>
            <Send size={18} color="#090909" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rowReverse: { flexDirection: "row-reverse" },
  header: { minHeight: 66, alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  headerCopy: { flex: 1 },
  party: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  opportunity: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  workflowCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderColor: "rgba(201,169,98,0.22)", backgroundColor: "rgba(201,169,98,0.055)", borderRadius: radius.lg, padding: spacing.md },
  workflowRow: { alignSelf: "stretch" },
  workflowEyebrow: { color: "#F6D487", fontSize: 9, fontWeight: "800" },
  workflowState: { color: colors.textPrimary, fontSize: 11, fontWeight: "700", flex: 1 },
  workflowAction: { color: colors.gold, fontSize: 12, lineHeight: 20, fontWeight: "600", marginTop: spacing.sm },
  workflowNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: spacing.sm },
  publisherActionBox: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(201,169,98,0.16)", paddingTop: spacing.sm },
  materialGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  materialButton: { minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "rgba(201,169,98,0.24)", borderRadius: radius.pill, paddingHorizontal: spacing.md, backgroundColor: "rgba(201,169,98,0.05)" },
  materialText: { color: colors.textSecondary, fontSize: 10, fontWeight: "600" },
  publisherConfirmButton: { minHeight: 44, marginTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: radius.lg, backgroundColor: colors.gold },
  publisherConfirmText: { color: "#090909", fontSize: 12, fontWeight: "800" },
  decisionRow: { marginTop: spacing.md },
  confirmButton: { minHeight: 42, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.lg, backgroundColor: colors.gold },
  confirmText: { color: "#090909", fontSize: 12, fontWeight: "800" },
  declineButton: { minHeight: 42, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  declineText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  contactShareBox: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(201,169,98,0.16)", paddingTop: spacing.md },
  contactShareText: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  shareContactButton: { minHeight: 42, marginTop: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: radius.lg, backgroundColor: colors.gold },
  shareContactText: { color: "#090909", fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.42 },
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm },
  centerText: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.xl },
  messageRow: { flexDirection: "row" },
  mineRow: { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: 11 },
  mineBubble: { backgroundColor: "rgba(201,169,98,0.16)", borderWidth: 1, borderColor: "rgba(201,169,98,0.24)" },
  theirBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  messageBody: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  errorText: { color: "#E9A8A8", fontSize: 11, textAlign: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  input: { flex: 1, minHeight: 46, maxHeight: 120, color: colors.textPrimary, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: spacing.md, paddingVertical: 11, fontSize: 14 },
  sendButton: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: colors.gold },
  sendDisabled: { opacity: 0.38 },
});
