import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Send } from "lucide-react-native";

import { ScreenSkeleton } from "@/components/ScreenSkeleton";
import { getConversation, sendMessage, type ConversationDetailResponse, type MobileMessage } from "@/lib/api";
import { getCurrentUserId, markConversationRead, subscribeToConversationMessages } from "@/lib/chat";
import { getDeviceLocale, isRtlLocale } from "@/lib/i18n";
import { darkTheme } from "@/lib/theme";

export default function ConversationScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const locale = getDeviceLocale();
  const isArabic = locale === "ar";
  const isRtl = isRtlLocale(locale);
  const theme = darkTheme;
  const { width, height } = useWindowDimensions();
  const compact = width <= 360 || height <= 700;
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const listRef = useRef<FlatList<MobileMessage>>(null);
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveUpdates, setLiveUpdates] = useState(false);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const appendMessage = useCallback((message: MobileMessage) => {
    setData((current) => {
      if (!current || current.messages.some((item) => String(item.id) === String(message.id))) return current;
      return { ...current, messages: [...current.messages, message] };
    });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const load = useCallback(async () => {
    if (!conversationId) {
      setLoading(false);
      setError(isArabic ? "تعذر تحديد المحادثة." : "Unable to identify this conversation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getConversation(conversationId);
      if (!result) setError(isArabic ? "هذه المحادثة غير متاحة لهذا الحساب أو تعذر الوصول إليها الآن." : "This conversation is unavailable for this account or cannot be reached right now.");
      else {
        setData(result);
        void markConversationRead(conversationId);
      }
    } catch {
      setError(isArabic ? "تعذر فتح المحادثة. تحقق من الاتصال وحاول مرة أخرى." : "Unable to open this conversation. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [conversationId, isArabic]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!conversationId) return;
    let cleanup: (() => void) | undefined;
    let active = true;
    void getCurrentUserId().then((currentUserId) => {
      if (!active || !currentUserId) return;
      cleanup = subscribeToConversationMessages({
        conversationId,
        currentUserId,
        onMessage: (message) => {
          appendMessage(message);
          if (!message.isMine) void markConversationRead(conversationId);
        },
      });
      if (active) setLiveUpdates(true);
    });
    return () => {
      active = false;
      setLiveUpdates(false);
      cleanup?.();
    };
  }, [appendMessage, conversationId]);

  async function submit() {
    const body = draft.trim();
    if (!conversationId || !body || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendMessage(conversationId, body);
      if (result.ok) {
        setDraft("");
        appendMessage(result.message);
      } else {
        const messages: Record<string, { ar: string; en: string }> = {
          EMPTY_MESSAGE: { ar: "اكتب رسالة قبل الإرسال.", en: "Write a message before sending." },
          MESSAGE_TOO_LONG: { ar: "الرسالة طويلة جدًا. الحد الأقصى 4000 حرف.", en: "The message is too long. Maximum 4,000 characters." },
          CONVERSATION_NOT_ACTIVE: { ar: "هذه المحادثة مغلقة حاليًا.", en: "This conversation is currently closed." },
          NOT_FOUND: { ar: "المحادثة غير متاحة لهذا الحساب.", en: "This conversation is not available for this account." },
          UNAUTHENTICATED: { ar: "انتهت جلسة الدخول. سجّل الدخول للمتابعة.", en: "Your session expired. Sign in to continue." },
          REQUEST_FAILED: { ar: "تعذر إرسال الرسالة بسبب الاتصال. حاول مرة أخرى.", en: "The message could not be sent because of a connection problem. Try again." },
        };
        const message = messages[result.code];
        setError(message ? message[locale] : (isArabic ? "تعذر إرسال الرسالة." : "Unable to send the message."));
      }
    } catch {
      setError(isArabic ? "تعذر إرسال الرسالة. حاول مرة أخرى." : "Unable to send the message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <ScreenSkeleton variant="detail" locale={locale} label={isArabic ? "جارٍ تحميل المحادثة" : "Loading conversation"} />;
  if (!data) return <SafeAreaView style={styles.centered} edges={["top", "bottom"]}><Text accessibilityRole="alert" style={[styles.error, isRtl && styles.textRtl]}>{error}</Text><Pressable style={styles.secondaryButton} onPress={() => void load()}><Text style={styles.secondaryButtonText}>{isArabic ? "إعادة المحاولة" : "Try again"}</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.back}>{isArabic ? "رجوع" : "Back"}</Text></Pressable></SafeAreaView>;

  const canSend = data.conversation.status === "active";
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
      <View style={[styles.header, isRtl && styles.rowRtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} onPress={() => router.back()} hitSlop={10} style={styles.backButton}><BackIcon size={22} color={theme.text} strokeWidth={1.9} /></Pressable>
        <View style={[styles.headerIdentity, isRtl && styles.rowRtl]}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{data.conversation.partyName.slice(0, 1)}</Text></View>
          <View style={styles.headerText}><Text accessibilityRole="header" numberOfLines={1} style={[styles.partyName, isRtl && styles.textRtl]}>{data.conversation.partyName}</Text><Text numberOfLines={1} style={[styles.contextLine, isRtl && styles.textRtl]}>{data.conversation.opportunityTitle ?? (isArabic ? "محادثة ملامح" : "MLAMH conversation")}</Text></View>
        </View>
        <View style={[styles.livePill, !liveUpdates && styles.syncingPill]}><Text style={[styles.liveText, !liveUpdates && styles.syncingText]}>{liveUpdates ? (isArabic ? "مباشر" : "Live") : (isArabic ? "مزامنة" : "Syncing")}</Text></View>
      </View>

      <FlatList ref={listRef} data={data.messages} keyExtractor={(item) => String(item.id)} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.messages} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} renderItem={({ item }) => <MessageBubble message={item} locale={locale} styles={styles} isRtl={isRtl} />} ListEmptyComponent={<Text style={styles.empty}>{isArabic ? "المحادثة جاهزة. أرسل أول رسالة عندما تكون مستعدًا." : "The conversation is ready. Send your first message when you are ready."}</Text>} />

      <View style={styles.composer}>{error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.inlineError, isRtl && styles.textRtl]}>{error}</Text> : null}<View style={[styles.composerRow, isRtl && styles.rowRtl]}><TextInput accessibilityLabel={isArabic ? "نص الرسالة" : "Message text"} value={draft} onChangeText={setDraft} editable={canSend && !sending} multiline maxLength={4000} placeholder={canSend ? (isArabic ? "اكتب رسالة" : "Write a message") : (isArabic ? "المحادثة مغلقة" : "Conversation closed")} placeholderTextColor={theme.muted} textAlign={isRtl ? "right" : "left"} style={[styles.input, isRtl && styles.textRtl]} /><Pressable accessibilityRole="button" accessibilityLabel={isArabic ? "إرسال الرسالة" : "Send message"} disabled={!canSend || !draft.trim() || sending} style={({ pressed }) => [styles.sendButton, (pressed || !canSend || !draft.trim() || sending) && styles.sendDisabled]} onPress={() => void submit()}>{sending ? <ActivityIndicator color={theme.background} /> : <Send size={18} color={theme.background} strokeWidth={2.1} style={isRtl ? { transform: [{ rotate: "180deg" }] } : undefined} />}</Pressable></View></View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function MessageBubble({ message, locale, styles, isRtl }: { message: MobileMessage; locale: "ar" | "en"; styles: ReturnType<typeof createStyles>; isRtl: boolean }) {
  const label = message.isMine ? `${locale === "ar" ? "أنت" : "You"}: ${message.body}` : message.body;
  return <View accessible accessibilityLabel={label} style={[styles.bubble, message.isMine ? styles.mine : styles.theirs]}><Text style={[styles.messageText, message.isMine && styles.mineText, isRtl && styles.textRtl]}>{message.body}</Text></View>;
}

function createStyles(theme: typeof darkTheme, compact: boolean) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background }, centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 24, backgroundColor: theme.background }, rowRtl: { flexDirection: "row-reverse" }, textRtl: { textAlign: "right", writingDirection: "rtl" },
    header: { paddingHorizontal: compact ? 10 : 14, paddingVertical: compact ? 8 : 10, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.background, flexDirection: "row", alignItems: "center", gap: compact ? 7 : 10, minHeight: compact ? 60 : 66 }, backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" },
    headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", gap: compact ? 8 : 10 }, avatar: { width: compact ? 36 : 40, height: compact ? 36 : 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }, avatarText: { color: theme.accent, fontSize: compact ? 15 : 17, fontWeight: "800" }, headerText: { flex: 1, gap: 2 }, partyName: { color: theme.text, fontSize: compact ? 14 : 15, fontWeight: "800" }, contextLine: { color: theme.muted, fontSize: 10 }, livePill: { minHeight: 28, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: "#C9A96255", alignItems: "center", justifyContent: "center" }, syncingPill: { borderColor: theme.border }, liveText: { color: theme.accent, fontSize: 8, fontWeight: "900" }, syncingText: { color: theme.muted },
    messages: { paddingHorizontal: compact ? 12 : 16, paddingTop: 14, paddingBottom: 14, gap: 8, flexGrow: 1, justifyContent: "flex-end" }, bubble: { maxWidth: compact ? "86%" : "82%", borderRadius: 17, paddingHorizontal: compact ? 12 : 14, paddingVertical: 10 }, mine: { alignSelf: "flex-end", backgroundColor: theme.accent, borderBottomRightRadius: 5 }, theirs: { alignSelf: "flex-start", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 5 }, messageText: { color: theme.text, fontSize: compact ? 14 : 15, lineHeight: compact ? 20 : 21 }, mineText: { color: theme.background, fontWeight: "600" }, empty: { color: theme.muted, textAlign: "center", paddingVertical: 50, fontSize: 12, lineHeight: 19 },
    composer: { borderTopWidth: 1, borderTopColor: theme.border, paddingHorizontal: compact ? 10 : 12, paddingTop: 8, paddingBottom: 8, gap: 6, backgroundColor: theme.background }, composerRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 }, input: { flex: 1, maxHeight: 120, minHeight: compact ? 46 : 48, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, color: theme.text, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, fontSize: compact ? 14 : 15 }, sendButton: { width: compact ? 46 : 48, height: compact ? 46 : 48, borderRadius: 15, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }, sendDisabled: { opacity: 0.4 },
    error: { color: theme.text, textAlign: "center", fontSize: 16, lineHeight: 23 }, inlineError: { color: "#E59A9A", fontSize: 11, textAlign: "center" }, secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, minHeight: 48, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center" }, secondaryButtonText: { color: theme.text, fontWeight: "600" }, back: { color: theme.accent, fontSize: 13, fontWeight: "700", paddingVertical: 12, paddingHorizontal: 16 },
  });
}
