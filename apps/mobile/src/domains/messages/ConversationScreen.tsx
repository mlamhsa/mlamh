import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, MessageCircle, Send, Zap } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileApiError } from "@/src/api/client";
import { getConversationDetail, sendConversationMessage } from "@/src/domains/messages/api";
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
      setData(await getConversationDetail(conversationId));
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <BackIcon size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={[styles.party, { textAlign: align }]}>{data?.conversation.partyName || (isArabic ? "المحادثة" : "Conversation")}</Text>
            <Text numberOfLines={1} style={[styles.opportunity, { textAlign: align }]}>{data?.conversation.opportunityTitle || "MLAMH"}</Text>
          </View>
          <MessageCircle size={19} color={colors.gold} />
        </View>

        {data?.conversation.workflow ? (
          <View style={styles.workflowCard}>
            <View style={[styles.workflowRow, isArabic ? styles.rowRtl : styles.rowLtr]}>
              <Zap size={14} color="#F6D487" />
              <Text style={styles.workflowEyebrow}>{isArabic ? "طلب الآن" : "QUICK REQUEST"}</Text>
              <Text style={styles.workflowState}>{workflowLabel(data.conversation.workflow.state, isArabic)}</Text>
            </View>
            {data.conversation.workflow.actions.canTalentConfirm ? (
              <Text style={[styles.workflowAction, { textAlign: align }]}>
                {isArabic ? "الجهة أكدت اختيارك. يلزم تأكيدك أو اعتذارك لإكمال الطلب." : "The publisher confirmed your selection. Confirm or decline to complete the request."}
              </Text>
            ) : null}
            {data.conversation.workflow.requestedMaterials.length ? (
              <Text style={[styles.workflowNote, { textAlign: align }]}>
                {isArabic ? `مطلوب: ${data.conversation.workflow.requestedMaterials.join("، ")}` : `Requested: ${data.conversation.workflow.requestedMaterials.join(", ")}`}
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
                <Text style={[styles.messageBody, { textAlign: align }]}>{message.body}</Text>
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
            style={[styles.input, { textAlign: align }]}
          />
          <Pressable accessibilityRole="button" disabled={!draft.trim() || sending} onPress={() => void send()} style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}>
            <Send size={18} color="#090909" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  rowRtl: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.sm },
  rowLtr: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg },
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
